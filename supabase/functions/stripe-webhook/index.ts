import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Logging helper for debugging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Webhook request received");

  // Get Stripe secret key - check multiple possible names
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("vento");
  if (!stripeSecretKey) {
    logStep("ERROR: Missing Stripe secret key");
    return new Response("Missing Stripe secret key", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const signature = req.headers.get("stripe-signature");
  // Check multiple possible secret names for webhook
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("webhook");

  if (!signature) {
    logStep("ERROR: Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  if (!webhookSecret) {
    logStep("ERROR: Missing webhook secret - configure STRIPE_WEBHOOK_SECRET or webhook in secrets");
    return new Response("Missing webhook secret configuration", { status: 500 });
  }

  logStep("Secrets verified", { hasSignature: true, hasWebhookSecret: true });

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    logStep("Webhook event verified", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        console.log("Processing checkout.session.completed", { 
          userId, 
          plan, 
          sessionId: session.id,
          customer: session.customer,
          subscription: session.subscription 
        });

        if (userId && plan === "PREMIUM") {
          const { data, error } = await supabase
            .from("user_subscriptions")
            .upsert({
              user_id: userId,
              plan: "PREMIUM",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error("Error updating subscription:", error);
            throw error;
          }

          console.log("Premium subscription activated for user:", userId, { data });
        } else {
          console.log("Skipping subscription update - missing userId or not PREMIUM plan:", { userId, plan });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log("Payment intent succeeded:", paymentIntent.id, "Metadata:", paymentIntent.metadata);
        
        // Primeiro tenta buscar pelo payment_intent_id
        let { data: purchase, error: purchaseError } = await supabase
          .from("event_purchases")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .select()
          .single();

        // Verificar se é um upgrade
        if (paymentIntent.metadata?.isUpgrade === "true" && paymentIntent.metadata?.purchaseId) {
          console.log("Processing upgrade payment for purchase:", paymentIntent.metadata.purchaseId);
          
          // Atualizar para PREMIUM/paid agora que o pagamento foi confirmado
          const { error: upgradeError } = await supabase
            .from("event_purchases")
            .update({
              plan: paymentIntent.metadata.targetPlan,
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
              amount: parseFloat(paymentIntent.metadata.finalAmount || "149.00"),
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentIntent.metadata.purchaseId);

          if (upgradeError) {
            console.error("Error updating upgrade:", upgradeError);
          } else {
            console.log("Upgrade completed successfully");
            
            // Enviar notificação de upgrade
            try {
              await supabase.functions.invoke("send-subscription-notification", {
                body: {
                  userId: paymentIntent.metadata.userId,
                  type: "upgrade",
                  plan: paymentIntent.metadata.targetPlan,
                  previousPlan: paymentIntent.metadata.currentPlan,
                  eventId: paymentIntent.metadata.eventId
                }
              });
            } catch (notifError) {
              console.error("Error sending upgrade notification:", notifError);
            }
          }
        } else if (purchaseError && paymentIntent.metadata?.eventId && paymentIntent.metadata?.userId) {
          // Lógica original para compras novas - buscar por metadados
          console.log("Attempting to find purchase by metadata:", paymentIntent.metadata);
          
          const { data: foundPurchase, error: findError } = await supabase
            .from("event_purchases")
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq("event_id", paymentIntent.metadata.eventId)
            .eq("user_id", paymentIntent.metadata.userId)
            .eq("payment_status", "pending")
            .select()
            .single();
            
          if (!findError && foundPurchase) {
            purchase = foundPurchase;
            console.log("Found and updated purchase by metadata:", foundPurchase.id);
          } else {
            console.error("Failed to find purchase by metadata:", findError);
          }
        }

        console.log("Payment confirmed:", paymentIntent.id, "Purchase:", purchase?.id);
        
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

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription.updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        });

        // Buscar o user_id pela subscription_id
        const { data: userSub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (userSub) {
          await supabase
            .from("user_subscriptions")
            .update({
              subscription_status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          // Enviar notificação de renovação
          if (subscription.status === "active") {
            await supabase.functions.invoke("send-subscription-notification", {
              body: {
                userId: userSub.user_id,
                type: "renewal",
                subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              },
            });
          }

          console.log("Subscription updated:", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription.deleted", { subscriptionId: subscription.id });

        // Buscar o user_id pela subscription_id
        const { data: userSub } = await supabase
          .from("user_subscriptions")
          .select("user_id, current_period_end")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (userSub) {
          await supabase
            .from("user_subscriptions")
            .update({
              plan: "FREE",
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          // Enviar notificação de cancelamento
          await supabase.functions.invoke("send-subscription-notification", {
            body: {
              userId: userSub.user_id,
              type: "cancellation",
              subscriptionEnd: userSub.current_period_end,
            },
          });

          console.log("Subscription canceled:", subscription.id);
        }
        break;
      }

      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log("Processing invoice.upcoming", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });

        if (invoice.subscription) {
          // Buscar o user_id pela subscription_id
          const { data: userSub } = await supabase
            .from("user_subscriptions")
            .select("user_id, current_period_end")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single();

          if (userSub && userSub.current_period_end) {
            const daysUntilRenewal = Math.ceil(
              (new Date(userSub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            // Enviar notificação apenas se faltar 7 dias ou menos
            if (daysUntilRenewal <= 7) {
              await supabase.functions.invoke("send-subscription-notification", {
                body: {
                  userId: userSub.user_id,
                  type: "upcoming_renewal",
                  subscriptionEnd: userSub.current_period_end,
                  daysUntilRenewal,
                },
              });

              console.log("Upcoming renewal notification sent:", { daysUntilRenewal });
            }
          }
        }
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
