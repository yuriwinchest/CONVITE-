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
    highlight: "🎉 Até 5 eventos por mês",
    features: [
      "Até 5 eventos por mês",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 sm:px-0">
            {plans.map((plan, index) => {
              const isPremium = plan.name === "Premium";
              return (
                <Card 
                  key={index} 
                  className={`
                    relative flex flex-col transition-all duration-300
                    ${isPremium 
                      ? 'border-2 border-primary shadow-xl md:scale-105 bg-gradient-to-b from-primary/5 to-background' 
                      : 'border border-border/40 hover:border-border hover:shadow-md bg-background'
                    }
                  `}
                >
                  {/* Badge para Premium */}
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg">
                      Mais Popular
                    </div>
                  )}

                  <CardHeader className="pb-6 pt-8 space-y-4">
                    {/* Nome do plano */}
                    <div className="space-y-1">
                      <h3 className={`text-lg font-semibold ${isPremium ? 'text-primary' : 'text-foreground'}`}>
                        {plan.name}
                      </h3>
                      {plan.highlight && (
                        <p className="text-xs text-muted-foreground">
                          {plan.highlight}
                        </p>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col pt-0">
                    {/* Features */}
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-0.5 ${isPremium ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Check className={`w-3.5 h-3.5 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Button 
                      variant={isPremium ? "default" : "outline"}
                      className={`
                        w-full h-11 font-semibold transition-all
                        ${isPremium 
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl' 
                          : 'hover:bg-muted'
                        }
                      `}
                      onClick={() => handlePlanSelection(plan.name)}
                      disabled={loading !== null}
                    >
                      {loading === plan.name.toUpperCase() ? "Processando..." : plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
