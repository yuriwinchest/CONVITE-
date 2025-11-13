import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, eventId, guestCount } = await req.json();

    // Buscar assinatura do usuário
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = subscription?.plan || "FREE";

    if (action === "create_event") {
      if (plan === "FREE") {
        const { count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if ((count || 0) >= 1) {
          return new Response(
            JSON.stringify({
              allowed: false,
              message: "Plano gratuito permite apenas 1 evento",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403,
            }
          );
        }
      }
    }

    if (action === "add_guests" && eventId) {
      // Verificar se evento tem plano comprado
      const { data: purchase } = await supabase
        .from("event_purchases")
        .select("plan")
        .eq("event_id", eventId)
        .eq("payment_status", "paid")
        .single();

      const eventPlan = purchase?.plan || plan;
      let limit = 50;

      if (eventPlan === "ESSENTIAL") limit = 200;
      if (eventPlan === "PREMIUM" || eventPlan === "PROFESSIONAL") limit = Infinity;

      if (limit !== Infinity && guestCount > limit) {
        return new Response(
          JSON.stringify({
            allowed: false,
            message: `Limite de ${limit} convidados atingido`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ allowed: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
