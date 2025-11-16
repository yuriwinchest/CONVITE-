import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SubscriptionsManager = () => {
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
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
          {subscriptions?.map((sub: any) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
