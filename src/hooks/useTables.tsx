import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Table {
  id: string;
  event_id: string;
  table_number: number;
  capacity: number;
  created_at: string;
}

interface TableInput {
  table_number: number;
  capacity: number;
}

interface TableStats {
  totalTables: number;
  totalCapacity: number;
  occupiedSeats: number;
  availableSeats: number;
}

export function useTables(eventId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch tables for event
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("event_id", eventId)
        .order("table_number", { ascending: true });

      if (error) throw error;
      return data as Table[];
    },
    enabled: !!eventId,
  });

  // Fetch guests to calculate occupancy
  const { data: guests = [] } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", eventId);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Calculate stats
  const stats: TableStats = {
    totalTables: tables.length,
    totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
    occupiedSeats: guests.filter(g => g.table_number !== null).length,
    availableSeats: tables.reduce((sum, t) => sum + t.capacity, 0) - guests.filter(g => g.table_number !== null).length,
  };

  // Add single table
  const addTable = useMutation({
    mutationFn: async ({ eventId, table }: { eventId: string; table: TableInput }) => {
      const { data, error } = await supabase
        .from("tables")
        .insert({
          event_id: eventId,
          table_number: table.table_number,
          capacity: table.capacity,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Mesa criada!",
        description: "Mesa adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add multiple tables
  const addMultipleTables = useMutation({
    mutationFn: async ({ eventId, tables }: { eventId: string; tables: TableInput[] }) => {
      const tablesToInsert = tables.map(t => ({
        event_id: eventId,
        table_number: t.table_number,
        capacity: t.capacity,
      }));

      const { data, error } = await supabase
        .from("tables")
        .insert(tablesToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Mesas criadas!",
        description: `${data.length} mesas adicionadas com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar mesas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update table
  const updateTable = useMutation({
    mutationFn: async ({ tableId, capacity }: { tableId: string; capacity: number }) => {
      const { data, error } = await supabase
        .from("tables")
        .update({ capacity })
        .eq("id", tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Mesa atualizada!",
        description: "Capacidade atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete table
  const deleteTable = useMutation({
    mutationFn: async (tableId: string) => {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({
        title: "Mesa removida!",
        description: "Mesa excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tables,
    guests,
    isLoading,
    stats,
    addTable: addTable.mutate,
    addMultipleTables: addMultipleTables.mutate,
    updateTable: updateTable.mutate,
    deleteTable: deleteTable.mutate,
  };
}
