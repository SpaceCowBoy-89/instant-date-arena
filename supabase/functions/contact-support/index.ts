import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactSupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactSupportRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "SpeedHeart Support <onboarding@resend.dev>",
      to: ["support@speedheart.app"], // Replace with actual support email
      subject: `Support Request: ${subject}`,
      html: `
        <h2>New Support Request from ${name}</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div>
          <strong>Message:</strong>
          <br><br>
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><em>This message was sent from the SpeedHeart support form.</em></p>
      `,
    });

    // Send confirmation email to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "SpeedHeart Support <onboarding@resend.dev>",
      to: [email],
      subject: "We received your support request",
      html: `
        <h1>Thank you for contacting SpeedHeart Support!</h1>
        <p>Hi ${name},</p>
        <p>We've received your support request and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Your message:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p>Our support team typically responds within 24-48 hours. If your issue is urgent, please don't hesitate to reach out again.</p>
        
        <p>In the meantime, you might find answers to common questions in our <a href="https://speedheart.app/support">Support Center</a>.</p>
        
        <p>Best regards,<br>The SpeedHeart Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated confirmation email. Please do not reply to this message.
        </p>
      `,
    });

    console.log("Support email sent:", supportEmailResponse);
    console.log("Confirmation email sent:", confirmationEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Support request sent successfully" 
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
    console.error("Error in contact-support function:", error);
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