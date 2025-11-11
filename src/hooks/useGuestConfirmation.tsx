import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventDetails {
  id: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  table_map_url: string | null;
}

interface GuestSearchResult {
  id: string;
  name: string;
  email: string | null;
  table_number: number | null;
  confirmed: boolean;
  event_name: string;
  event_date: string;
  event_location: string | null;
}

export function useGuestConfirmation(eventId: string) {
  const { toast } = useToast();
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Fetch event details on mount
  useEffect(() => {
    if (!eventId) {
      setIsLoadingEvent(false);
      return;
    }
    
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_public_event_details", { p_event_id: eventId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log("Event details loaded:", data[0]);
        console.log("Table map URL:", data[0].table_map_url);
        setEventDetails(data[0]);
      } else {
        console.log("No event data found");
        setEventDetails(null);
      }
    } catch (error: any) {
      console.error("Error fetching event details:", error);
      toast({
        title: "Erro ao carregar evento",
        description: "Não foi possível carregar os detalhes do evento.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEvent(false);
    }
  };

  const searchGuest = async (guestName: string): Promise<GuestSearchResult | null> => {
    try {
      const { data, error } = await supabase
        .rpc("search_guest_by_name", {
          p_event_id: eventId,
          p_name: guestName.trim(),
        });

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error: any) {
      console.error("Error searching guest:", error);
      throw error;
    }
  };

  const confirmPresence = async (guestId: string) => {
    try {
      const { data, error } = await supabase
        .rpc("confirm_guest_presence", { p_guest_id: guestId });

      if (error) throw error;

      // Call edge function to notify creator
      if (data) {
        try {
          const result = data as any;
          await supabase.functions.invoke("notify-confirmation", {
            body: {
              guestName: result.guestName,
              tableNumber: result.tableNumber,
              eventId: result.eventId,
              eventName: result.eventName,
              creatorUserId: result.creatorUserId,
            },
          });
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
          // Don't throw - confirmation succeeded, notification is secondary
        }
      }

      return data;
    } catch (error: any) {
      console.error("Error confirming presence:", error);
      throw error;
    }
  };

  const getEventDetails = async (): Promise<EventDetails | null> => {
    return eventDetails;
  };

  const isCheckInAllowed = (): { allowed: boolean; message?: string; timeUntil?: number } => {
    if (!eventDetails) {
      return { allowed: false, message: "Evento não encontrado" };
    }

    const now = new Date().getTime();
    const eventTime = new Date(eventDetails.date).getTime();
    
    if (now < eventTime) {
      const timeUntil = eventTime - now;
      return { 
        allowed: false, 
        message: `Check-in disponível apenas a partir de ${format(new Date(eventDetails.date), "PPP 'às' HH:mm", { locale: ptBR })}`,
        timeUntil 
      };
    }

    return { allowed: true };
  };

  return {
    searchGuest,
    confirmPresence,
    getEventDetails,
    eventDetails,
    isLoadingEvent,
    isCheckInAllowed,
  };
}
