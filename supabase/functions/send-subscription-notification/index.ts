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
  type: "renewal" | "cancellation" | "upcoming_renewal" | "upgrade";
  subscriptionEnd?: string;
  daysUntilRenewal?: number;
  plan?: string;
  previousPlan?: string;
  eventId?: string;
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
    case "upgrade":
      return `
        <div style="${baseStyle}">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 32px;">🎉 Upgrade Concluído!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
              Parabéns! Seu evento <strong>${data.eventName || "foi atualizado"}</strong> agora está no plano <strong style="color: #667eea;">Premium</strong>! ✨
            </p>
          </div>
          <div style="margin: 30px 0;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">🚀 Novos recursos ativados:</h2>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; color: #555;">
                ✅ <strong>Convidados ilimitados</strong> - Sem limite de pessoas no seu evento
              </li>
              <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; color: #555;">
                📸 <strong>Envio de fotos</strong> - Seus convidados podem enviar até 30 fotos cada
              </li>
              <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; color: #555;">
                🗺️ <strong>Mapa interativo de mesas</strong> - Visualização completa da disposição
              </li>
              <li style="padding: 12px 0; font-size: 16px; color: #555;">
                📊 <strong>Relatórios avançados</strong> - Exportação em PDF e análises detalhadas
              </li>
            </ul>
          </div>
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 30px 0;">
            <p style="font-size: 16px; color: #333; margin: 0; line-height: 1.6;">
              💡 <strong>Dica:</strong> Acesse o painel do seu evento para começar a usar todos os novos recursos Premium!
            </p>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${data.eventUrl || "#"}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Acessar Meu Evento
            </a>
          </div>
          <p style="font-size: 14px; color: #888; margin-top: 40px; text-align: center;">
            Obrigado por fazer upgrade! Estamos aqui para tornar seu evento inesquecível. 🎊
          </p>
        </div>
      `;
    
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
    case "upgrade":
      return "🎉 Upgrade para Premium concluído com sucesso!";
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
    const { userId, type, subscriptionEnd, daysUntilRenewal, plan, previousPlan, eventId }: NotificationRequest = await req.json();

    console.log("Sending subscription notification", { userId, type, eventId });

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

    // Buscar informações do evento se for upgrade
    let eventData: any = { subscriptionEnd, daysUntilRenewal, plan, previousPlan };
    
    if (type === "upgrade" && eventId) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("name, id")
        .eq("id", eventId)
        .single();
      
      if (!eventError && event) {
        eventData.eventName = event.name;
        eventData.eventUrl = `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || ""}/events/${event.id}`;
      }
    }

    const emailHtml = getEmailTemplate(type, eventData);
    const subject = getEmailSubject(type);

    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <noreply@encontremeulugar.com.br>",
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
