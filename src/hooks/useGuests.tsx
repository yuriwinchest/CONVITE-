import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  confirmed?: boolean;
  table_number?: number;
  qr_code?: string;
  checked_in_at?: string | null;
  created_at: string;
}

export interface GuestInput {
  name: string;
  email?: string;
  confirmed?: boolean;
  table_number?: number;
}

export const useGuests = (eventId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!eventId,
  });

  const addGuest = useMutation({
    mutationFn: async ({ eventId, guest }: { eventId: string; guest: GuestInput }) => {
      // Generate unique QR code
      const qrCode = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("guests")
        .insert({
          event_id: eventId,
          ...guest,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Convidado adicionado",
        description: "O convidado foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar convidado",
        description: "Não foi possível adicionar o convidado.",
        variant: "destructive",
      });
    },
  });

  const addMultipleGuests = useMutation({
    mutationFn: async ({ eventId, guests }: { eventId: string; guests: GuestInput[] }) => {
      const guestsWithEventId = guests.map(guest => ({
        event_id: eventId,
        ...guest,
        qr_code: crypto.randomUUID(), // Generate unique QR code for each guest
      }));

      const { data, error } = await supabase
        .from("guests")
        .insert(guestsWithEventId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Convidados adicionados",
        description: `${data?.length} convidados foram adicionados com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar convidados",
        description: "Não foi possível adicionar os convidados.",
        variant: "destructive",
      });
    },
  });

  const updateGuest = useMutation({
    mutationFn: async ({ guestId, guest }: { guestId: string; guest: Partial<GuestInput> }) => {
      const { data, error } = await supabase
        .from("guests")
        .update(guest)
        .eq("id", guestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Convidado atualizado",
        description: "As informações do convidado foram atualizadas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar convidado",
        description: "Não foi possível atualizar o convidado.",
        variant: "destructive",
      });
    },
  });

  const deleteGuest = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Convidado removido",
        description: "O convidado foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover convidado",
        description: "Não foi possível remover o convidado.",
        variant: "destructive",
      });
    },
  });

  const deleteMultipleGuests = useMutation({
    mutationFn: async (guestIds: string[]) => {
      const { error } = await supabase
        .from("guests")
        .delete()
        .in("id", guestIds);

      if (error) throw error;
    },
    onSuccess: (_, guestIds) => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Convidados removidos",
        description: `${guestIds.length} convidados foram removidos com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover convidados",
        description: "Não foi possível remover os convidados.",
        variant: "destructive",
      });
    },
  });

  const checkInGuest = useMutation({
    mutationFn: async (guestId: string) => {
      const { data, error } = await supabase
        .from("guests")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", guestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      toast({
        title: "Check-in realizado!",
        description: "Presença confirmada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer check-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    guests: guests || [],
    isLoading,
    addGuest: addGuest.mutate,
    addMultipleGuests: addMultipleGuests.mutate,
    updateGuest: updateGuest.mutate,
    deleteGuest: deleteGuest.mutate,
    deleteMultipleGuests: deleteMultipleGuests.mutate,
    checkInGuest: checkInGuest.mutate,
  };
};
