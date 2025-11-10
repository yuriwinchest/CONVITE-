import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get current month events
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: activeEvents, error: eventsError } = await supabase
        .from("events")
        .select("id")
        .gte("date", startOfMonth.toISOString());

      if (eventsError) throw eventsError;

      // Get total guests
      const { count: totalGuests, error: guestsError } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true });

      if (guestsError) throw guestsError;

      // Get total table capacity
      const { data: tables, error: tablesError } = await supabase
        .from("tables")
        .select("capacity");

      if (tablesError) throw tablesError;

      const totalCapacity = tables?.reduce((sum, table) => sum + (table.capacity || 0), 0) || 0;

      return {
        activeEvents: activeEvents?.length || 0,
        totalGuests: totalGuests || 0,
        totalCapacity,
      };
    },
  });
};
