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

    console.log("Admin fetching analytics");

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Assinaturas ativas
    const { count: activeSubscriptions } = await supabase
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active");

    // Total de eventos
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Total de convidados
    const { count: totalGuests } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true });

    // Distribuição de planos
    const { data: planDistribution } = await supabase
      .from("user_subscriptions")
      .select("plan");

    const planCounts = planDistribution?.reduce((acc: any, sub: any) => {
      acc[sub.plan] = (acc[sub.plan] || 0) + 1;
      return acc;
    }, {});

    // Compras de eventos
    const { data: eventPurchases } = await supabase
      .from("event_purchases")
      .select("amount, created_at")
      .eq("payment_status", "paid");

    const monthlyRevenue = eventPurchases?.reduce((total: number, purchase: any) => {
      const purchaseDate = new Date(purchase.created_at);
      const currentMonth = new Date().getMonth();
      if (purchaseDate.getMonth() === currentMonth) {
        return total + Number(purchase.amount);
      }
      return total;
    }, 0) || 0;

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalEvents: totalEvents || 0,
        totalGuests: totalGuests || 0,
        planDistribution: planCounts || {},
        monthlyRevenue,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
