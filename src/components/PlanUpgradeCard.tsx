import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, Calendar, Users, Camera, FileText } from "lucide-react";
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
      const { data, error } = await supabase.functions.invoke("create-checkout-session");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para a assinatura Premium...");
      }
    } catch (error: any) {
      console.error("Erro ao processar upgrade:", error);
      toast.error(error.message || "Erro ao processar upgrade. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative h-full flex flex-col overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              Upgrade para Premium
            </CardTitle>
            <CardDescription className="text-base">
              Gerencie até 20 eventos por mês com uma única assinatura
            </CardDescription>
          </div>
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
            R$ 149/mês
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative flex flex-col h-full">
        <div className="space-y-3">
          <h4 className="font-semibold text-base flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Recursos Premium inclusos:
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Até 20 eventos por mês</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Crie múltiplos eventos sem pagamentos extras</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Convidados ilimitados</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Sem limite de pessoas em cada evento</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="font-medium">Envio de fotos pelos convidados</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Galeria completa com fotos do evento</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Mapa interativo + Relatórios PDF</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Visualização completa e documentação avançada</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm group">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-medium">Upload em CSV + Check-in + Mapa de mesa</span>
                <p className="text-muted-foreground text-xs mt-1">Todas as ferramentas profissionais incluídas</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-2">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Economize com a assinatura mensal</p>
              <p className="text-xs text-muted-foreground">
                Se você precisa criar mais de 1 evento por mês, o plano Premium é mais vantajoso que pagar R$ 79 por evento no plano Essencial.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Seu plano atual</p>
            <p className="text-sm font-medium">Essencial - R$ 79 por evento</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-amber-500">⚠️</span>
              <span>Pagamento único a cada novo evento</span>
            </p>
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
                Assinar Premium
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanUpgradeCard;
