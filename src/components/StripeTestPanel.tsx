import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { STRIPE_PRICES } from "@/config/stripe-prices";

export const StripeTestPanel = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const testCheckout = async (type: "essential" | "premium") => {
    setLoading(type);
    try {
      // Teste de pagamento único (Essential) ou assinatura (Premium)
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      let result;

      if (type === "premium") {
        // Premium agora é assinatura mensal
        result = await supabase.functions.invoke("create-checkout-session");
      } else {
        // Essential - pagamento único por evento
        // Criar evento de teste
        const { data: event, error: eventError } = await supabase
          .from("events")
          .insert({
            name: `Teste ${type.toUpperCase()} - ${new Date().toLocaleString()}`,
            date: new Date().toISOString(),
            location: "Teste",
            user_id: userData.user.id,
          })
          .select()
          .single();

        if (eventError) throw eventError;

        // Criar sessão de checkout para o evento
        result = await supabase.functions.invoke("create-payment-intent", {
          body: {
            plan: type.toUpperCase(),
            eventId: event.id,
          },
        });
      }

      if (result.error) throw result.error;
      
      const { url } = result.data;
      if (!url) throw new Error("URL de checkout não retornada");

      toast.success(`Sessão criada! Abrindo checkout ${type}...`);
      console.log(`[STRIPE TEST] Checkout URL (${type}):`, url);
      
      // Abrir em nova aba
      window.open(url, "_blank");
    } catch (error: any) {
      console.error(`[STRIPE TEST] Erro ao testar ${type}:`, error);
      toast.error(`Erro ao criar checkout ${type}: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const checkWebhookStatus = async () => {
    setLoading("webhook");
    try {
      // Verificar logs do webhook
      console.log("[STRIPE TEST] Verificando status do webhook...");
      toast.info("Verificando logs do webhook no console...");
      
      // Verificar últimas compras
      const { data: purchases, error: purchasesError } = await supabase
        .from("event_purchases" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (purchasesError) throw purchasesError;

      console.log("[STRIPE TEST] Últimas compras:", purchases);
      
      // Verificar assinaturas
      const { data: subscriptions, error: subsError } = await supabase
        .from("user_subscriptions" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (subsError) throw subsError;

      console.log("[STRIPE TEST] Últimas assinaturas:", subscriptions);
      
      toast.success("Status verificado! Veja o console para detalhes.");
    } catch (error) {
      console.error("[STRIPE TEST] Erro ao verificar webhook:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Painel de Teste Stripe
        </CardTitle>
        <CardDescription>
          Teste os fluxos de pagamento e verifique a integração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Pagamentos Únicos (por evento)</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => testCheckout("essential")}
                disabled={loading !== null}
                variant="outline"
                size="sm"
              >
                {loading === "essential" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Testar Essential (R$ {STRIPE_PRICES.ESSENTIAL.amount})
              </Button>
              <Button
                onClick={() => testCheckout("premium")}
                disabled={loading !== null}
                variant="outline"
                size="sm"
              >
                {loading === "premium" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Testar Premium (R$ {STRIPE_PRICES.PREMIUM.amount})
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Assinatura Recorrente</h4>
            <Button
              onClick={() => testCheckout("premium")}
              disabled={loading !== null}
              variant="outline"
              size="sm"
            >
              {loading === "premium" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Premium (R$ {STRIPE_PRICES.PREMIUM.amount}/mês)
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium">Verificação</h4>
            <Button
              onClick={checkWebhookStatus}
              disabled={loading !== null}
              variant="secondary"
              size="sm"
            >
              {loading === "webhook" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar Status do Webhook
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>💡 <strong>Dica:</strong> Use os cartões de teste do Stripe:</p>
          <p>• Sucesso: 4242 4242 4242 4242</p>
          <p>• Falha: 4000 0000 0000 0002</p>
          <p>• CVC: qualquer 3 dígitos | Data: qualquer data futura</p>
        </div>
      </CardContent>
    </Card>
  );
};
