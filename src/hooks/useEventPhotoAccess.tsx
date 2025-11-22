import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan } from "./useSubscription";

export const useEventPhotoAccess = (
  eventId: string | undefined,
  isGuestAccess: boolean = false
) => {
  return useQuery({
    queryKey: ["event-photo-access", eventId, isGuestAccess],
    queryFn: async () => {
      console.log("🔍 [useEventPhotoAccess] Starting photo access check", { eventId, isGuestAccess });

      if (!eventId) {
        console.log("❌ [useEventPhotoAccess] No eventId provided");
        return { canUpload: false, plan: "FREE" as SubscriptionPlan };
      }

      try {
        // Primeiro, verificar se o criador do evento é admin (aplica tanto para guest quanto user autenticado)
        console.log("🔍 [useEventPhotoAccess] Checking if event creator is admin...");
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("user_id")
          .eq("id", eventId)
          .maybeSingle();

        if (eventError) {
          console.error("❌ [useEventPhotoAccess] Error fetching event:", eventError);
        }

        if (event?.user_id) {
          // Verificar se o criador do evento tem role de admin
          let isAdminRole = false;
          try {
            const { data: adminRole } = await supabase
              .from("user_roles" as any)
              .select("role")
              .eq("user_id", event.user_id)
              .eq("role", "admin")
              .maybeSingle();
            
            isAdminRole = !!adminRole;
            
            if (isAdminRole) {
              console.log("✅ [useEventPhotoAccess] Event creator has admin role - granting PREMIUM access");
              return { canUpload: true, plan: "PREMIUM" as SubscriptionPlan };
            }
          } catch (error) {
            console.error("❌ [useEventPhotoAccess] Error checking admin role:", error);
          }
        }

        // Se é acesso de convidado, pular verificação de usuário autenticado
        if (isGuestAccess) {
          console.log("👥 [useEventPhotoAccess] Guest access mode - checking event purchase only");
          
          const { data: purchase, error: purchaseError } = await supabase
            .from("event_purchases")
            .select("plan")
            .eq("event_id", eventId)
            .eq("payment_status", "paid")
            .maybeSingle();

          if (purchaseError) {
            console.error("❌ [useEventPhotoAccess] Error checking event purchases:", purchaseError);
            return { canUpload: false, plan: "FREE" as SubscriptionPlan };
          }

          if (purchase?.plan === "PREMIUM") {
            console.log("✅ [useEventPhotoAccess] Event has PREMIUM plan");
            return { canUpload: true, plan: "PREMIUM" as SubscriptionPlan };
          }

          console.log("📋 [useEventPhotoAccess] Event has FREE plan");
          return { canUpload: false, plan: "FREE" as SubscriptionPlan };
        }

        // Verificar assinatura do usuário primeiro (apenas para usuários autenticados)
        console.log("👤 [useEventPhotoAccess] Checking user subscription...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("❌ [useEventPhotoAccess] Error getting user:", userError);
        }

        if (user) {
          console.log("✅ [useEventPhotoAccess] User found:", user.id);
          const { data: subscription, error: subError } = await supabase
            .from("user_subscriptions")
            .select("plan")
            .eq("user_id", user.id)
            .maybeSingle();

          if (subError) {
            console.error("❌ [useEventPhotoAccess] Error checking subscription:", subError);
          }

          if (subscription?.plan === "PREMIUM") {
            console.log("✅ [useEventPhotoAccess] User has PREMIUM subscription");
            return { canUpload: true, plan: "PREMIUM" as SubscriptionPlan };
          }
        } else {
          console.log("ℹ️ [useEventPhotoAccess] No authenticated user");
        }

        // Se não tem assinatura PREMIUM, verificar compra do evento
        console.log("💳 [useEventPhotoAccess] Checking event purchases...");
        const { data: purchase, error: purchaseError } = await supabase
          .from("event_purchases")
          .select("plan")
          .eq("event_id", eventId)
          .eq("payment_status", "paid")
          .maybeSingle();

        if (purchaseError) {
          console.error("❌ [useEventPhotoAccess] Error checking event purchases:", purchaseError);
          // Se houver erro na tabela event_purchases, retornar FREE ao invés de travar
          console.log("⚠️ [useEventPhotoAccess] Defaulting to FREE plan due to error");
          return { canUpload: false, plan: "FREE" as SubscriptionPlan };
        }

        if (purchase?.plan) {
          console.log("✅ [useEventPhotoAccess] Found event purchase with plan:", purchase.plan);
          const planValue = purchase.plan as string;
          if (planValue === "PREMIUM") {
            return { canUpload: true, plan: planValue as SubscriptionPlan };
          }
        } else {
          console.log("ℹ️ [useEventPhotoAccess] No event purchase found");
        }

        console.log("📋 [useEventPhotoAccess] Defaulting to FREE plan");
        return { canUpload: false, plan: "FREE" as SubscriptionPlan };
      } catch (error) {
        console.error("❌ [useEventPhotoAccess] Unexpected error:", error);
        // Em caso de erro, retornar FREE ao invés de travar
        return { canUpload: false, plan: "FREE" as SubscriptionPlan };
      }
    },
    enabled: !!eventId,
    retry: false, // Não tentar novamente em caso de erro
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};
