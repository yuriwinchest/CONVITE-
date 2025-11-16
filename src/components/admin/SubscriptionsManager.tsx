import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { XCircle, Loader2, Search, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

export const SubscriptionsManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "plan" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions" as any)
        .select("*, profiles!inner(full_name, user_id)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("admin-cancel-subscription", {
        body: { target_user_id: userId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPlanColor = (plan: string): "default" | "secondary" | "destructive" | "outline" => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      FREE: "secondary",
      ESSENTIAL: "default",
      PREMIUM: "default",
      PROFESSIONAL: "default",
    };
    return colors[plan] || "secondary";
  };

  // Filtrar e ordenar assinaturas
  const filteredAndSortedSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    let filtered = subscriptions.filter((sub: any) => {
      const matchesSearch = sub.profiles.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPlan = planFilter === "all" || sub.plan === planFilter;
      const matchesStatus = statusFilter === "all" || sub.subscription_status === statusFilter;
      
      return matchesSearch && matchesPlan && matchesStatus;
    });

    // Ordenar
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      if (sortBy === "name") {
        comparison = a.profiles.full_name.localeCompare(b.profiles.full_name);
      } else if (sortBy === "plan") {
        comparison = a.plan.localeCompare(b.plan);
      } else if (sortBy === "date") {
        const dateA = a.current_period_start ? new Date(a.current_period_start).getTime() : 0;
        const dateB = b.current_period_start ? new Date(b.current_period_start).getTime() : 0;
        comparison = dateA - dateB;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [subscriptions, searchTerm, planFilter, statusFilter, sortBy, sortOrder]);

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
              placeholder="Buscar por nome..."
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
              <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="plan">Plano</SelectItem>
              <SelectItem value="date">Data</SelectItem>
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
            <TableHead>Usuário</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedSubscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma assinatura encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedSubscriptions.map((sub: any) => (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">
                {sub.profiles.full_name}
              </TableCell>
              <TableCell>
                <Badge variant={getPlanColor(sub.plan)}>{sub.plan}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={sub.subscription_status === "active" ? "default" : "secondary"}>
                  {sub.subscription_status || "Sem status"}
                </Badge>
              </TableCell>
              <TableCell>
                {sub.current_period_start
                  ? format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR })
                  : "-"}
              </TableCell>
              <TableCell>
                {sub.current_period_end
                  ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })
                  : "-"}
              </TableCell>
              <TableCell>
                {sub.subscription_status === "active" && sub.stripe_subscription_id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja cancelar a assinatura de {sub.profiles.full_name}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelMutation.mutate(sub.user_id)}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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
