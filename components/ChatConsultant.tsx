import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product, Message } from '../types';
import { createPharmacyChat } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

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
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize chat session
  const initChat = () => {
    try {
      chatRef.current = createPharmacyChat(inventory);
      setInitError(null);
    } catch (e: any) {
      console.error("Chat başlatılamadı:", e);
      if (e.message === 'API_KEY_MISSING') {
          setInitError('API_KEY_MISSING');
      } else {
          setInitError(e.message || "API bağlantısı kurulamadı.");
      }
    }
  };

  useEffect(() => {
    initChat();
  }, [inventory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Re-initialize if lost or null
    if (!chatRef.current) {
      try {
        chatRef.current = createPharmacyChat(inventory);
      } catch (e: any) {
         let errorContent = `❌ Hata: ${e.message}`;
         if (e.message === 'API_KEY_MISSING') {
             errorContent = '⚠️ API Anahtarı eksik. Lütfen giriş sayfasındaki ayarlar menüsünden ekleyin.';
         }
         setMessages(prev => [...prev, { 
             id: Date.now().toString(), 
             role: 'model', 
             content: errorContent, 
             timestamp: Date.now() 
         }]);
         return;
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: responseId, role: 'model', content: '', timestamp: Date.now() }]);

    try {
      // Streaming response
      const result = await chatRef.current.sendMessageStream({ message: userMsg.content });
      
      let fullResponse = '';
      
      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         const text = c.text; // Safe access via getter
         
         if (text) {
           fullResponse += text;
           setMessages(prev => prev.map(m => 
              m.id === responseId ? { ...m, content: fullResponse } : m
           ));
         }
      }
    } catch (error: any) {
      console.error("Chat Error Full:", error);
      let errorMsg = `Bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`;
      
      if (errorMsg.includes('API_KEY_MISSING') || errorMsg.includes('API_KEY')) {
        errorMsg = '🚨 API Anahtarı bulunamadı. Lütfen "Çıkış Yap" butonuna basıp Giriş Ekranına dönün ve sağ üst köşedeki ⚙️ Ayarlar ikonundan API anahtarınızı girin.';
      } else if (errorMsg.includes('400')) {
        errorMsg = '⚠️ İstek çok büyük veya geçersiz. (400 Bad Request)';
      } else if (errorMsg.includes('429')) {
        errorMsg = '⏳ Kota aşıldı (Rate Limit). Lütfen biraz bekleyip tekrar deneyin.';
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        errorMsg = '🌐 İnternet bağlantı hatası veya sunucuya erişilemiyor.';
      } else if (errorMsg.includes('503')) {
        errorMsg = '🔧 Servis geçici olarak kullanılamıyor (503).';
      }

      setMessages(prev => prev.map(m => 
        m.id === responseId ? { ...m, content: errorMsg } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Height adjusted for mobile viewport (dvh) minus headers/footers
    <div className="flex flex-col h-[calc(100dvh-180px)] md:h-[calc(100vh-200px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 justify-between shrink-0">
        <div className="flex items-center gap-2">
            <Bot className="text-blue-600" />
            <h2 className="font-semibold text-slate-700">PharmaAI Chat</h2>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={initChat} 
              title="Sohbeti Yenile"
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            >
                <RefreshCw size={16} />
            </button>
            {initError ? (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} /> Bağlantı Sorunu
                </span>
            ) : (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Çevrimiçi (v2.5 Flash)</span>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50" ref={scrollRef}>
        {initError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm mb-4 animate-pulse">
                <strong>Sistem Hatası:</strong> API Anahtarı eksik.
                <br/><br/>
                Lütfen şu adımları izleyin:
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Sol menüden "Çıkış Yap" deyin.</li>
                    <li>Giriş ekranında sağ üstteki ⚙️ (Ayarlar) ikonuna tıklayın.</li>
                    <li>Gemini API anahtarınızı (AIzaSy...) yapıştırıp kaydedin.</li>
                </ol>
            </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            <div className={`max-w-[85%] p-3 md:p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
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

      <div className="p-3 md:p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={initError ? "Bağlantı hatası var..." : "Sorunuzu yazın..."}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 disabled:bg-slate-100 text-sm md:text-base"
            disabled={isLoading || !!initError}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !!initError}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultant;