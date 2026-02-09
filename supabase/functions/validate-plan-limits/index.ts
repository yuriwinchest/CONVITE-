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

    console.log("🔍 [validate-plan-limits] Checking limits for user:", user.id);

    // ✅ VERIFICAR SE É ADMIN - ADMINS NÃO TÊM LIMITES
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) {
      console.log("✅ [validate-plan-limits] User is ADMIN - bypassing all limits");
      return new Response(
        JSON.stringify({
          allowed: true,
          reason: "admin",
          message: "Admin users have unlimited access"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log("📋 [validate-plan-limits] User is not admin, checking plan limits...");

    const { action, eventId, guestCount } = await req.json();

    // Buscar assinatura do usuário
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = subscription?.plan || "FREE";

    // Check for promo code in user metadata
    const promoCode = user.user_metadata?.promo_code;
    const hasPromo = promoCode === "ESPECIAL" || promoCode === "VIP" || !!promoCode;

    if (action === "create_event") {
      if (plan === "FREE") {
        const { count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Promo users get 2 events total, regular users get 1
        const limit = hasPromo ? 2 : 1;

        if ((count || 0) >= limit) {
          return new Response(
            JSON.stringify({
              allowed: false,
              message: hasPromo
                ? `Limite promocional de ${limit} eventos atingido`
                : "Plano gratuito permite apenas 1 evento",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403,
            }
          );
        }
      } else if (plan === "PREMIUM") {
        // Verificar limite de 20 eventos por mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth.toISOString());

        if ((count || 0) >= 20) {
          return new Response(
            JSON.stringify({
              allowed: false,
              message: "Limite de 20 eventos por mês atingido",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403,
            }
          );
        }
      }
      // ESSENTIAL: sem limite (pagamento por evento)
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

      // Default limits
      let limit = 50;

      if (eventPlan === "ESSENTIAL") limit = 200;
      if (eventPlan === "PREMIUM") limit = Infinity;

      // Promo users override FREE limit to Infinity (Premium benefits)
      if (hasPromo && (!eventPlan || eventPlan === "FREE")) {
        limit = Infinity;
      }

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
