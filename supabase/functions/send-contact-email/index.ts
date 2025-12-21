import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-contact-email] Function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactEmailRequest = await req.json();
    
    console.log("[send-contact-email] Received data:", { name, email, messageLength: message?.length });

    // Validate input
    if (!name || !email || !message) {
      console.log("[send-contact-email] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("[send-contact-email] Invalid email format");
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate length limits
    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      console.log("[send-contact-email] Input too long");
      return new Response(
        JSON.stringify({ error: "Dados excedem o limite permitido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email to support (modo de teste do Resend)
    const emailResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <onboarding@resend.dev>",
      to: ["suporte@encontremeulugar.com.br"],
      reply_to: email,
      subject: `Nova mensagem de contato - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2E5E3F; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #E8E0D2; margin: 0; font-size: 24px;">Nova Mensagem de Contato</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 15px;"><strong>Nome:</strong> ${name}</p>
            <p style="margin: 0 0 15px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 0 0 10px;"><strong>Mensagem:</strong></p>
            <div style="background-color: #fff; padding: 15px; border-radius: 4px; border: 1px solid #eee;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Este email foi enviado através do formulário de contato do site Encontre Meu Lugar.
          </p>
        </div>
      `,
    });

    console.log("[send-contact-email] Email sent to support:", emailResponse);

    if (emailResponse?.error) {
      console.error("[send-contact-email] Support email failed:", emailResponse.error);
      return new Response(
        JSON.stringify({
          error:
            "Envio de email está em modo de teste e bloqueou o destinatário. Verifique um domínio no Resend e use um remetente do seu domínio (ex: contato@seudominio.com).",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email to user (modo de teste do Resend)
    const confirmationResponse = await resend.emails.send({
      from: "Encontre Meu Lugar <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua mensagem - Encontre Meu Lugar",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2E5E3F; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #E8E0D2; margin: 0; font-size: 24px;">Recebemos sua mensagem!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 15px;">Olá ${name},</p>
            <p style="margin: 0 0 15px;">Obrigado por entrar em contato conosco! Recebemos sua mensagem e responderemos o mais breve possível.</p>
            <p style="margin: 0 0 15px;"><strong>Sua mensagem:</strong></p>
            <div style="background-color: #fff; padding: 15px; border-radius: 4px; border: 1px solid #eee;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin: 20px 0 0;">Atenciosamente,<br><strong>Equipe Encontre Meu Lugar</strong></p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 20px; text-align: center;">
            © 2025 Encontre Meu Lugar. Todos os direitos reservados.
          </p>
        </div>
      `,
    });

    console.log("[send-contact-email] Confirmation sent to user:", confirmationResponse);

    if (confirmationResponse?.error) {
      console.error("[send-contact-email] Confirmation email failed:", confirmationResponse.error);
      return new Response(
        JSON.stringify({
          error:
            "Envio de confirmação está em modo de teste e bloqueou o destinatário. Verifique um domínio no Resend e use um remetente do seu domínio.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Mensagem enviada com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-contact-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar mensagem" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);