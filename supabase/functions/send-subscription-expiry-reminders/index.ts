import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
