import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Zap, User, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const UserProfilePanel = () => {
  const { subscription, plan, isLoading } = useSubscription();
  const { user } = useAuth();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Query para buscar planos de eventos pagos
  const { data: eventPlans } = useQuery({
    queryKey: ["user-event-plans", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("event_purchases")
        .select(`
          plan,
          event_id,
          events(name)
        `)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      
      const { data, error } = await supabase.functions.invoke("create-customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL do portal não recebida");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erro ao abrir portal",
        description: error.message || "Não foi possível abrir o portal de gerenciamento",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getPlanIcon = () => {
    switch (plan) {
      case "PREMIUM":
        return <Sparkles className="h-5 w-5 text-blue-600" />;
      case "ESSENTIAL":
        return <Zap className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPlanColor = () => {
    switch (plan) {
      case "PREMIUM":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ESSENTIAL":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPlanLabel = () => {
    switch (plan) {
      case "PREMIUM":
        return "Premium";
      case "ESSENTIAL":
        return "Essencial";
      default:
        return "Gratuito";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seu Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPlanIcon()}
          Seu Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Badge className={`${getPlanColor()} font-semibold`}>
            {getPlanLabel()}
          </Badge>
        </div>

        {subscription?.subscription_status && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground capitalize">
                {subscription.subscription_status === "active" ? "Ativo" : subscription.subscription_status}
              </span>
            </p>
          </div>
        )}

        {subscription?.current_period_end && (
          <p className="text-sm text-muted-foreground">
            Renovação:{" "}
            <span className="font-medium text-foreground">
              {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
            </span>
          </p>
        )}

        {plan === "FREE" && (
          <p className="text-xs text-muted-foreground mt-2">
            Faça upgrade para desbloquear mais recursos
          </p>
        )}

        {plan !== "FREE" && subscription?.stripe_customer_id && (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoadingPortal}
            variant="outline"
            className="w-full mt-4"
          >
            {isLoadingPortal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abrindo...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Assinatura
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
