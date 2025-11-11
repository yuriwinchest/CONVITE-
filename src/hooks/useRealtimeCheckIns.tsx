import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RealtimeCheckInPayload {
  checked_in_at: string | null;
  name: string;
  table_number?: number | null;
}

export const useRealtimeCheckIns = (eventId: string | undefined) => {
  useEffect(() => {
    if (!eventId) return;

    console.log(`🔔 Iniciando escuta de check-ins em tempo real para evento: ${eventId}`);

    // Subscribe to realtime changes on guests table
    const channel = supabase
      .channel(`guests-checkin-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('📨 Mudança detectada na tabela guests:', payload);

          const newData = payload.new as RealtimeCheckInPayload;
          const oldData = payload.old as RealtimeCheckInPayload;

          // Check if this is a new check-in (checked_in_at changed from null to a value)
          if (!oldData.checked_in_at && newData.checked_in_at) {
            console.log(`✅ Novo check-in detectado: ${newData.name}`);
            
            const checkInTime = new Date(newData.checked_in_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            
            toast({
              title: "✅ Novo Check-in Realizado!",
              description: `${newData.name}${newData.table_number ? ` - Mesa ${newData.table_number}` : ''} fez check-in às ${checkInTime}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Status da conexão realtime: ${status}`);
      });

    // Cleanup on unmount
    return () => {
      console.log(`🔕 Removendo escuta de check-ins para evento: ${eventId}`);
      supabase.removeChannel(channel);
    };
  }, [eventId]);
};
