
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the auth token from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user context (not service role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { authorization: authHeader }
        }
      }
    );

    // Get authenticated user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user ID (derived from token, not request body)
    const userId = user.id;
    console.log('Processing chat for authenticated user:', userId);

    // Store user message using the authenticated user context
    const { error: insertError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        message: message,
        sender_type: 'user'
      });

    if (insertError) {
      console.error('Error inserting user message:', insertError);
      // Continue processing even if chat history fails
    }

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced system prompt for complaint desk context
    const systemPrompt = `You are a helpful AI assistant for a complaint management system. 
    You help employees with their concerns, guide them through the complaint process, and provide support.
    Be professional, empathetic, and concise. If someone has a serious complaint, encourage them to use the formal complaint system.
    Keep responses helpful but brief (under 200 words when possible).`;

    // Get recent chat history for context (using RLS-protected query)
    const { data: chatHistory } = await supabase
      .from('chat_history')
      .select('message, sender_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build conversation context
    let conversationContext = systemPrompt + "\n\nRecent conversation:\n";
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.reverse().forEach(chat => {
        conversationContext += `${chat.sender_type === 'user' ? 'User' : 'Assistant'}: ${chat.message}\n`;
      });
    }
    conversationContext += `User: ${message}\nAssistant:`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: conversationContext
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'Sorry, I encountered an issue processing your request.';

    // Store AI response using authenticated user context
    const { error: aiInsertError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        message: aiResponse,
        sender_type: 'bot'
      });

    if (aiInsertError) {
      console.error('Error inserting AI message:', aiInsertError);
      // Continue processing even if chat history fails
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
