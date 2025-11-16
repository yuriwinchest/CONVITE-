import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown, Calendar, Users, TrendingUp, CheckCircle, MapPin, Trash2 } from "lucide-react";
import { format, isToday, isFuture, isPast, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
          profiles!inner(full_name, user_id),
          guests(id, confirmed, checked_in_at),
          event_purchases(plan)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!events) return null;

    const now = new Date();
    const totalEvents = events.length;
    const eventsToday = events.filter((e: any) => isToday(new Date(e.date))).length;
    const futureEvents = events.filter((e: any) => isFuture(new Date(e.date))).length;
    const pastEvents = events.filter((e: any) => isPast(new Date(e.date)) && !isToday(new Date(e.date))).length;

    // Taxa média de check-in
    let totalGuests = 0;
    let totalCheckedIn = 0;
    events.forEach((event: any) => {
      const guests = event.guests || [];
      totalGuests += guests.length;
      totalCheckedIn += guests.filter((g: any) => g.checked_in_at).length;
    });
    const avgCheckInRate = totalGuests > 0 ? (totalCheckedIn / totalGuests) * 100 : 0;

    // Estatísticas de convidados
    const avgGuestsPerEvent = totalGuests / (totalEvents || 1);
    const confirmedGuests = events.reduce((sum: number, e: any) => 
      sum + (e.guests?.filter((g: any) => g.confirmed).length || 0), 0);
    const confirmationRate = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0;

    // Evento com mais convidados
    const eventWithMostGuests = events.reduce((max: any, event: any) => {
      const guestCount = event.guests?.length || 0;
      const maxCount = max?.guests?.length || 0;
      return guestCount > maxCount ? event : max;
    }, null);

    // Distribuição por mês
    const eventsByMonth: { [key: string]: number } = {};
    events.forEach((event: any) => {
      const monthKey = format(startOfMonth(new Date(event.created_at)), "MMM yyyy", { locale: ptBR });
      eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
    });
    const timelineData = Object.entries(eventsByMonth).map(([month, count]) => ({
      month,
      eventos: count,
    }));

    // Distribuição por plano
    const planDistribution: { [key: string]: number } = { FREE: 0, ESSENTIAL: 0, PREMIUM: 0, PROFESSIONAL: 0 };
    events.forEach((event: any) => {
      const plan = event.event_purchases?.[0]?.plan || "FREE";
      planDistribution[plan] = (planDistribution[plan] || 0) + 1;
    });
    const planData = Object.entries(planDistribution).map(([name, value]) => ({ name, value }));

    // Top 5 criadores
    const creatorStats: { [key: string]: { name: string; count: number; userId: string } } = {};
    events.forEach((event: any) => {
      const userId = event.profiles.user_id;
      const name = event.profiles.full_name;
      if (!creatorStats[userId]) {
        creatorStats[userId] = { name, count: 0, userId };
      }
      creatorStats[userId].count++;
    });
    const topCreators = Object.values(creatorStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents,
      eventsToday,
      futureEvents,
      pastEvents,
      avgCheckInRate,
      totalGuests,
      avgGuestsPerEvent,
      confirmationRate,
      eventWithMostGuests,
      timelineData,
      planData,
      topCreators,
    };
  }, [events]);

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
        const guestsA = a.guests?.length || 0;
        const guestsB = b.guests?.length || 0;
        comparison = guestsA - guestsB;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchTerm, planFilter, sortBy, sortOrder]);

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return { label: "Hoje", variant: "default" as const };
    if (isFuture(eventDate)) return { label: "Futuro", variant: "secondary" as const };
    return { label: "Passado", variant: "outline" as const };
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.eventsToday || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Futuros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.futureEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Check-in</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgCheckInRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalGuests || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos Criados por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics?.timelineData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="eventos" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics?.planData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {(metrics?.planData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Criadores e Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Criadores de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topCreators.map((creator: any, index: number) => (
                <div key={creator.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{creator.name}</span>
                  </div>
                  <Badge variant="secondary">{creator.count} eventos</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Média de convidados por evento</span>
              <span className="text-2xl font-bold">{metrics?.avgGuestsPerEvent.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Taxa de confirmação global</span>
              <span className="text-2xl font-bold">{metrics?.confirmationRate.toFixed(1)}%</span>
            </div>
            {metrics?.eventWithMostGuests && (
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground mb-1">Evento com mais convidados</div>
                <div className="font-medium">{metrics.eventWithMostGuests.name}</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.eventWithMostGuests.guests?.length || 0} convidados
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      {/* Tabela Melhorada */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Criador</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Convidados</TableHead>
              <TableHead>Plano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum evento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedEvents.map((event: any) => {
                const status = getEventStatus(event.date);
                const totalGuests = event.guests?.length || 0;
                const checkedIn = event.guests?.filter((g: any) => g.checked_in_at).length || 0;
                
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.profiles.full_name}</TableCell>
                    <TableCell>
                      {format(new Date(event.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{event.location || "Não informado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{checkedIn}/{totalGuests}</span>
                      </div>
                    </TableCell>
                    <TableCell>{totalGuests}</TableCell>
                    <TableCell>
                      <Badge>{event.event_purchases?.[0]?.plan || "FREE"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
