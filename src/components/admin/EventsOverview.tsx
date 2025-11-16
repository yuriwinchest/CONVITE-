import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EventsOverview = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles!inner(full_name),
          guests(count),
          event_purchases(plan)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>Criador</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Convidados</TableHead>
            <TableHead>Plano</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events?.map((event: any) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell>{event.profiles.full_name}</TableCell>
              <TableCell>
                {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>{event.guests?.[0]?.count || 0}</TableCell>
              <TableCell>
                <Badge>
                  {event.event_purchases?.[0]?.plan || "FREE"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
