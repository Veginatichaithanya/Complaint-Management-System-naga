
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your IBM AI Assistant. I can help you with software installation, access control, VPN issues, tool problems, bug reporting, and ticket inquiries. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (message: string): Promise<string> => {
    if (!message.trim()) return '';

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare chat history for context
      const chatHistory = messages.map(msg => ({
        text: msg.text,
        sender: msg.sender
      }));

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message,
          chatHistory,
          userId: user?.id
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      return data.response;
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response. Please check if your Gemini API key is configured.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please make sure the Gemini API key is configured in Supabase secrets.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return errorMessage.text;
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Hello! I\'m your IBM AI Assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    isLoading: isTyping
  };
}
