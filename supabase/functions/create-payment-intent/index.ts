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
      ESSENTIAL: { amount: 79.00, price_id: "price_ESSENTIAL_PLACEHOLDER" },
      PREMIUM: { amount: 149.00, price_id: "price_PREMIUM_PLACEHOLDER" }
    };
    const priceConfig = priceConfigs[plan];

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(priceConfig.amount * 100), // Server-controlled amount
      currency: "brl",
      metadata: {
        userId: user.id,
        eventId,
        plan,
      },
    });

    // Criar registro no banco de dados
    const { error: dbError } = await supabase
      .from("event_purchases")
      .insert({
        event_id: eventId,
        user_id: user.id,
        plan,
        amount: priceConfig.amount,
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "pending",
      });

    if (dbError) throw dbError;

    console.log("Payment Intent created:", paymentIntent.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
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
