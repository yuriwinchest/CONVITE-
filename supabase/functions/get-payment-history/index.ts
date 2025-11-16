import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PAYMENT-HISTORY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const keyFromVento = Deno.env.get("vento") || "";
    const keyFromStripe = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const STRIPE_KEY = keyFromVento || keyFromStripe;
    if (!STRIPE_KEY) {
      throw new Error("Stripe secret key not configured in secrets.");
    }
    logStep("Stripe key source decided", { source: keyFromVento ? "vento" : "STRIPE_SECRET_KEY" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-08-27.basil" });
    
    // Buscar customer do Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscription: null,
        invoices: [],
        upcomingInvoice: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar assinatura ativa
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscriptionData = null;
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      subscriptionData = {
        id: sub.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        plan: sub.items.data[0].price.product as string,
        amount: sub.items.data[0].price.unit_amount,
        interval: sub.items.data[0].price.recurring?.interval,
      };
      logStep("Active subscription found", subscriptionData);
    }

    // Buscar histórico de faturas (últimas 12)
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 12,
    });

    const invoiceHistory = invoices.data.map((invoice: Stripe.Invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      created: new Date(invoice.created * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    }));

    logStep("Invoice history retrieved", { count: invoiceHistory.length });

    // Buscar próxima fatura (se houver assinatura ativa)
    let upcomingInvoice = null;
    if (subscriptionData) {
      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          customer: customerId,
        });
        upcomingInvoice = {
          amount: upcoming.amount_due,
          period_start: upcoming.period_start ? new Date(upcoming.period_start * 1000).toISOString() : null,
          period_end: upcoming.period_end ? new Date(upcoming.period_end * 1000).toISOString() : null,
        };
        logStep("Upcoming invoice retrieved", upcomingInvoice);
      } catch (error) {
        logStep("No upcoming invoice found");
      }
    }

    return new Response(JSON.stringify({
      subscription: subscriptionData,
      invoices: invoiceHistory,
      upcomingInvoice,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
