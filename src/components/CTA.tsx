import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center shadow-xl">
          <h2 className="text-4xl font-bold mb-4">
            Cadastre-se agora e crie seu primeiro evento sem custo
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Experimente a sofisticação de uma recepção impecável — grátis para até 50 convidados.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-6 text-base"
          >
            <Heart className="w-5 h-5 mr-2" />
            Criar Meu Primeiro Evento
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
