import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  email: string;
  userName: string;
  cancelAt: string | null;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CANCELLATION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, userName, cancelAt }: CancellationEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Sending cancellation email", { email, userName, cancelAt });

    const cancelDate = cancelAt 
      ? new Date(cancelAt).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
      : 'o final do período atual';

    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <noreply@encontremeulugar.com.br>",
      to: [email],
      subject: "Confirmação de Cancelamento - Encontre Meu Lugar",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">
                  Cancelamento Confirmado
                </h1>
                <p style="color: #71717a; font-size: 16px; margin: 0;">
                  Sua solicitação foi processada com sucesso
                </p>
              </div>

              <!-- Main Content -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  ⚠️ Sua assinatura Premium será cancelada em <strong>${cancelDate}</strong>
                </p>
              </div>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Olá${userName ? ` ${userName}` : ''},
              </p>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Confirmamos que sua assinatura Premium do <strong>Encontre Meu Lugar</strong> foi cancelada conforme solicitado.
              </p>

              <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #18181b; font-size: 16px; margin: 0 0 16px 0;">
                  O que acontece agora:
                </h3>
                <ul style="color: #52525b; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Você continuará com acesso Premium até ${cancelDate}</li>
                  <li>Não haverá mais cobranças após essa data</li>
                  <li>Após o período, seu plano voltará para Gratuito</li>
                  <li>Seus eventos e dados serão mantidos</li>
                </ul>
              </div>

              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Se você cancelou por engano ou mudou de ideia, você pode reativar sua assinatura a qualquer momento acessando a página de Assinatura no seu painel.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://color-frame-flow.lovable.app/subscription" 
                   style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Gerenciar Assinatura
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; margin-top: 32px;">
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                  Agradecemos por ter sido um assinante Premium! Se tiver dúvidas ou feedback, entre em contato conosco.
                </p>
                <p style="color: #a1a1aa; font-size: 12px; margin: 16px 0 0 0;">
                  Encontre Meu Lugar - Gestão inteligente de eventos
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
