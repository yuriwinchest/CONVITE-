import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserEventUsage {
  user_id: string;
  email: string;
  plan: string;
  events_count: number;
  limit: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EVENT-LIMIT-NOTIFICATIONS] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting event limit notifications check");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Obter primeiro dia do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    logStep("Checking events since", { date: firstDayOfMonth.toISOString() });

    // Buscar todos os usuários com suas assinaturas
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("user_subscriptions")
      .select(`
        user_id,
        plan
      `);

    if (subsError) {
      logStep("Error fetching subscriptions", subsError);
      throw subsError;
    }

    logStep("Found subscriptions", { count: subscriptions?.length || 0 });

    const usersToNotify: UserEventUsage[] = [];

    // Para cada usuário, verificar uso de eventos
    for (const subscription of subscriptions || []) {
      // Buscar email do usuário
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(
        subscription.user_id
      );

      if (!authUser?.user?.email) continue;

      // Contar eventos criados este mês
      const { count: eventsCount, error: countError } = await supabaseClient
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", subscription.user_id)
        .gte("created_at", firstDayOfMonth.toISOString());

      if (countError) {
        logStep("Error counting events for user", { 
          userId: subscription.user_id, 
          error: countError 
        });
        continue;
      }

      const eventCount = eventsCount || 0;
      const plan = subscription.plan;

      // Determinar se deve notificar baseado no plano
      let shouldNotify = false;
      let limit = 0;

      if (plan === "FREE" && eventCount >= 1) {
        // FREE: já usou o evento gratuito
        shouldNotify = true;
        limit = 1;
      } else if (plan === "PREMIUM" && eventCount >= 4) {
        // PREMIUM: está próximo do limite (4 ou 5 de 5)
        shouldNotify = true;
        limit = 5;
      }

      if (shouldNotify) {
        usersToNotify.push({
          user_id: subscription.user_id,
          email: authUser.user.email,
          plan,
          events_count: eventCount,
          limit,
        });
      }
    }

    logStep("Users to notify", { count: usersToNotify.length });

    // Enviar emails
    const emailResults = [];
    
    for (const user of usersToNotify) {
      try {
        let subject = "";
        let message = "";

        if (user.plan === "FREE") {
          subject = "Você atingiu seu limite de eventos gratuitos";
          message = `
            <h2>Olá!</h2>
            <p>Você utilizou seu <strong>1 evento gratuito</strong> deste mês.</p>
            <p>Para criar mais eventos, você tem duas opções:</p>
            <ul>
              <li><strong>Plano Essencial:</strong> R$ 79 por evento (até 200 convidados)</li>
              <li><strong>Plano Premium:</strong> R$ 149/mês para até 5 eventos com convidados ilimitados</li>
            </ul>
            <p>💡 <em>Dica: Se você precisa criar mais de 1 evento por mês, o plano Premium é mais vantajoso!</em></p>
            <p><a href="${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://")}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Fazer Upgrade</a></p>
            <p>Atenciosamente,<br>Equipe Encontre Meu Lugar</p>
          `;
        } else if (user.plan === "PREMIUM") {
          const remaining = user.limit - user.events_count;
          subject = `Você está próximo do limite de eventos (${user.events_count}/${user.limit})`;
          message = `
            <h2>Olá!</h2>
            <p>Você já criou <strong>${user.events_count} de ${user.limit} eventos</strong> este mês no seu plano Premium.</p>
            ${remaining > 0 
              ? `<p>Você ainda tem <strong>${remaining} evento(s)</strong> disponível(is) até o final do mês.</p>` 
              : `<p>Você atingiu o limite de eventos deste mês. Aguarde o próximo mês para criar novos eventos.</p>`
            }
            <p>📊 Estatísticas do seu plano:</p>
            <ul>
              <li>Eventos usados: ${user.events_count}/${user.limit}</li>
              <li>Convidados: Ilimitados ✓</li>
              <li>Recursos Premium: Ativos ✓</li>
            </ul>
            <p><a href="${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://")}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Ver Meu Painel</a></p>
            <p>Atenciosamente,<br>Equipe Encontre Meu Lugar</p>
          `;
        }

        const emailResponse = await resend.emails.send({
          from: "Encontre Meu Lugar <onboarding@resend.dev>",
          to: [user.email],
          subject,
          html: message,
        });

        logStep("Email sent successfully", { 
          userId: user.user_id, 
          email: user.email,
          response: emailResponse 
        });

        emailResults.push({
          user_id: user.user_id,
          email: user.email,
          success: true,
        });

      } catch (emailError: any) {
        logStep("Error sending email", { 
          userId: user.user_id, 
          email: user.email,
          error: emailError.message 
        });
        
        emailResults.push({
          user_id: user.user_id,
          email: user.email,
          success: false,
          error: emailError.message,
        });
      }
    }

    logStep("Notification process completed", { 
      totalChecked: subscriptions?.length || 0,
      totalNotified: emailResults.length,
      successful: emailResults.filter(r => r.success).length,
      failed: emailResults.filter(r => !r.success).length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        checked: subscriptions?.length || 0,
        notified: emailResults.length,
        results: emailResults,
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
    logStep("ERROR in notification function", { message: error.message });
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
