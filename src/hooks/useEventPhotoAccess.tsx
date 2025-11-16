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
        if (planValue === "PREMIUM") {
          return { canUpload: true, plan: planValue as SubscriptionPlan };
        }
      }

      return { canUpload: false, plan: "FREE" as SubscriptionPlan };
    },
    enabled: !!eventId,
  });
};
