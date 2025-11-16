import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "FREE" | "ESSENTIAL" | "PREMIUM";

interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export const useSubscription = () => {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["user-subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_subscriptions" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as UserSubscription | null;
    },
  });

  const plan = subscription?.plan || "FREE";

  const getEventLimit = (): number => {
    if (plan === "PREMIUM") return 20; // 20 eventos por mês
    if (plan === "FREE") return 1;
    return Infinity; // ESSENTIAL é por evento, sem limite na conta
  };

  const getGuestLimit = (eventPlan?: SubscriptionPlan): number => {
    const activePlan = eventPlan || plan;
    
    if (activePlan === "FREE") return 50;
    if (activePlan === "ESSENTIAL") return 200;
    if (activePlan === "PREMIUM") return Infinity;
    
    return 50;
  };

  const canCreateEvent = async (): Promise<{ allowed: boolean; message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: false, message: "Usuário não autenticado" };

    const limit = getEventLimit();
    if (limit === Infinity) return { allowed: true };

    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) throw error;

    if ((count || 0) >= limit) {
      return {
        allowed: false,
        message: `Você atingiu o limite do plano ${plan} (${limit} evento). Faça upgrade para criar mais eventos!`,
      };
    }

    return { allowed: true };
  };

  const canAddGuests = async (
    eventId: string,
    currentCount: number,
    toAdd: number
  ): Promise<{ allowed: boolean; message?: string; limit: number }> => {
    // Verificar se o evento tem um plano comprado
    const { data: purchase } = await supabase
      .from("event_purchases" as any)
      .select("plan")
      .eq("event_id", eventId)
      .eq("payment_status", "paid")
      .maybeSingle();

    const eventPlan = (purchase as any)?.plan as SubscriptionPlan | undefined;
    const limit = getGuestLimit(eventPlan);
    const newTotal = currentCount + toAdd;

    if (limit === Infinity) {
      return { allowed: true, limit };
    }

    if (newTotal > limit) {
      const planName = eventPlan || plan;
      return {
        allowed: false,
        message: `Você atingiu o limite do plano ${planName} (${limit} convidados). ${
          planName === "FREE"
            ? "Escolha um plano para adicionar mais convidados!"
            : "Faça upgrade para Premium para convidados ilimitados!"
        }`,
        limit,
      };
    }

    return { allowed: true, limit };
  };

  return {
    subscription,
    plan,
    isLoading,
    canCreateEvent,
    canAddGuests,
    getEventLimit,
    getGuestLimit,
  };
};
