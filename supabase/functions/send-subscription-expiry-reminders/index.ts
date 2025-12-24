import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Chave secreta para validar chamadas do cron job
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "internal-cron-key";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar se a chamada vem de fonte autorizada (cron job interno ou admin)
  const authHeader = req.headers.get("authorization") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const isInternalCall = cronSecret === CRON_SECRET;
  const hasServiceKey = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "INVALID");
  
  if (!isInternalCall && !hasServiceKey) {
    console.log("🚫 Unauthorized call to send-subscription-expiry-reminders");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Checking for subscriptions expiring in 5 days...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Calcular data daqui a 5 dias
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    const fiveDaysStart = new Date();
    fiveDaysStart.setDate(fiveDaysStart.getDate() + 5);
    fiveDaysStart.setHours(0, 0, 0, 0);

    console.log("Checking subscriptions expiring between:", fiveDaysStart, "and", fiveDaysFromNow);

    // Buscar assinaturas que vencem em 5 dias
    const { data: expiringSubscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("*, profiles!inner(full_name, user_id)")
      .eq("subscription_status", "active")
      .gte("current_period_end", fiveDaysStart.toISOString())
      .lte("current_period_end", fiveDaysFromNow.toISOString());

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      throw subsError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} subscriptions expiring in 5 days`);

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions expiring in 5 days" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Buscar emails dos usuários
    const userIds = expiringSubscriptions.map((sub: any) => sub.profiles.user_id);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const userEmailMap = users.users.reduce((acc: any, user: any) => {
      acc[user.id] = user.email;
      return acc;
    }, {});

    // Enviar lembretes
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of expiringSubscriptions) {
      const userEmail = userEmailMap[subscription.profiles.user_id];
      if (!userEmail) {
        console.error("Email not found for user:", subscription.profiles.user_id);
        errorCount++;
        continue;
      }

      const expiryDate = new Date(subscription.current_period_end);
      const formattedDate = expiryDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Encontre Meu Lugar <noreply@encontremeulugar.com.br>",
            to: [userEmail],
            subject: "⏰ Sua assinatura vence em 5 dias!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                <h2 style="color: #333;">Olá ${subscription.profiles.full_name}!</h2>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Sua assinatura do plano <strong>${subscription.plan}</strong> está prestes a vencer!
                </p>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px;">
                    <strong>Data de vencimento:</strong> ${formattedDate}
                  </p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Seu plano será renovado automaticamente. Se você deseja fazer alterações, 
                  acesse o painel de gerenciamento da sua conta.
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Atenciosamente,<br>
                  Equipe Encontre Meu Lugar
                </p>
                
                <!-- Rodapé Padrão -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                    <strong>Encontre Meu Lugar</strong> - Gestão Inteligente de Eventos
                  </p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                    <a href="https://encontremeulugar.com.br" style="color: #2E5E3F; text-decoration: none;">encontremeulugar.com.br</a>
                  </p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                    📧 <a href="mailto:contato@encontremeulugar.com.br" style="color: #6b7280; text-decoration: none;">contato@encontremeulugar.com.br</a>
                  </p>
                  <p style="margin: 15px 0 0 0; font-size: 11px; color: #9ca3af;">
                    © ${new Date().getFullYear()} Encontre Meu Lugar. Todos os direitos reservados.
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 10px; color: #d1d5db;">
                    Você recebeu este email porque possui uma assinatura ativa em nossa plataforma.
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Reminder sent to ${userEmail}`);
          sentCount++;
        } else {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${userEmail}:`, errorText);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        errorCount++;
      }
    }

    console.log(`Reminders sent: ${sentCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${sentCount} reminders, ${errorCount} errors`,
        sent: sentCount,
        errors: errorCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in send-subscription-expiry-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
