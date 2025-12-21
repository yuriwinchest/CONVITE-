import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  guestName: string;
  tableNumber: number | null;
  eventId: string;
  eventName: string;
  creatorUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { guestName, tableNumber, eventId, eventName, creatorUserId }: NotificationRequest = await req.json();

    console.log("Processing confirmation notification:", { guestName, eventName, creatorUserId });

    // Get creator's email from auth.users via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(creatorUserId);

    if (userError || !userData?.user?.email) {
      console.error("Creator user not found or no email:", userError);
      return new Response(
        JSON.stringify({ error: "Email do organizador não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const creatorEmail = userData.user.email;

    // Get total confirmations for this event
    const { count: totalConfirmed } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("confirmed", true);

    const { count: totalGuests } = await supabase
      .from("guests")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    const confirmationTime = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .confirmation-card {
              background: white;
              padding: 25px;
              border-radius: 10px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            .detail-row {
              padding: 10px 0;
              display: flex;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #059669;
              min-width: 120px;
            }
            .stats-box {
              background: #ecfdf5;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin: 20px 0;
            }
            .stats-number {
              font-size: 32px;
              font-weight: bold;
              color: #059669;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ Confirmação de Presença</h1>
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>Um convidado acabou de confirmar presença no seu evento <strong>${eventName}</strong>!</p>
            
            <div class="confirmation-card">
              <h2 style="margin-top: 0; color: #059669; font-size: 20px;">📋 Detalhes da Confirmação</h2>
              
              <div class="detail-row">
                <span class="detail-label">👤 Convidado:</span>
                <span><strong>${guestName}</strong></span>
              </div>
              
              ${tableNumber ? `
              <div class="detail-row">
                <span class="detail-label">🪑 Mesa:</span>
                <span><strong>Mesa ${tableNumber}</strong></span>
              </div>
              ` : ""}
              
              <div class="detail-row">
                <span class="detail-label">🕐 Confirmado em:</span>
                <span>${confirmationTime}</span>
              </div>
            </div>

            <div class="stats-box">
              <p style="margin: 0 0 10px 0; color: #059669; font-weight: 600;">Total de Confirmações</p>
              <div class="stats-number">${totalConfirmed || 0}/${totalGuests || 0}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">convidados confirmaram presença</p>
            </div>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Você pode acompanhar todas as confirmações no painel de gerenciamento do seu evento.
            </p>
            
            <div class="footer">
              <p>Este é um email automático enviado pelo sistema de gestão de eventos.</p>
            </div>
            
            <!-- Rodapé Padrão -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                <strong>Encontre Meu Lugar</strong> - Gestão Inteligente de Eventos
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                <a href="https://encontremeulugar.com.br" style="color: #10b981; text-decoration: none;">encontremeulugar.com.br</a>
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                📧 <a href="mailto:contato@encontremeulugar.com.br" style="color: #6b7280; text-decoration: none;">contato@encontremeulugar.com.br</a>
              </p>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} Encontre Meu Lugar. Todos os direitos reservados.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 10px; color: #d1d5db;">
                Você recebeu este email porque é o organizador deste evento.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <noreply@encontremeulugar.com.br>",
      to: [creatorEmail],
      subject: `✅ ${guestName} confirmou presença - ${eventName}`,
      html: emailHtml,
    });

    console.log(`Notification email sent to ${creatorEmail}:`, emailResponse);

    return new Response(
      JSON.stringify({
        message: "Notificação enviada com sucesso",
        emailResponse,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
