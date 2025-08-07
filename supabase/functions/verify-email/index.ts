
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Link - Complaindesk</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid Verification Link</h1>
          <p>The verification link is missing required parameters.</p>
          <p><a href="/">Return to Complaindesk</a></p>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Verifying email with token:", token);

    // Check if token exists and is valid
    const { data: verificationData, error: verificationError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (verificationError || !verificationData) {
      console.error("Token verification error:", verificationError);
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Token - Complaindesk</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid or Expired Link</h1>
          <p>This verification link is either invalid or has already been used.</p>
          <p><a href="/">Return to Complaindesk</a></p>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(verificationData.expires_at);
    
    if (now > expiresAt) {
      console.log("Token has expired");
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expired Link - Complaindesk</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Link Expired</h1>
          <p>This verification link has expired. Please request a new one.</p>
          <p><a href="/">Return to Complaindesk</a></p>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Update user's email verification status
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verificationData.user_id,
      { 
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { email_verified: true }
      }
    );

    if (updateError) {
      console.error("Error updating user verification status:", updateError);
      throw new Error("Failed to verify email");
    }

    // Delete the used token
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('token', token);

    console.log("Email verification successful for user:", verificationData.user_id);

    // Return success page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified - Complaindesk</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background-color: #f6f9fc;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .success { color: #10b981; }
          .button {
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Email Verified Successfully!</h1>
          <p>Your email has been successfully verified. You can now log in to your Complaindesk account.</p>
          <a href="/" class="button">Go to Complaindesk</a>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in verify-email function:", error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error - Complaindesk</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1 class="error">Verification Error</h1>
        <p>An error occurred while verifying your email. Please try again.</p>
        <p><a href="/">Return to Complaindesk</a></p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

serve(handler);
