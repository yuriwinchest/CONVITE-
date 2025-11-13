import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan } from "./useSubscription";

interface EventPurchase {
  id: string;
  event_id: string;
  plan: SubscriptionPlan;
  amount: number;
  payment_status: string;
}

export const useEventPurchase = (eventId: string | undefined) => {
  const { data: purchase, isLoading } = useQuery({
    queryKey: ["event-purchase", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("event_purchases")
        .select("*")
        .eq("event_id", eventId)
        .eq("payment_status", "paid")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as EventPurchase | null;
    },
    enabled: !!eventId,
  });

  const hasActivePlan = !!purchase && purchase.payment_status === "paid";
  const eventPlan = purchase?.plan;

  return {
    purchase,
    isLoading,
    hasActivePlan,
    eventPlan,
  };
};
