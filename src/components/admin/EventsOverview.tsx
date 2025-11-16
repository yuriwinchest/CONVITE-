import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

export const EventsOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "creator" | "date" | "guests">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // Filtrar e ordenar eventos
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events.filter((event: any) => {
      const matchesSearch = 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = 
        planFilter === "all" || 
        (event.event_purchases?.[0]?.plan || "FREE") === planFilter;
      
      return matchesSearch && matchesPlan;
    });

    // Ordenar
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "creator") {
        comparison = a.profiles.full_name.localeCompare(b.profiles.full_name);
      } else if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "guests") {
        const guestsA = a.guests?.[0]?.count || 0;
        const guestsB = b.guests?.[0]?.count || 0;
        comparison = guestsA - guestsB;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchTerm, planFilter, sortBy, sortOrder]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por evento ou criador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="FREE">Gratuito</SelectItem>
              <SelectItem value="ESSENTIAL">Essential</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="creator">Criador</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="guests">Convidados</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabela */}
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
          {filteredAndSortedEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhum evento encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedEvents.map((event: any) => (
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
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
