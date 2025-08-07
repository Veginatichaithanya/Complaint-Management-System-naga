
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MagicLinkVerification } from './_templates/magic-link-verification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  fullName: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, userId }: VerificationEmailRequest = await req.json();
    
    console.log("Sending verification email to:", email, "for user:", userId);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate a secure token for email verification
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Store verification token in database
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString(),
        email: email
      });

    if (tokenError) {
      console.error("Error storing verification token:", tokenError);
      throw new Error("Failed to create verification token");
    }

    // Create magic link
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/v1', '') || 'http://localhost:54321';
    const magicLink = `${baseUrl}/verify-email?token=${token}`;

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(MagicLinkVerification, {
        customerName: fullName,
        magicLink: magicLink,
      })
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Complaindesk <onboarding@resend.dev>",
      to: [email],
      subject: "✨ Welcome to Complaindesk – Confirm Your Email",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent successfully",
        emailId: emailResponse.data?.id 
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
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send verification email" 
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
