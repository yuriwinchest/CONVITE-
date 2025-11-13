import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, CreditCard, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseDetails {
  plan: string;
  amount: number;
  eventName?: string;
  createdAt: string;
}

const PaymentSuccess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchPurchaseDetails();
    }
  }, [user, authLoading, navigate]);

  const fetchPurchaseDetails = async () => {
    try {
      if (!user) return;
      
      // Buscar a compra mais recente do usuário usando tipo any para contornar problemas de tipagem
      const supabaseClient = supabase as any;
      const response = await supabaseClient
        .from("event_purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(1);

      if (response.error) {
        console.error("Erro ao buscar compra:", response.error);
        setIsLoading(false);
        return;
      }

      const purchases = response.data;
      
      if (purchases && purchases.length > 0) {
        const purchase = purchases[0];
        
        // Buscar nome do evento se tiver event_id
        let eventName: string | undefined;
        if (purchase.event_id) {
          const eventResponse = await supabase
            .from("events")
            .select("name")
            .eq("id", purchase.event_id)
            .single();
          
          if (eventResponse.data) {
            eventName = eventResponse.data.name;
          }
        }

        setPurchaseDetails({
          plan: purchase.plan,
          amount: Number(purchase.amount),
          eventName,
          createdAt: purchase.created_at,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da compra:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      ESSENTIAL: "Essential",
      PREMIUM: "Premium",
      PROFESSIONAL: "Professional",
    };
    return planNames[plan] || plan;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2 mx-auto" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Pagamento Confirmado!</CardTitle>
          <CardDescription className="text-lg">
            Sua compra foi processada com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {purchaseDetails && (
            <>
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Package className="w-5 h-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Plano Adquirido</p>
                    <p className="text-xl font-semibold">
                      {getPlanName(purchaseDetails.plan)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(purchaseDetails.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Data da Compra</p>
                    <p className="text-xl font-semibold">
                      {format(new Date(purchaseDetails.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {purchaseDetails.eventName && (
                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Evento</p>
                      <p className="text-xl font-semibold">
                        {purchaseDetails.eventName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  {purchaseDetails.plan === "PROFESSIONAL"
                    ? "Sua assinatura está ativa! Você agora tem acesso a eventos e convidados ilimitados."
                    : `Seu evento foi atualizado para o plano ${getPlanName(purchaseDetails.plan)}! ${
                        purchaseDetails.plan === "ESSENTIAL"
                          ? "Você pode adicionar até 200 convidados."
                          : "Você tem convidados ilimitados para este evento."
                      }`}
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              className="flex-1"
              size="lg"
            >
              Ir para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
