import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

const plans = [
  {
    name: "Plano Gratuito",
    price: "R$ 0",
    period: "",
    features: [
      "Até 50 convidados",
      "Funções básicas de setorização",
      "Mapa do evento",
    ],
    cta: "Começar",
    variant: "outline" as const,
  },
  {
    name: "Essencial",
    price: "R$ 79,00",
    period: "/ por evento",
    highlight: "💳 Pagamento único por evento",
    features: [
      "Até 200 convidados",
      "Mapa de assentos",
      "Upload em CSV",
      "Mapa de mesa",
      "Check-in",
    ],
    cta: "Escolher",
    variant: "outline" as const,
  },
  {
    name: "Premium",
    price: "R$ 149,00",
    period: "/ mês",
    highlight: "🎉 Até 20 eventos por mês",
    features: [
      "Até 20 eventos por mês",
      "Convidados ilimitados",
      "Inclusão de menus e fotos",
      "Mapa de assentos interativo",
      "Relatórios e exportação em PDF",
      "Envio de fotos pelos convidados",
      "Upload em CSV",
      "Mapa de mesa",
      "Check-in",
    ],
    cta: "Assinar",
    variant: "default" as const,
  },
];

interface PricingProps {
  eventId?: string;
  embedded?: boolean;
}

const Pricing = ({ eventId, embedded = false }: PricingProps = {}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: events } = useQuery({
    queryKey: ["events-for-purchase"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("events")
        .select("id, name, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handlePurchaseEssential = async () => {
    try {
      setLoading("ESSENTIAL");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        return;
      }

      if (!eventId) {
        toast.error("ID do evento não fornecido");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          plan: "ESSENTIAL",
          eventId: eventId,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        toast.success("Abrindo página de pagamento...");
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handlePurchasePremium = async () => {
    try {
      setLoading("PREMIUM");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        return;
      }

      if (!eventId) {
        toast.error("ID do evento não fornecido");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          plan: "PREMIUM",
          eventId: eventId,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        toast.success("Abrindo página de pagamento...");
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribePremium = async () => {
    try {
      setLoading("PREMIUM");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          userId: user.id,
        },
      });

      if (error) throw error;
      
      toast.success("Abrindo checkout...");
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast.error("Erro ao processar assinatura");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleEventSelection = (selectedEventId: string) => {
    setShowEventSelector(false);
    
    if (selectedPlan === "Essencial") {
      handlePurchaseEssentialWithEvent(selectedEventId);
    }
  };

  const handlePurchaseEssentialWithEvent = async (targetEventId: string) => {
    try {
      setLoading("ESSENTIAL");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          plan: "ESSENTIAL",
          eventId: targetEventId,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        toast.success("Abrindo página de pagamento...");
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handlePlanSelection = (planName: string) => {
    if (planName === "Essencial") {
      if (!eventId) {
        if (!events || events.length === 0) {
          toast.error("Você precisa criar um evento primeiro");
          return;
        }
        setSelectedPlan("Essencial");
        setShowEventSelector(true);
        return;
      }
      handlePurchaseEssential();
    } else if (planName === "Premium") {
      handleSubscribePremium();
    } else {
      toast.info("Plano FREE já está ativo");
    }
  };

  return (
    <>
      <section className="animate-fade-in">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className="bg-card border-0 flex flex-col">
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-semibold text-card-foreground mb-4">
                    {plan.name}
                  </h3>
                  {plan.highlight && (
                    <p className="text-sm font-medium text-primary mb-2">
                      {plan.highlight}
                    </p>
                  )}
                  <div className="text-3xl font-bold text-card-foreground">
                    {plan.price}
                    {plan.period && (
                      <span className="text-base font-normal text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-card-foreground">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.variant}
                    className="w-full bg-primary hover:bg-accent text-primary-foreground"
                    onClick={() => handlePlanSelection(plan.name)}
                    disabled={loading !== null}
                  >
                    {loading === plan.name.toUpperCase() ? "Processando..." : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
      </section>

      <Dialog open={showEventSelector} onOpenChange={setShowEventSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione o evento para o plano {selectedPlan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {events?.map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleEventSelection(event.id)}
              >
                <div className="text-left">
                  <div className="font-semibold">{event.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Pricing;
