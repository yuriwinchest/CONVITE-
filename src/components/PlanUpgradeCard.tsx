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
    <Card className="relative overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              Upgrade para Premium
            </CardTitle>
            <CardDescription className="text-base">
              Desbloqueie todo o potencial do seu evento
            </CardDescription>
          </div>
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
            -53% OFF
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        <div className="space-y-3">
          <h4 className="font-semibold text-base flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Recursos Premium inclusos:
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-medium">Convidados ilimitados</span>
                <p className="text-muted-foreground text-xs">Sem limite de pessoas no seu evento</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-medium">Envio de fotos pelos convidados</span>
                <p className="text-muted-foreground text-xs">Até 30 fotos por pessoa diretamente no app</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-medium">Mapa interativo de mesas</span>
                <p className="text-muted-foreground text-xs">Visualização completa da disposição</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-medium">Relatórios avançados</span>
                <p className="text-muted-foreground text-xs">Exportação em PDF e análises detalhadas</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Plano atual</p>
            <p className="text-sm font-medium">Essencial</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">
                R$ 70
              </p>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground line-through">R$ 149</span>
                <span className="text-xs font-medium text-primary">pagamento único</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade} 
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Fazer Upgrade Agora
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanUpgradeCard;
