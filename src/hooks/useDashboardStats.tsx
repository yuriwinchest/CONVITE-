import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get events count for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id")
        .gte("date", startOfMonth.toISOString());

      if (eventsError) throw eventsError;

      // Get total guests count
      const { data: eventsWithGuests, error: guestsError } = await supabase
        .from("events")
        .select("id");

      if (guestsError) throw guestsError;

      const eventIds = eventsWithGuests?.map((e) => e.id) || [];
      
      let totalGuests = 0;
      if (eventIds.length > 0) {
        const { count, error: guestCountError } = await supabase
          .from("guests")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds);

        if (guestCountError) throw guestCountError;
        totalGuests = count || 0;
      }

      // Get total tables capacity
      let totalCapacity = 0;
      if (eventIds.length > 0) {
        const { data: tables, error: tablesError } = await supabase
          .from("tables")
          .select("capacity")
          .in("event_id", eventIds);

        if (tablesError) throw tablesError;
        totalCapacity = tables?.reduce((sum, table) => sum + table.capacity, 0) || 0;
      }

      return {
        activeEvents: events?.length || 0,
        totalGuests,
        totalCapacity,
      };
    },
  });
};
