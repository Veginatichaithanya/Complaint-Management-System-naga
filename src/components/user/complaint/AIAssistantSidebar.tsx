
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { RobotAvatar } from '@/components/ui/robot-avatar';
import { TypingIndicator } from '@/components/ui/typing-indicator';

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantSidebar({ isOpen, onClose }: AIAssistantSidebarProps) {
  const { messages, isTyping, sendMessage } = useGeminiChat();
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
    formatted = formatted.replace(/^\* (.*$)/gim, '• $1');
    formatted = formatted.replace(/^\d+\. (.*$)/gim, (match, p1, offset, string) => {
      const lineNumber = string.substring(0, offset).split('\n').length;
      return `${lineNumber}. ${p1}`;
    });
    formatted = formatted.replace(/\n/g, '<br />');
    return formatted;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            <Card className="h-full flex flex-col border-0 rounded-none relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30" />
              
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm relative z-10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-12 h-12 p-1 bg-white rounded-lg shadow-md">
                      <img 
                        src="/lovable-uploads/0b95f801-2cf3-4378-9730-dbd180c31fcd.png" 
                        alt="IBM Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      AI Assistant
                    </span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/50">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get help diagnosing your issue before submission.
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 relative z-10 min-h-0">
                {/* Messages with proper scrolling */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex items-start gap-3 max-w-[85%] ${
                            message.sender === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {message.sender === 'user' ? (
                            <RobotAvatar state="idle" size="sm" />
                          ) : (
                            <div className="w-8 h-8 p-1 bg-white rounded-lg shadow-sm flex-shrink-0">
                              <img 
                                src="/lovable-uploads/0b95f801-2cf3-4378-9730-dbd180c31fcd.png" 
                                alt="IBM Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <motion.div 
                            className={`rounded-2xl px-4 py-3 ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                            }`}
                            whileHover={{ scale: 1.02 }}
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
                            <p className={`text-xs mt-2 ${
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
                        <TypingIndicator message="AI is analyzing..." />
                      )}
                    </AnimatePresence>

                    {/* Suggestion chips for sidebar */}
                    <AnimatePresence>
                      {showSuggestions && messages.length === 1 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">
                            Quick help options:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {['Password issue', 'VPN problem', 'Access denied', 'Bug report'].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(`I need help with: ${suggestion}`)}
                                className="text-xs py-1 px-2 rounded-full hover:bg-blue-50"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input - Fixed at bottom */}
                <div className="p-4 border-t bg-white/90 backdrop-blur-sm flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Describe your issue for AI assistance..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isTyping}
                      className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim() || isTyping}
                        className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
