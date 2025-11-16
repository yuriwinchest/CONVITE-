import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { purchaseId } = await req.json();

    if (!purchaseId) {
      throw new Error("Missing purchaseId");
    }

    // Verificar que o upgrade está pendente e pertence ao usuário
    const { data: purchase, error: purchaseError } = await supabase
      .from("event_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .eq("payment_status", "pending")
      .eq("plan", "PREMIUM")
      .single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ 
          error: "Upgrade não encontrado ou já processado" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Reverter para o plano anterior (ESSENTIAL/paid)
    const { error: updateError } = await supabase
      .from("event_purchases")
      .update({
        plan: "ESSENTIAL",
        payment_status: "paid",
        amount: 79.00,
        stripe_payment_intent_id: null
      })
      .eq("id", purchaseId);

    if (updateError) {
      throw updateError;
    }

    console.log("Upgrade canceled, reverted to ESSENTIAL:", purchaseId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Upgrade cancelado com sucesso"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error canceling upgrade:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
