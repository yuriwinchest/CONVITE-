import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanUpgradeCardProps {
  eventId: string;
  currentPlan: "ESSENTIAL" | "PREMIUM";
}

const PlanUpgradeCard = ({ eventId, currentPlan }: PlanUpgradeCardProps) => {
  const [loading, setLoading] = useState(false);

  // Se já é Premium, não exibe nada
  if (currentPlan === "PREMIUM") return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { plan: "PREMIUM", eventId },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o pagamento...");
      }
    } catch (error: any) {
      console.error("Erro ao processar upgrade:", error);
      toast.error(error.message || "Erro ao processar upgrade. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Faça Upgrade para Premium
        </CardTitle>
        <CardDescription>
          Desbloqueie recursos avançados por apenas R$ 70,00
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">O que você ganha:</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Convidados ilimitados</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Envio de fotos pelos convidados (30 fotos por pessoa)</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Mapa interativo de mesas</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Relatórios e exportação em PDF</span>
            </li>
          </ul>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual: Essencial</p>
            <p className="text-2xl font-bold text-primary">
              + R$ 70,00
              <span className="text-sm font-normal text-muted-foreground ml-1">
                para upgrade
              </span>
            </p>
          </div>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fazer Upgrade"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanUpgradeCard;
