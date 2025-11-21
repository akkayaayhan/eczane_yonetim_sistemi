import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product, Message } from '../types';
import { createPharmacyChat } from '../services/gemini';
import { Chat } from '@google/genai';

interface Props {
  inventory: Product[];
}

const ChatConsultant: React.FC<Props> = ({ inventory }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', content: 'Merhaba! Ben Eczane asistanınızım. Stoklarımızla ilgili veya genel sağlık sorularınızı sorabilirsiniz.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat session
  useEffect(() => {
    chatRef.current = createPharmacyChat(inventory);
  }, [inventory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Streaming response
      const result = await chatRef.current.sendMessageStream({ message: userMsg.content });
      
      let fullResponse = '';
      const responseId = (Date.now() + 1).toString();
      
      // Add placeholder for model message
      setMessages(prev => [...prev, { id: responseId, role: 'model', content: '', timestamp: Date.now() }]);

      for await (const chunk of result) {
         const text = (chunk as any).text || '';
         fullResponse += text;
         
         setMessages(prev => prev.map(m => 
            m.id === responseId ? { ...m, content: fullResponse } : m
         ));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Üzgünüm, bir bağlantı hatası oluştu.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <Bot className="text-blue-600" />
        <h2 className="font-semibold text-slate-700">PharmaAI Chat</h2>
        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full ml-auto">Gemini 3.0 Pro</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <Loader2 size={16} className="text-white animate-spin" />
            </div>
             <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-400 text-sm">
                Yazıyor...
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sorunuzu yazın..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultant;