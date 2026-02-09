import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Calendar,
  ShoppingCart,
  Loader2,
  Crown,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import CreateEventDialog from "@/components/CreateEventDialog";

export const UserProfilePanel = () => {
  const { plan, subscription, canCreateEventThisMonth, getEventsUsedThisMonth } = useSubscription();
  const { itemCount, totalAmount } = useCart();
  const [eventsUsed, setEventsUsed] = useState(0);
  const [eventsLimit, setEventsLimit] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const [openCreateEvent, setOpenCreateEvent] = useState(false);

  // Ativar atualizações em tempo real
  useRealtimeUpdates();

  useEffect(() => {
    const loadMonthlyUsage = async () => {
      try {
        setIsLoading(true);
        const used = await getEventsUsedThisMonth();
        const status = await canCreateEventThisMonth();
        setEventsUsed(used);
        setEventsLimit(status.eventsLimit || 1);
      } catch (error) {
        console.error("Error loading monthly usage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthlyUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez quando o componente monta

  // Buscar eventos com planos pagos (ESSENTIAL)
  const { data: eventPlans, isLoading: eventsLoading } = useQuery({
    queryKey: ["user-event-plans"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("event_purchases" as any)
        .select("*, events!inner(name)")
        .eq("events.user_id", user.id)
        .eq("payment_status", "paid")
        .eq("plan", "ESSENTIAL");

      if (error) throw error;
      return data || [];
    },
  });

  const handleOpenCart = () => {
    setOpenCreateEvent(true);
  };

  const handleManageSubscription = async () => {
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

  const handleUpgradeToPremium = async () => {
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
      console.error("Error creating checkout:", error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível criar a sessão de checkout.",
        variant: "destructive",
      });
    }
  };

  // Unified render structure to avoid reconciliation errors
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plan === "PREMIUM" ? (
            <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
          ) : (
            <Calendar className="h-5 w-5" aria-hidden="true" />
          )}
          <span>Seu Plano</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(isLoading || eventsLoading) ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            {/* Plano PREMIUM - Assinatura Mensal */}
            {plan === "PREMIUM" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-lg border-2 border-primary">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary rounded-lg">
                        <Crown className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Premium</h3>
                        <p className="text-sm text-muted-foreground">R$ 149,00/mês</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Eventos este mês:</span>
                      <Badge variant="secondary">
                        {eventsUsed} / {eventsLimit} eventos
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm">Convidados ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm">Envio de fotos pelos convidados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm">Relatórios e exportação em PDF</span>
                    </div>
                  </div>

                  {subscription?.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Renovação: {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                  variant="outline"
                  className="w-full"
                >
                  {isManaging ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Abrindo...
                    </>
                  ) : (
                    "Gerenciar Assinatura"
                  )}
                </Button>
                <Button
                  onClick={() => window.location.href = "/subscription"}
                  variant="ghost"
                  className="w-full"
                >
                  Ver Histórico de Pagamentos
                </Button>
              </div>
            )}

            {/* Plano FREE - Evento Gratuito Mensal */}
            {plan === "FREE" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Plano Gratuito</h3>
                    <Badge variant="secondary">{eventsUsed} / 1 evento usado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {eventsUsed === 0
                      ? "Você tem 1 evento gratuito disponível este mês (até 200 convidados)"
                      : "Você já usou seu evento gratuito deste mês"}
                  </p>

                  {eventsUsed >= 1 && (
                    <>
                      <Button
                        onClick={handleOpenCart}
                        className="w-full relative"
                        variant="default"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Comprar Mais Eventos (R$ 79/evento)
                        {itemCount > 0 && (
                          <Badge className="ml-2 bg-primary-foreground text-primary" variant="secondary">
                            {itemCount}
                          </Badge>
                        )}
                      </Button>
                      {itemCount > 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Total no carrinho: R$ {totalAmount.toFixed(2)}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* Upgrade para Premium */}
                <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Upgrade para Premium</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R$ 149/mês - Até 5 eventos por mês com convidados ilimitados
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>✓ Até 5 eventos por mês</li>
                    <li>✓ Convidados ilimitados</li>
                    <li>✓ Envio de fotos pelos convidados</li>
                    <li>✓ Relatórios e exportação em PDF</li>
                  </ul>
                  <Button
                    onClick={handleUpgradeToPremium}
                    className="w-full"
                    variant="default"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/subscription"}
                    variant="ghost"
                    className="w-full"
                  >
                    Ver Detalhes de Planos
                  </Button>
                </div>
              </div>
            )}

            {/* Eventos ESSENTIAL Pagos (via carrinho) */}
            {eventPlans && eventPlans.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Eventos Pagos (Essential)
                    </h3>
                    <Badge variant="secondary">
                      {eventPlans.length} {eventPlans.length === 1 ? "evento" : "eventos"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {eventPlans.map((eventPlan: any) => (
                      <Card key={eventPlan.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{eventPlan.events.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="default">Essential</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Até 200 convidados
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-primary">R$ 79,00</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Eventos comprados individualmente com limite de 200 convidados cada.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      <CreateEventDialog open={openCreateEvent} onOpenChange={setOpenCreateEvent} />
    </Card>
  );
};
