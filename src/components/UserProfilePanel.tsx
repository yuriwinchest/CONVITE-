import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Calendar,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";

export const UserProfilePanel = () => {
  const { hasUsedMonthlyFreeEvent } = useSubscription();
  const { itemCount } = useCart();
  const [hasUsedFreeEvent, setHasUsedFreeEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMonthlyUsage = async () => {
      setIsLoading(true);
      const used = await hasUsedMonthlyFreeEvent();
      setHasUsedFreeEvent(used);
      setIsLoading(false);
    };
    
    checkMonthlyUsage();
  }, [hasUsedMonthlyFreeEvent]);

  // Buscar eventos com planos pagos
  const { data: eventPlans, isLoading: eventsLoading } = useQuery({
    queryKey: ["user-event-plans"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("event_purchases" as any)
        .select("*, events!inner(name)")
        .eq("events.user_id", user.id)
        .eq("payment_status", "paid");

      if (error) throw error;
      return data || [];
    },
  });

  const handleOpenCart = () => {
    const cartButton = document.querySelector('[data-cart-trigger]') as HTMLButtonElement;
    if (cartButton) {
      cartButton.click();
    }
  };

  if (isLoading || eventsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Controle de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Controle de Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Evento Gratuito Mensal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {hasUsedFreeEvent ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium">
                  {hasUsedFreeEvent 
                    ? "Você já usou seu evento gratuito deste mês"
                    : "Você tem 1 evento gratuito disponível este mês"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasUsedFreeEvent
                    ? "Adicione eventos ao carrinho para criar mais eventos"
                    : "Plano gratuito: até 50 convidados"}
                </p>
              </div>
            </div>
          </div>

          {hasUsedFreeEvent && (
            <Button
              onClick={handleOpenCart}
              className="w-full"
              variant="default"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Comprar Mais Eventos (R$ 79/evento)
              {itemCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {itemCount} no carrinho
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Eventos com Planos Ativos */}
        {eventPlans && eventPlans.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Eventos Pagos Ativos
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
                          <Badge variant="default">
                            Essential
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Até 200 convidados
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        R$ 79,00
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Estes eventos têm o plano Essential ativo com limite de 200 convidados cada.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
