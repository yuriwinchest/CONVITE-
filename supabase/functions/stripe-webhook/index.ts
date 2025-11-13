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

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
const webhookSecret =
  Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("webhook");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan === "PROFESSIONAL") {
          await supabase
            .from("user_subscriptions")
            .update({
              plan: "PROFESSIONAL",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
            })
            .eq("user_id", userId);

          console.log("Professional subscription activated for user:", userId);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from("event_purchases")
          .update({
            payment_status: "paid",
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        console.log("Payment confirmed:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from("event_purchases")
          .update({
            payment_status: "failed",
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("user_subscriptions")
          .update({
            plan: "FREE",
            subscription_status: "canceled",
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("Subscription canceled:", subscription.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
