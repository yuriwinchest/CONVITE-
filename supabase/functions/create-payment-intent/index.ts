import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const { plan, eventId } = await req.json();

    if (!plan || !eventId) {
      throw new Error("Missing required parameters");
    }

    // Validate plan
    const validPlans = ["ESSENTIAL", "PREMIUM"] as const;
    if (!validPlans.includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Verify user owns the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("user_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event || event.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Event not found or not owned" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get amount from server-side config (never trust client)
    const priceConfigs: Record<string, { amount: number; price_id: string }> = {
      ESSENTIAL: { amount: 79.00, price_id: "price_1ST7jePLqFlDnWiItuRHaCDV" },
      PREMIUM: { amount: 149.00, price_id: "price_1ST7k0PLqFlDnWiIbfCIajPf" }
    };
    const priceConfig = priceConfigs[plan];

    // Verificar se já existe uma compra para este evento
    const { data: existingPurchase } = await supabase
      .from("event_purchases")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    // Se já existe uma compra paga, informar o usuário
    if (existingPurchase && existingPurchase.payment_status === "paid") {
      return new Response(
        JSON.stringify({ 
          error: "Este evento já possui um plano ativo",
          currentPlan: existingPurchase.plan
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar ou criar cliente Stripe
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
    }

    // Criar sessão de Checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Plano ${plan}`,
              description: plan === "ESSENTIAL" 
                ? "Até 200 convidados por evento"
                : "Convidados ilimitados por evento"
            },
            unit_amount: Math.round(priceConfig.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/events/${eventId}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/events/${eventId}?payment=cancelled`,
      metadata: {
        userId: user.id,
        eventId,
        plan,
      },
    });

    // Criar ou atualizar registro no banco de dados
    if (existingPurchase) {
      // Atualizar compra existente
      await supabase
        .from("event_purchases")
        .update({
          plan,
          amount: priceConfig.amount,
          stripe_payment_intent_id: session.payment_intent as string,
          payment_status: "pending",
        })
        .eq("id", existingPurchase.id);
    } else {
      // Criar nova compra
      await supabase
        .from("event_purchases")
        .insert({
          event_id: eventId,
          user_id: user.id,
          plan,
          amount: priceConfig.amount,
          stripe_payment_intent_id: session.payment_intent as string,
          payment_status: "pending",
        });
    }

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
