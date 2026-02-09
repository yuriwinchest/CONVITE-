
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const PromoLanding = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Validate promo code if necessary (for now accepting 'ESPECIAL' or generic)
    if (code && code !== "ESPECIAL" && code !== "VIP") {
       // Optional: setIsValid(false);
    }
  }, [code]);

  const handleRedeem = () => {
    // Redirect to auth with promo code query param
    navigate(`/auth?promo=${code || "ESPECIAL"}&signup=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519750157634-b6d493a0ea29?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none" />
      
      <Card className="w-full max-w-2xl border-purple-500/50 shadow-2xl backdrop-blur-sm bg-background/90 relative overflow-hidden">
        {/* Decorative shimmer effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Gift className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Convite Especial!
            </h1>
            <p className="text-xl text-muted-foreground">
              Você ganhou um presente exclusivo
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-6 md:px-12 pb-12">
          <div className="grid gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">2 Eventos Premium Grátis</h3>
                <p className="text-muted-foreground">Crie eventos completos sem pagar nada.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Convidados Ilimitados</h3>
                <p className="text-muted-foreground">Convide quantas pessoas quiser para sua festa!</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
              onClick={handleRedeem}
            >
              Resgatar Meu Presente
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Promoção válida por tempo limitado. 
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoLanding;
