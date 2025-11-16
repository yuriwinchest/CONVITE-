import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    console.log("Admin fetching all users");

    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) throw profilesError;

    // Buscar todas as assinaturas
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("*");

    if (subsError) throw subsError;

    // Buscar todas as compras de eventos pagos
    const { data: eventPurchases, error: purchasesError } = await supabase
      .from("event_purchases")
      .select("user_id, plan, payment_status")
      .eq("payment_status", "paid");

    if (purchasesError) throw purchasesError;

    // Buscar estatísticas de eventos e convidados por usuário
    const { data: eventStats, error: statsError } = await supabase
      .from("events")
      .select("user_id");

    if (statsError) throw statsError;

    const { data: guestStats, error: guestStatsError } = await supabase
      .from("guests")
      .select("event_id, events!inner(user_id)");

    if (guestStatsError) throw guestStatsError;

    // Criar mapas para facilitar o acesso
    const subscriptionMap = subscriptions.reduce((acc: any, sub: any) => {
      acc[sub.user_id] = sub;
      return acc;
    }, {});

    // Mapear compras de eventos por usuário (pegar o plano mais alto)
    const planHierarchy: any = { FREE: 0, ESSENTIAL: 1, PREMIUM: 2, PROFESSIONAL: 3 };
    const purchasesMap = eventPurchases.reduce((acc: any, purchase: any) => {
      if (!acc[purchase.user_id] || 
          planHierarchy[purchase.plan] > planHierarchy[acc[purchase.user_id]]) {
        acc[purchase.user_id] = purchase.plan;
      }
      return acc;
    }, {});

    const eventsCount = eventStats.reduce((acc: any, event: any) => {
      acc[event.user_id] = (acc[event.user_id] || 0) + 1;
      return acc;
    }, {});

    const guestsCount = guestStats.reduce((acc: any, guest: any) => {
      const userId = (guest as any).events.user_id;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    // Combinar os dados
    const users = profiles.map((profile: any) => {
      const subscription = subscriptionMap[profile.user_id];
      const purchasedPlan = purchasesMap[profile.user_id];
      
      // Se tem plano comprado (event_purchases), mostrar esse
      // Se tem assinatura ativa, mostrar essa
      // Senão, FREE
      let displayPlan = "FREE";
      let displayStatus = null;
      let expiresAt = null;
      
      if (purchasedPlan) {
        displayPlan = purchasedPlan;
        displayStatus = "paid";
        // Compras de eventos não têm vencimento
      } else if (subscription?.subscription_status === "active") {
        displayPlan = subscription.plan;
        displayStatus = subscription.subscription_status;
        expiresAt = subscription.current_period_end;
      }
      
      return {
        id: profile.user_id,
        email: profile.user_id,
        full_name: profile.full_name,
        plan: displayPlan,
        subscription_status: displayStatus,
        expires_at: expiresAt,
        events_count: eventsCount[profile.user_id] || 0,
        guests_count: guestsCount[profile.user_id] || 0,
        created_at: profile.created_at,
      };
    });

    return new Response(
      JSON.stringify({ users }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
