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

    // Validate UUID format before fetching
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(eventId)) {
      console.error("Invalid event ID format:", eventId);
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
        console.log("Evento não encontrado para ID:", eventId);
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

  const searchGuestAcrossEvents = async (
    guestName: string,
    limit = 5,
  ): Promise<
    {
      guest_id: string;
      guest_name: string;
      event_id: string;
      event_name: string;
      event_date: string;
      event_location: string | null;
      table_number: number | null;
      confirmed: boolean;
    }[]
  > => {
    try {
      console.log("🔍 Searching globally for:", guestName);

      // @ts-ignore - RPC not yet in types
      const { data, error } = await supabase
        .rpc("search_guest_globally", {
          query_name: guestName,
          match_limit: limit
        });

      if (error) {
        console.error("❌ Error in global search query:", error);
        throw error;
      }

      console.log("✅ Global search results:", data);

      if (!data) return [];

      return (data as any[]).map((guest: any) => ({
        guest_id: guest.guest_id,
        guest_name: guest.guest_name,
        event_id: guest.event_id,
        event_name: guest.event_name,
        event_date: guest.event_date,
        event_location: guest.event_location,
        table_number: guest.table_number,
        confirmed: guest.confirmed,
      }));
    } catch (error: any) {
      console.error("Error searching guest globally:", error);
      throw error;
    }
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

    // Check if event has ended (3 hours after start)
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    if (now > eventTime + threeHoursInMs) {
      return {
        allowed: false,
        message: "O período de check-in para este evento já encerrou (limite de 3 horas após o início).",
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
    searchGuestAcrossEvents,
  };
}
