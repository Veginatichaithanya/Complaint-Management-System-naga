
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, AlertCircle, Sparkles, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RobotAvatar } from '@/components/ui/robot-avatar';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { SuggestionChips } from '@/components/ui/suggestion-chips';

export function ChatbotPage() {
  const { messages, isTyping, sendMessage, clearChat } = useGeminiChat();
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Hide suggestions after first user message
    if (messages.length > 1) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const handleSendMessage = (message?: string) => {
    const textToSend = message || inputText;
    if (!textToSend.trim()) return;
    
    sendMessage(textToSend);
    setInputText('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const formatMessage = (text: string) => {
    // Replace **text** with bold formatting
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace bullet points
    formatted = formatted.replace(/^\* (.*$)/gim, '• $1');
    
    // Replace numbered lists
    formatted = formatted.replace(/^\d+\. (.*$)/gim, (match, p1, offset, string) => {
      const lineNumber = string.substring(0, offset).split('\n').length;
      return `${lineNumber}. ${p1}`;
    });
    
    // Add line breaks for better readability
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/90 backdrop-blur-xl border-border/50 h-[700px] flex flex-col shadow-xl relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-200/30 rounded-full"
                animate={{
                  x: [0, 100, -100, 0],
                  y: [0, -100, 100, 0],
                  scale: [1, 1.5, 0.5, 1],
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
              />
            ))}
          </div>

          <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b backdrop-blur-sm relative z-10 flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 p-2 bg-white rounded-lg shadow-md">
                  <img 
                    src="/lovable-uploads/0b95f801-2cf3-4378-9730-dbd180c31fcd.png" 
                    alt="IBM Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    IBM AI Assistant
                  </span>
                  <p className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    Your intelligent support companion
                  </p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 relative z-10 min-h-0">
            <Alert className="m-4 border-blue-200 bg-blue-50/80 backdrop-blur-sm flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Make sure your Gemini API key is configured in Supabase secrets for AI responses.
              </AlertDescription>
            </Alert>
            
            {/* Messages with ScrollArea */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start gap-4 max-w-[80%] ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {message.sender === 'user' ? (
                        <RobotAvatar state="idle" size="md" />
                      ) : (
                        <div className="w-12 h-12 p-1 bg-white rounded-lg shadow-md flex-shrink-0">
                          <img 
                            src="/lovable-uploads/0b95f801-2cf3-4378-9730-dbd180c31fcd.png" 
                            alt="IBM Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      
                      <motion.div 
                        className={`rounded-2xl px-5 py-4 shadow-lg ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div 
                          className={`text-sm leading-relaxed ${
                            message.sender === 'user' ? 'text-white' : 'text-gray-800'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: message.sender === 'bot' 
                              ? formatMessage(message.text) 
                              : message.text 
                          }}
                        />
                        <p className={`text-xs mt-3 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                
                <AnimatePresence>
                  {isTyping && (
                    <TypingIndicator message="AI Assistant is thinking..." />
                  )}
                </AnimatePresence>

                {/* Suggestion chips */}
                <AnimatePresence>
                  {showSuggestions && messages.length === 1 && (
                    <SuggestionChips 
                      onSuggestionClick={handleSuggestionClick}
                      isVisible={showSuggestions}
                    />
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input - Fixed at bottom */}
            <div className="p-6 border-t bg-white/90 backdrop-blur-sm flex-shrink-0">
              <div className="flex gap-3 relative">
                <div className="flex-1 relative">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe your issue with IBM software, tools, or access..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3 px-5 pr-12 text-sm shadow-sm"
                    disabled={isTyping}
                  />
                  
                  {/* Attachment button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isTyping}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isTyping}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
