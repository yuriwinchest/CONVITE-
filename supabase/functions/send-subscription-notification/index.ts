import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: "renewal" | "cancellation" | "upcoming_renewal";
  subscriptionEnd?: string;
  daysUntilRenewal?: number;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const getEmailTemplate = (type: string, data: any) => {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  switch (type) {
    case "upcoming_renewal":
      return `
        <div style="${baseStyle}">
          <h1 style="color: #333; margin-bottom: 20px;">⏰ Renovação da Assinatura em Breve</h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Olá! Sua assinatura <strong>Professional</strong> será renovada em ${data.daysUntilRenewal} dias.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Data de renovação: <strong>${new Date(data.subscriptionEnd).toLocaleDateString("pt-BR")}</strong>
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            Se você deseja fazer alterações na sua assinatura, acesse seu painel de controle.
          </p>
        </div>
      `;
    
    case "renewal":
      return `
        <div style="${baseStyle}">
          <h1 style="color: #333; margin-bottom: 20px;">✅ Assinatura Renovada com Sucesso</h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Boa notícia! Sua assinatura <strong>Professional</strong> foi renovada com sucesso.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Próxima renovação: <strong>${new Date(data.subscriptionEnd).toLocaleDateString("pt-BR")}</strong>
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            Obrigado por continuar conosco! 🎉
          </p>
        </div>
      `;
    
    case "cancellation":
      return `
        <div style="${baseStyle}">
          <h1 style="color: #333; margin-bottom: 20px;">😔 Assinatura Cancelada</h1>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Sua assinatura <strong>Professional</strong> foi cancelada.
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Você continuará tendo acesso aos recursos premium até: <strong>${data.subscriptionEnd ? new Date(data.subscriptionEnd).toLocaleDateString("pt-BR") : "o final do período atual"}</strong>
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            Sentiremos sua falta. Se você quiser voltar, estaremos sempre aqui! ❤️
          </p>
        </div>
      `;
    
    default:
      return `<p>Notificação de assinatura</p>`;
  }
};

const getEmailSubject = (type: string) => {
  switch (type) {
    case "upcoming_renewal":
      return "⏰ Sua assinatura será renovada em breve";
    case "renewal":
      return "✅ Assinatura renovada com sucesso";
    case "cancellation":
      return "Confirmação de cancelamento da assinatura";
    default:
      return "Atualização da sua assinatura";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, subscriptionEnd, daysUntilRenewal }: NotificationRequest = await req.json();

    console.log("Sending subscription notification", { userId, type });

    // Buscar o email do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar o email do auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user?.email) {
      throw new Error("Email do usuário não encontrado");
    }

    const emailHtml = getEmailTemplate(type, { subscriptionEnd, daysUntilRenewal });
    const subject = getEmailSubject(type);

    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <onboarding@resend.dev>",
      to: [user.email],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
