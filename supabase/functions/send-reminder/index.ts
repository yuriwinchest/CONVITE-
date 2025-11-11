import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  guestId?: string;
  guestIds?: string[];
  eventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { guestId, guestIds, eventId }: ReminderRequest = await req.json();

    // Handle bulk reminders
    if (guestIds && guestIds.length > 0) {
      console.log(`Sending bulk reminders for ${guestIds.length} guests, event:`, eventId);

      // Get event details first
      const { data: event, error: eventError } = await supabaseClient
        .from("events")
        .select("name, date, location, description")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        throw new Error("Event not found");
      }

      // Get all guests at once
      const { data: guests, error: guestsError } = await supabaseClient
        .from("guests")
        .select("id, name, email, table_number")
        .in("id", guestIds);

      if (guestsError || !guests) {
        throw new Error("Guests not found");
      }

      const results = {
        success: [] as string[],
        failed: [] as { id: string; name: string; reason: string }[],
      };

      // Format date once
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const frontendUrl = Deno.env.get("VITE_SUPABASE_URL") || "https://zjmvpvxteixzbnjazplp.lovable.app";
      const confirmationUrl = `${frontendUrl}/confirm/${eventId}`;

      // Send emails in parallel
      const emailPromises = guests.map(async (guest) => {
        if (!guest.email) {
          results.failed.push({
            id: guest.id,
            name: guest.name,
            reason: "Sem email cadastrado",
          });
          return;
        }

        try {
          await resend.emails.send({
            from: "Encontre Meu Lugar <onboarding@resend.dev>",
            to: [guest.email],
            subject: `⏰ Lembrete: ${event.name} - Não esqueça o check-in!`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
                  .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  .highlight { color: #667eea; font-weight: bold; }
                  .table-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⏰ Lembrete de Evento</h1>
                    <p style="margin: 0; font-size: 18px;">Não esqueça de fazer seu check-in!</p>
                  </div>
                  <div class="content">
                    <p>Olá, <strong>${guest.name}</strong>! 👋</p>
                    
                    <p>Este é um lembrete do seu evento que está chegando:</p>
                    
                    <div class="info-box">
                      <h2 style="margin-top: 0; color: #667eea;">📅 ${event.name}</h2>
                      <p><strong>📍 Data e Hora:</strong> ${formattedDate}</p>
                      ${event.location ? `<p><strong>📍 Local:</strong> ${event.location}</p>` : ""}
                      ${event.description ? `<p><strong>ℹ️ Descrição:</strong> ${event.description}</p>` : ""}
                    </div>

                    ${guest.table_number ? `
                      <div class="table-info">
                        <p style="margin: 0;"><strong>🪑 Sua Mesa:</strong> <span class="highlight">Mesa ${guest.table_number}</span></p>
                      </div>
                    ` : ""}

                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #1976d2;">✅ Importante: Faça seu Check-in!</h3>
                      <p>Ao chegar no evento, não esqueça de fazer seu check-in para confirmar sua presença.</p>
                      <p>Você pode fazer isso de duas formas:</p>
                      <ol>
                        <li>Escaneando o QR Code do evento</li>
                        <li>Apresentando seu QR Code pessoal para os organizadores</li>
                      </ol>
                    </div>

                    <div style="text-align: center;">
                      <a href="${confirmationUrl}" class="button">
                        Acessar Página de Check-in
                      </a>
                      <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        Clique no botão acima para acessar a página do evento e confirmar sua presença
                      </p>
                    </div>

                    <p style="margin-top: 30px;">Nos vemos no evento! 🎉</p>
                    
                    <div class="footer">
                      <p>Você está recebendo este email porque foi convidado para ${event.name}.</p>
                      <p style="margin-top: 5px;">Sistema Encontre Meu Lugar</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          results.success.push(guest.id);
        } catch (error: any) {
          console.error(`Failed to send reminder to ${guest.name}:`, error);
          results.failed.push({
            id: guest.id,
            name: guest.name,
            reason: error.message || "Erro desconhecido",
          });
        }
      });

      await Promise.all(emailPromises);

      console.log(`Bulk reminders completed. Success: ${results.success.length}, Failed: ${results.failed.length}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Lembretes enviados em massa",
          results
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Handle single reminder (existing logic)
    console.log("Sending reminder for guest:", guestId, "event:", eventId);

    // Get guest details
    const { data: guest, error: guestError } = await supabaseClient
      .from("guests")
      .select("name, email, table_number, qr_code")
      .eq("id", guestId)
      .single();

    if (guestError || !guest) {
      throw new Error("Guest not found");
    }

    if (!guest.email) {
      throw new Error("Guest does not have an email");
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("name, date, location, description")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Format date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate confirmation link to frontend
    const frontendUrl = Deno.env.get("VITE_SUPABASE_URL") || "https://zjmvpvxteixzbnjazplp.lovable.app";
    const confirmationUrl = `${frontendUrl}/confirm/${eventId}`;

    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <onboarding@resend.dev>",
      to: [guest.email],
      subject: `⏰ Lembrete: ${event.name} - Não esqueça o check-in!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .highlight { color: #667eea; font-weight: bold; }
            .table-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Lembrete de Evento</h1>
              <p style="margin: 0; font-size: 18px;">Não esqueça de fazer seu check-in!</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${guest.name}</strong>! 👋</p>
              
              <p>Este é um lembrete do seu evento que está chegando:</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0; color: #667eea;">📅 ${event.name}</h2>
                <p><strong>📍 Data e Hora:</strong> ${formattedDate}</p>
                ${event.location ? `<p><strong>📍 Local:</strong> ${event.location}</p>` : ""}
                ${event.description ? `<p><strong>ℹ️ Descrição:</strong> ${event.description}</p>` : ""}
              </div>

              ${guest.table_number ? `
                <div class="table-info">
                  <p style="margin: 0;"><strong>🪑 Sua Mesa:</strong> <span class="highlight">Mesa ${guest.table_number}</span></p>
                </div>
              ` : ""}

              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1976d2;">✅ Importante: Faça seu Check-in!</h3>
                <p>Ao chegar no evento, não esqueça de fazer seu check-in para confirmar sua presença.</p>
                <p>Você pode fazer isso de duas formas:</p>
                <ol>
                  <li>Escaneando o QR Code do evento</li>
                  <li>Apresentando seu QR Code pessoal para os organizadores</li>
                </ol>
              </div>

              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  Acessar Página de Check-in
                </a>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                  Clique no botão acima para acessar a página do evento e confirmar sua presença
                </p>
              </div>

              <p style="margin-top: 30px;">Nos vemos no evento! 🎉</p>
              
              <div class="footer">
                <p>Você está recebendo este email porque foi convidado para ${event.name}.</p>
                <p style="margin-top: 5px;">Sistema Encontre Meu Lugar</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Reminder sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Lembrete enviado com sucesso" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);