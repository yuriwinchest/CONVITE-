import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInviteRequest {
  guestId?: string;
  guestIds?: string[];
  eventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { guestId, guestIds, eventId }: SendInviteRequest = await req.json();

    // Buscar evento
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        JSON.stringify({ error: "Evento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar quais convidados processar
    let guestsToProcess: string[] = [];
    if (guestId) {
      guestsToProcess = [guestId];
    } else if (guestIds && guestIds.length > 0) {
      guestsToProcess = guestIds;
    } else {
      return new Response(
        JSON.stringify({ error: "Nenhum convidado especificado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar convidados
    const { data: guests, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .in("id", guestsToProcess);

    if (guestsError || !guests || guests.length === 0) {
      console.error("Guests not found:", guestsError);
      return new Response(
        JSON.stringify({ error: "Convidados não encontrados" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    // Enviar email para cada convidado
    for (const guest of guests) {
      try {
        if (!guest.email) {
          results.failed.push({
            name: guest.name,
            error: "Email não cadastrado",
          });
          continue;
        }

        // Gerar QR Code como data URL
        const qrCodeDataUrl = await QRCode.toDataURL(guest.qr_code || "", {
          width: 300,
          margin: 2,
        });

        // Formatar data do evento
        const eventDate = new Date(event.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Link de confirmação de presença (usando URL da aplicação)
        const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
        const confirmationLink = `${appUrl}/confirm/${eventId}`;

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
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                .qr-container {
                  text-align: center;
                  margin: 30px 0;
                  padding: 20px;
                  background: white;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .event-details {
                  background: white;
                  padding: 20px;
                  border-radius: 10px;
                  margin: 20px 0;
                }
                .detail-row {
                  padding: 10px 0;
                  border-bottom: 1px solid #e5e7eb;
                }
                .detail-row:last-child {
                  border-bottom: none;
                }
                .detail-label {
                  font-weight: 600;
                  color: #667eea;
                }
                .footer {
                  text-align: center;
                  color: #6b7280;
                  font-size: 14px;
                  margin-top: 30px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">🎉 Você está convidado!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${guest.name}</strong>,</p>
                <p>É com grande prazer que convidamos você para o nosso evento especial!</p>
                
                <div class="event-details">
                  <div class="detail-row">
                    <span class="detail-label">📅 Evento:</span> ${event.name}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🕐 Data:</span> ${eventDate}
                  </div>
                  ${event.location ? `
                  <div class="detail-row">
                    <span class="detail-label">📍 Local:</span> ${event.location}
                  </div>
                  ` : ""}
                  ${guest.table_number ? `
                  <div class="detail-row">
                    <span class="detail-label">🪑 Mesa:</span> Mesa ${guest.table_number}
                  </div>
                  ` : ""}
                </div>

                <div class="qr-container">
                  <h2 style="margin-top: 0; color: #667eea;">Seu QR Code de Entrada</h2>
                  <p style="color: #6b7280; font-size: 14px;">Apresente este código na entrada do evento</p>
                  <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 250px; height: auto;" />
                  <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">
                    Você pode salvar esta imagem ou apresentar este email na entrada
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationLink}" 
                     style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            display: inline-block;
                            font-weight: 600;
                            font-size: 16px;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    ✅ Confirmar Presença
                  </a>
                  <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">
                    Clique no botão acima para confirmar sua presença no evento
                  </p>
                </div>

                ${event.description ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 10px; border-left: 4px solid #667eea;">
                  <p style="margin: 0; color: #6b7280;"><strong>Sobre o evento:</strong></p>
                  <p style="margin: 10px 0 0 0;">${event.description}</p>
                </div>
                ` : ""}

                <p style="margin-top: 30px;">Estamos ansiosos para recebê-lo!</p>
                
                <div class="footer">
                  <p>Este é um email automático, por favor não responda.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "Encontre Meu Lugar <convites@encontremeulugar.com.br>",
          to: [guest.email],
          subject: `🎉 Convite: ${event.name}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${guest.name}:`, emailResponse);
        results.success.push(guest.name);
      } catch (error: any) {
        console.error(`Error sending email to ${guest.name}:`, error);
        results.failed.push({
          name: guest.name,
          error: error.message || "Erro desconhecido",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Processo de envio concluído",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
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
