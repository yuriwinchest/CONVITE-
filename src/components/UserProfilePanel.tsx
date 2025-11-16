import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap, User } from "lucide-react";

export const UserProfilePanel = () => {
  const { subscription, plan, isLoading } = useSubscription();

  const getPlanIcon = () => {
    switch (plan) {
      case "PROFESSIONAL":
        return <Crown className="h-5 w-5 text-purple-600" />;
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
      case "PROFESSIONAL":
        return "bg-purple-100 text-purple-800 border-purple-200";
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
      case "PROFESSIONAL":
        return "Profissional";
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
      </CardContent>
    </Card>
  );
};
