import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMovieRecommendation } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  currentContext: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '0',
        role: 'model',
        text: 'Greetings. I am CineFlow AI. Ask me about the current movie, or describe your mood for a personalized recommendation.',
        timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const responseText = await generateMovieRecommendation(userMsg.text, currentContext);
    
    const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="pointer-events-auto w-80 md:w-96 h-[500px] bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4"
                >
                    {/* Header */}
                    <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-white">CineFlow Intelligence</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {messages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-100 rounded-tr-none' 
                                    : 'bg-zinc-800 text-zinc-300 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                             <div className="flex justify-start">
                                <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                            placeholder="Ask for recommendations..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-yellow-500 rounded-full text-black hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black p-4 rounded-full shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-110 group relative"
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            {!isOpen && (
                <span className="absolute right-0 top-0 -mt-1 -mr-1 w-3 h-3 bg-red-500 rounded-full border border-black"></span>
            )}
        </button>
    </div>
  );
};
