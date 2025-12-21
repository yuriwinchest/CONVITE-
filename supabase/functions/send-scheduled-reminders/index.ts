import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 Starting scheduled reminder check...");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current date at midnight
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find events that need reminders sent
    // Logic: event.date - reminder_days_before days = today AND last_reminder_sent_at is null or before today
    const { data: events, error: eventsError } = await supabaseClient
      .from("events")
      .select("id, name, date, location, description, reminder_days_before, last_reminder_sent_at")
      .not("reminder_days_before", "is", null)
      .gte("date", now.toISOString()); // Only future events

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} events with reminder settings`);

    const eventsToProcess = events?.filter((event) => {
      // Calculate the reminder date (event date - reminder_days_before)
      const eventDate = new Date(event.date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - event.reminder_days_before);
      reminderDate.setHours(0, 0, 0, 0);

      // Check if today is the reminder date
      const isReminderDay = reminderDate.getTime() === now.getTime();

      // Check if reminder was already sent today
      const lastSent = event.last_reminder_sent_at ? new Date(event.last_reminder_sent_at) : null;
      const alreadySentToday = lastSent && lastSent.setHours(0, 0, 0, 0) === now.getTime();

      console.log(`Event: ${event.name}`);
      console.log(`  Event date: ${eventDate.toISOString()}`);
      console.log(`  Reminder date: ${reminderDate.toISOString()}`);
      console.log(`  Today: ${now.toISOString()}`);
      console.log(`  Is reminder day: ${isReminderDay}`);
      console.log(`  Already sent today: ${alreadySentToday}`);

      return isReminderDay && !alreadySentToday;
    }) || [];

    console.log(`${eventsToProcess.length} events need reminders sent today`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      details: [] as any[],
    };

    // Process each event
    for (const event of eventsToProcess) {
      console.log(`Processing event: ${event.name}`);
      results.processed++;

      try {
        // Get all guests with email for this event
        const { data: guests, error: guestsError } = await supabaseClient
          .from("guests")
          .select("id, name, email, table_number")
          .eq("event_id", event.id)
          .not("email", "is", null);

        if (guestsError) throw guestsError;

        console.log(`  Found ${guests?.length || 0} guests with email`);

        if (!guests || guests.length === 0) {
          results.details.push({
            eventId: event.id,
            eventName: event.name,
            status: "skipped",
            reason: "No guests with email",
          });
          continue;
        }

        // Format event date
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const frontendUrl = Deno.env.get("VITE_SUPABASE_URL") || "https://hvmdogtwaxddnkwakobh.supabase.co";
        const confirmationUrl = `${frontendUrl}/confirm/${event.id}`;

        // Send reminders to all guests
        const emailPromises = guests.map(async (guest) => {
          try {
            await resend.emails.send({
              from: "Encontre Meu Lugar <lembretes@encontremeulugar.com.br>",
              to: [guest.email!],
              subject: `⏰ Lembrete: ${event.name} - ${event.reminder_days_before} ${event.reminder_days_before === 1 ? 'dia' : 'dias'} para o evento!`,
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
                    .countdown { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>⏰ Lembrete Automático</h1>
                      <p style="margin: 0; font-size: 18px;">Seu evento está chegando!</p>
                    </div>
                    <div class="content">
                      <p>Olá, <strong>${guest.name}</strong>! 👋</p>
                      
                      <div class="countdown">
                        <h2 style="margin: 0; color: #2e7d32; font-size: 28px;">
                          ${event.reminder_days_before} ${event.reminder_days_before === 1 ? 'DIA' : 'DIAS'}
                        </h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">para o evento</p>
                      </div>
                      
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
                        <h3 style="margin-top: 0; color: #1976d2;">✅ Não esqueça!</h3>
                        <p>Ao chegar no evento, faça seu check-in para confirmar sua presença.</p>
                        <p>Você pode fazer isso de duas formas:</p>
                        <ol>
                          <li>Escaneando o QR Code do evento</li>
                          <li>Apresentando seu QR Code pessoal para os organizadores</li>
                        </ol>
                      </div>

                      <div style="text-align: center;">
                        <a href="${confirmationUrl}" class="button">
                          Acessar Página do Evento
                        </a>
                        <p style="margin-top: 10px; font-size: 12px; color: #666;">
                          Clique no botão acima para acessar a página do evento
                        </p>
                      </div>

                      <p style="margin-top: 30px;">Nos vemos em breve! 🎉</p>
                      
                      <div class="footer">
                        <p>Este é um lembrete automático enviado ${event.reminder_days_before} ${event.reminder_days_before === 1 ? 'dia' : 'dias'} antes de ${event.name}.</p>
                        <p style="margin-top: 5px;">Sistema Encontre Meu Lugar</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });
          } catch (error) {
            console.error(`Failed to send reminder to ${guest.name}:`, error);
            throw error;
          }
        });

        await Promise.all(emailPromises);

        // Update last_reminder_sent_at
        const { error: updateError } = await supabaseClient
          .from("events")
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq("id", event.id);

        if (updateError) throw updateError;

        results.success++;
        results.details.push({
          eventId: event.id,
          eventName: event.name,
          status: "success",
          guestCount: guests.length,
        });

        console.log(`  ✅ Successfully sent ${guests.length} reminders for ${event.name}`);
      } catch (error: any) {
        console.error(`  ❌ Failed to process event ${event.name}:`, error);
        results.failed++;
        results.details.push({
          eventId: event.id,
          eventName: event.name,
          status: "failed",
          error: error.message,
        });
      }
    }

    console.log("📊 Summary:");
    console.log(`  Processed: ${results.processed}`);
    console.log(`  Success: ${results.success}`);
    console.log(`  Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scheduled reminders processed",
        results,
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
    console.error("Error in send-scheduled-reminders function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
