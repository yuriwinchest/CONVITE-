import { Trash2, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EventShoppingCart = () => {
  const { cart, removeFromCart, clearCart, itemCount, totalAmount } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!cart || itemCount === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-cart-checkout", {
        body: { cartItems: cart.items },
      });

      if (error) throw error;

      if (data?.url) {
        toast({
          title: "🛒 Redirecionando para pagamento...",
          description: `Total: R$ ${totalAmount.toFixed(2)} - ${itemCount} evento(s)`,
          duration: 2000,
        });
        
        // Aguardar um pouco para o toast aparecer antes de redirecionar
        setTimeout(() => {
          window.open(data.url, "_blank");
        }, 500);
      }
    } catch (error) {
      console.error("Erro ao criar checkout:", error);
      toast({
        title: "❌ Erro ao processar pagamento",
        description: "Não foi possível criar a sessão de pagamento. Tente novamente.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
        <p className="text-sm text-muted-foreground">
          Adicione eventos ao carrinho para continuar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full mt-6">
      <div className="flex-1 overflow-auto space-y-4">
        {cart?.items.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{item.event_name}</h4>
                  </div>
                  {item.event_data && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Data:{" "}
                        {format(new Date(item.event_data.date), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      {item.event_data.location && (
                        <p>Local: {item.event_data.location}</p>
                      )}
                      <p className="text-primary font-medium">
                        Plano Essential - 200 convidados
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">
                    R$ {item.amount.toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart.mutate(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? "Processando..." : `Finalizar Compra (${itemCount} ${itemCount === 1 ? "evento" : "eventos"})`}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => clearCart.mutate()}
            disabled={isProcessing}
          >
            Limpar Carrinho
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Você será redirecionado para o checkout seguro do Stripe
        </p>
      </div>
    </div>
  );
};
