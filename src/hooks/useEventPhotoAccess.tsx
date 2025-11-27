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
        // Usar a função RPC que verifica admin + premium de forma segura
        console.log("🔍 [useEventPhotoAccess] Checking photo access via RPC...");
        const { data: accessData, error: rpcError } = await supabase
          .rpc("check_event_photo_access", { p_event_id: eventId });

        if (rpcError) {
          console.error("❌ [useEventPhotoAccess] Error checking photo access:", rpcError);
          return { canUpload: false, plan: "FREE" as SubscriptionPlan };
        }

        // Verificar validade do evento (30 dias)
        const { data: eventData } = await supabase
          .from("events")
          .select("date")
          .eq("id", eventId)
          .single();

        let isExpired = false;
        if (eventData) {
          const eventDate = new Date(eventData.date);
          const expirationDate = new Date(eventDate);
          expirationDate.setDate(eventDate.getDate() + 30);

          if (new Date() > expirationDate) {
            console.log("⚠️ [useEventPhotoAccess] Event photos expired (30 days limit)");
            isExpired = true;
          }
        }

        if (accessData) {
          console.log("✅ [useEventPhotoAccess] Access check result:", accessData);
          const result = accessData as { canUpload: boolean; plan: string };
          return {
            canUpload: result.canUpload && !isExpired,
            plan: result.plan as SubscriptionPlan,
            isExpired,
          };
        }

        // Se não tem acesso de convidado, ainda verificar assinatura do usuário logado
        if (!isGuestAccess) {
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
              return {
                canUpload: true && !isExpired,
                plan: "PREMIUM" as SubscriptionPlan,
                isExpired
              };
            }
          }
        }

        console.log("📋 [useEventPhotoAccess] Defaulting to FREE plan");
        return { canUpload: false, plan: "FREE" as SubscriptionPlan, isExpired };
      } catch (error) {
        console.error("❌ [useEventPhotoAccess] Unexpected error:", error);
        // Em caso de erro, retornar FREE ao invés de travar
        return { canUpload: false, plan: "FREE" as SubscriptionPlan, isExpired: false };
      }
    },
    enabled: !!eventId,
    retry: false, // Não tentar novamente em caso de erro
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};
