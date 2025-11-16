import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan } from "./useSubscription";

export const useEventPhotoAccess = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-photo-access", eventId],
    queryFn: async () => {
      if (!eventId) return { canUpload: false, plan: "FREE" as SubscriptionPlan };

      // Buscar plano do evento via purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from("event_purchases")
        .select("plan")
        .eq("event_id", eventId)
        .eq("payment_status", "paid")
        .maybeSingle();

      if (!purchaseError && purchase?.plan) {
        const planValue = purchase.plan as string;
        if (planValue === "PREMIUM" || planValue === "PROFESSIONAL") {
          return { canUpload: true, plan: planValue as SubscriptionPlan };
        }
      }

      // Verificar se o criador tem plano Professional
      const { data: event } = await supabase
        .from("events")
        .select("user_id")
        .eq("id", eventId)
        .single();

      if (event) {
        const { data: subscription, error: subError } = await supabase
          .from("user_subscriptions")
          .select("plan")
          .eq("user_id", event.user_id)
          .maybeSingle();

        if (!subError && subscription?.plan) {
          const planValue = subscription.plan as string;
          if (planValue === "PROFESSIONAL") {
            return { canUpload: true, plan: "PROFESSIONAL" as SubscriptionPlan };
          }
        }
      }

      return { canUpload: false, plan: "FREE" as SubscriptionPlan };
    },
    enabled: !!eventId,
  });
};
