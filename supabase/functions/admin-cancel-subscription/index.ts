import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verificar se é admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { target_user_id } = await req.json();
    
    console.log("Admin canceling subscription for user:", target_user_id);

    // Buscar assinatura do usuário alvo
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", target_user_id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found");
    }

    // Cancelar no Stripe
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Atualizar no banco
    await supabase
      .from("user_subscriptions")
      .update({
        subscription_status: "canceled",
        plan: "FREE",
      })
      .eq("user_id", target_user_id);

    // Registrar ação
    await supabase
      .from("admin_action_logs")
      .insert({
        admin_user_id: user.id,
        action_type: "cancel_subscription",
        target_user_id: target_user_id,
        details: {
          subscription_id: subscription.stripe_subscription_id,
          previous_plan: subscription.plan,
        },
      });

    console.log("Subscription canceled successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
