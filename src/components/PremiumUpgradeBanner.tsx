import { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Users, Camera, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export const PremiumUpgradeBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { plan } = useSubscription();

  useEffect(() => {
    const checkIfShouldShow = async () => {
      // Só mostra para usuários FREE
      if (plan !== "FREE") {
        setIsVisible(false);
        return;
      }

      // Verifica se foi dismissado nesta sessão
      const dismissed = sessionStorage.getItem("premium-banner-dismissed");
      if (dismissed) {
        setIsDismissed(true);
        return;
      }

      // Verifica quantos eventos o usuário tem este mês
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", firstDayOfMonth.toISOString());

      // Mostra o banner se tiver usado o evento gratuito
      if (count && count >= 1) {
        setIsVisible(true);
      }
    };

    checkIfShouldShow();
  }, [plan]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("premium-banner-dismissed", "true");
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session");
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Erro ao iniciar upgrade:", error);
    }
  };

  if (!isVisible || isDismissed || plan !== "FREE") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-scale-in">
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-background shadow-2xl backdrop-blur-sm">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/80 transition-colors z-10"
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                Upgrade para Premium
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Você usou seu evento gratuito deste mês
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 pl-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground">Até 5 eventos por mês</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground">Convidados ilimitados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-foreground">Galeria de fotos do evento</span>
            </div>
          </div>

          {/* Pricing highlight */}
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Apenas
                </p>
                <p className="text-2xl font-bold text-primary">R$ 149/mês</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Economize</p>
                <p className="text-sm font-semibold text-foreground">vs R$ 79/evento</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all group"
            size="lg"
          >
            Fazer Upgrade Agora
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancele quando quiser • Sem taxas ocultas
          </p>
        </div>
      </Card>
    </div>
  );
};
