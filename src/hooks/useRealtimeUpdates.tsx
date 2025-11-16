import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para atualizar automaticamente as queries quando há mudanças no banco
 */
export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Escutar mudanças na tabela events
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
        }
      )
      .subscribe();

    // Escutar mudanças na tabela event_purchases
    const purchasesChannel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_purchases'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
          queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    // Escutar mudanças na tabela user_subscriptions
    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
          queryClient.invalidateQueries({ queryKey: ["user-event-plans"] });
        }
      )
      .subscribe();

    // Limpar subscriptions ao desmontar
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [queryClient]);
};
