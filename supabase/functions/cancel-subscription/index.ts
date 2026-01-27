import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const STRIPE_KEY = Deno.env.get("vento") || Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2025-08-27.basil",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const userEmail = user.email;
    logStep("User authenticated", { userId: user.id, email: userEmail });

    // Buscar nome do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.full_name || "";

    // Buscar assinatura do usuário
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError) {
      logStep("Subscription query error", { error: subError });
      throw new Error("Erro ao buscar dados da assinatura.");
    }

    if (!subscription?.stripe_subscription_id) {
      throw new Error("Nenhuma assinatura ativa encontrada para cancelar.");
    }

    logStep("Found subscription", { 
      subscriptionId: subscription.stripe_subscription_id,
      plan: subscription.plan 
    });

    // Cancelar assinatura no Stripe ao final do período atual
    // Isso evita cobrança imediata e dá ao usuário acesso até o fim do período pago
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    const periodEnd = canceledSubscription.current_period_end;
    logStep("Subscription set to cancel at period end", { 
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      currentPeriodEnd: periodEnd
    });

    // Atualizar status no banco de dados
    await supabase
      .from("user_subscriptions")
      .update({
        subscription_status: "canceling",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    logStep("Database updated successfully");

    // Calcular data de cancelamento com segurança
    const cancelAtDate = periodEnd 
      ? new Date(periodEnd * 1000).toISOString() 
      : null;

    // Enviar email de confirmação de cancelamento
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-cancellation-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          email: userEmail,
          userName: userName,
          cancelAt: cancelAtDate,
        }),
      });
      logStep("Cancellation email sent");
    } catch (emailError) {
      logStep("Failed to send cancellation email", { error: emailError });
      // Não falhar a operação por causa do email
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Assinatura será cancelada ao final do período atual.",
        cancel_at: cancelAtDate
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
