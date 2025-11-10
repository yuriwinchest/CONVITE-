import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Plano Gratuito",
    price: "R$ 0",
    period: "",
    features: [
      "Até 50 convidados",
      "Funções básicas de setorização",
    ],
    cta: "Começar",
    variant: "outline" as const,
  },
  {
    name: "Essencial",
    price: "R$ 79,00",
    period: "/ evento",
    features: [
      "Até 200 convidados",
      "Inclusão de menus e fotos",
      "Mapa de assentos interativo",
    ],
    cta: "Escolher",
    variant: "outline" as const,
  },
  {
    name: "Premium",
    price: "R$ 149,00",
    period: "/ evento",
    features: [
      "Convidados ilimitados",
      "Inclusão de menus e fotos",
      "Mapa de assentos interativo",
      "Relatórios e exportação em PDF",
    ],
    cta: "Selecionar",
    variant: "default" as const,
  },
  {
    name: "Profissional",
    price: "R$ 97,00",
    period: "/ mês",
    features: [
      "Eventos ilimitados",
      "Painel de múltiplos clientes",
      "Suporte prioritário",
    ],
    cta: "Assinar",
    variant: "outline" as const,
  },
];

const Pricing = () => {
  return (
    <section className="bg-primary text-primary-foreground py-20 px-6">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          Escolha o plano ideal para o seu evento
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className="bg-card border-0 flex flex-col">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-semibold text-card-foreground mb-4">
                  {plan.name}
                </h3>
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
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
