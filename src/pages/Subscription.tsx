import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Calendar, Download, ExternalLink, Loader2, Crown, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Subscription() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { plan, subscription } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Buscar usuário atual
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    },
  });

  const user = userData?.user;
  const isAdminUser = user?.email === "dani@danibaidaeventos.com.br";

  // Buscar histórico de pagamentos via edge function
  const { data: paymentData, isLoading } = useQuery({
    queryKey: ["payment-history"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-payment-history");
      if (error) throw error;
      return data;
    },
  });

  const handleManageSubscription = async () => {
    // Verificar se é admin
    if (!isAdminUser) {
      toast({
        title: "⚠️ Acesso restrito",
        description: "Apenas o administrador pode acessar o gerenciamento do Stripe.",
        variant: "destructive",
      });
      return;
    }

    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-customer-portal");

      if (error) throw error;

      if (data?.url) {
        toast({
          title: "🔧 Abrindo portal de gerenciamento...",
          description: "Você será redirecionado para gerenciar sua assinatura.",
          duration: 2000,
        });
        
        setTimeout(() => {
          window.open(data.url, "_blank");
        }, 500);
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Assinatura cancelada",
          description: "Sua assinatura será cancelada ao final do período atual. Você não será mais cobrado.",
          duration: 5000,
        });
        
        // Recarregar dados
        queryClient.invalidateQueries({ queryKey: ["payment-history"] });
        queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session");

      if (error) throw error;

      if (data?.url) {
        toast({
          title: "⬆️ Upgrade para Premium",
          description: "Redirecionando para o checkout...",
          duration: 2000,
        });
        
        setTimeout(() => {
          window.open(data.url, "_blank");
        }, 500);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível iniciar o upgrade.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  };

  const getPlanBadgeVariant = (planType: string) => {
    if (planType === "PREMIUM") return "default";
    if (planType === "ESSENTIAL") return "secondary";
    return "outline";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      paid: { label: "Pago", variant: "default" },
      open: { label: "Pendente", variant: "secondary" },
      draft: { label: "Rascunho", variant: "outline" },
      void: { label: "Cancelado", variant: "destructive" },
      uncollectible: { label: "Falhou", variant: "destructive" },
    };
    
    return statusMap[status] || { label: status, variant: "outline" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Gerenciar Assinatura</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu plano, pagamentos e faturas
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-5xl">
          {/* Plano Atual */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Plano Atual</CardTitle>
                    <CardDescription>Seu plano ativo e benefícios</CardDescription>
                  </div>
                </div>
                <Badge variant={getPlanBadgeVariant(plan)} className="text-lg px-4 py-2">
                  {plan === "PREMIUM" ? "Premium" : plan === "ESSENTIAL" ? "Essential" : "Gratuito"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefícios do Plano */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Eventos por Mês</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {plan === "PREMIUM" ? "5" : plan === "ESSENTIAL" ? "Ilimitado*" : "1"}
                  </p>
                  {plan === "ESSENTIAL" && (
                    <p className="text-xs text-muted-foreground mt-1">*Via compra avulsa</p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Convidados por Evento</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {plan === "PREMIUM" ? "Ilimitado" : plan === "ESSENTIAL" ? "200" : "50"}
                  </p>
                </div>
              </div>

              {/* Informações da Assinatura */}
              {paymentData?.subscription && (
                <div className="space-y-3">
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status da Assinatura</p>
                      <Badge variant="default" className="text-sm">
                        {paymentData.subscription.cancel_at_period_end ? "Cancelando" : "Ativo"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Renovação</p>
                      <p className="font-semibold">
                        {format(new Date(paymentData.subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  {paymentData.subscription.cancel_at_period_end && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Sua assinatura será cancelada em {format(new Date(paymentData.subscription.current_period_end), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Próxima Cobrança */}
              {paymentData?.upcomingInvoice && !paymentData.subscription?.cancel_at_period_end && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Próxima Cobrança</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(paymentData.upcomingInvoice.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        em {format(new Date(paymentData.upcomingInvoice.period_end), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  {plan === "PREMIUM" ? (
                    isAdminUser ? (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={isManaging}
                        className="flex-1"
                      >
                        {isManaging ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Abrindo...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Gerenciar no Stripe
                          </>
                        )}
                      </Button>
                    ) : null
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Fazer Upgrade para Premium
                    </Button>
                  )}
                </div>

                {/* Botão de Cancelar Assinatura - Disponível para usuários PREMIUM */}
                {plan === "PREMIUM" && subscription?.stripe_subscription_id && !paymentData?.subscription?.cancel_at_period_end && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar Assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Assinatura Premium?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Tem certeza que deseja cancelar sua assinatura Premium?
                          </p>
                          <p>
                            • Você continuará com acesso até o final do período pago
                          </p>
                          <p>
                            • Não haverá mais cobranças após o cancelamento
                          </p>
                          <p>
                            • Após o período, seu plano voltará para Gratuito
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={isCanceling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCanceling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cancelando...
                            </>
                          ) : (
                            "Sim, Cancelar Assinatura"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Histórico de Pagamentos
              </CardTitle>
              <CardDescription>
                {paymentData?.invoices?.length > 0 
                  ? `Últimas ${paymentData.invoices.length} transações`
                  : "Nenhum pagamento realizado ainda"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentData?.invoices?.length > 0 ? (
                <div className="space-y-3">
                  {paymentData.invoices.map((invoice: any) => {
                    const statusInfo = getStatusBadge(invoice.status);
                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            <span className="text-lg font-semibold">
                              {formatCurrency(invoice.amount)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        {invoice.invoice_pdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hosted_invoice_url, "_blank")}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Fatura
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhum pagamento registrado ainda
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Quando você realizar pagamentos, eles aparecerão aqui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
