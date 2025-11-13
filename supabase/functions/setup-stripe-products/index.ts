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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user (admin-only function)
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
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

    console.log("Iniciando criação de produtos no Stripe...");

    // 1. Criar Produto ESSENTIAL (One-time Payment)
    console.log("Criando produto Essential...");
    const essentialProduct = await stripe.products.create({
      name: "Plano Essential",
      description: "Até 200 convidados por evento",
    });

    const essentialPrice = await stripe.prices.create({
      product: essentialProduct.id,
      unit_amount: 7900, // R$ 79,00 em centavos
      currency: "brl",
    });

    console.log("Essential criado:", { 
      product_id: essentialProduct.id, 
      price_id: essentialPrice.id 
    });

    // 2. Criar Produto PREMIUM (One-time Payment)
    console.log("Criando produto Premium...");
    const premiumProduct = await stripe.products.create({
      name: "Plano Premium",
      description: "Convidados ilimitados por evento",
    });

    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 14900, // R$ 149,00 em centavos
      currency: "brl",
    });

    console.log("Premium criado:", { 
      product_id: premiumProduct.id, 
      price_id: premiumPrice.id 
    });

    // 3. Criar Produto PROFESSIONAL (Recurring Subscription)
    console.log("Criando produto Professional...");
    const professionalProduct = await stripe.products.create({
      name: "Plano Professional",
      description: "Eventos e convidados ilimitados",
    });

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 9700, // R$ 97,00 em centavos
      currency: "brl",
      recurring: {
        interval: "month",
      },
    });

    console.log("Professional criado:", { 
      product_id: professionalProduct.id, 
      price_id: professionalPrice.id 
    });

    const result = {
      essential: {
        product_id: essentialProduct.id,
        price_id: essentialPrice.id,
        amount: 79.00,
        currency: "BRL",
      },
      premium: {
        product_id: premiumProduct.id,
        price_id: premiumPrice.id,
        amount: 149.00,
        currency: "BRL",
      },
      professional: {
        product_id: professionalProduct.id,
        price_id: professionalPrice.id,
        amount: 97.00,
        currency: "BRL",
        recurring: "monthly",
      },
    };

    console.log("Produtos criados com sucesso:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao criar produtos:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
