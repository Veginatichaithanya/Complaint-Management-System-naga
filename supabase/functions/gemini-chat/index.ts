import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, chatHistory = [], userId } = await req.json()
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get knowledge base context (we'll implement this later)
    const context = await getKnowledgeBaseContext(message, supabase)

    // Prepare messages for Gemini
    const systemPrompt = `You are an AI assistant for IBM employees helping resolve internal issues. You specialize in:
- Software installation problems (Rational, WAS, DB2, etc.)
- Access control and permission issues  
- Login/VPN connectivity problems
- Bug reporting and workflow delays
- Ticket status inquiries
- General IBM internal tools support

Context from knowledge base:
${context}

Provide clear, actionable solutions. If you need more information, ask specific questions. Always be professional and helpful.`

    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...chatHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ]

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.slice(1), // Remove system prompt from contents
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.'

    // Store chat interaction
    if (userId) {
      await supabase.from('chat_history').insert({
        user_id: userId,
        user_message: message,
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function getKnowledgeBaseContext(message: string, supabase: any): Promise<string> {
  try {
    // Search knowledge base for relevant content
    const { data: kbEntries, error } = await supabase
      .from('knowledge_base')
      .select('content, title')
      .textSearch('content', message)
      .limit(3)

    if (error) throw error

    if (kbEntries && kbEntries.length > 0) {
      return kbEntries.map((entry: any) => `${entry.title}: ${entry.content}`).join('\n\n')
    }
  } catch (error) {
    console.error('Knowledge base search error:', error)
  }
  
  return 'No specific knowledge base context found.'
}