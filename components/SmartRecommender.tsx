import React, { useState } from 'react';
import { Activity, Sparkles, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product } from '../types';
import { getRecommendation } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  inventory: Product[];
}

const SmartRecommender: React.FC<Props> = ({ inventory }) => {
  const [complaint, setComplaint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { user, addToHistory } = useAuth();

  const handleRecommend = async () => {
    if (!complaint.trim() || inventory.length === 0) return;

    setLoading(true);
    setResult(null);
    try {
      // Pass user profile to AI
      const response = await getRecommendation(complaint, inventory, user);
      setResult(response);

      // Save to history if user is logged in
      if (user) {
        addToHistory({
          id: Date.now().toString(),
          date: Date.now(),
          complaint: complaint,
          recommendation: response
        });
      }
    } catch (error) {
      console.error(error);
      setResult("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Akıllı İlaç Asistanı</h2>
            <p className="text-slate-500 text-sm">Hasta şikayetini girin, stoktan en uygun ürünü bulalım.</p>
          </div>
        </div>

        {user && (
           <div className="mb-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex gap-2 items-center">
             <span className="font-bold">Aktif Profil:</span> {user.name} ({user.age ? `${user.age} yaş` : 'Yaş girilmedi'})
             {user.allergies && <span className="ml-auto text-red-600 font-semibold flex items-center gap-1 text-xs border border-red-200 bg-red-50 px-2 py-1 rounded">⚠️ Alerji Kaydı Mevcut</span>}
           </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Hasta Şikayeti / Belirtiler</label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Örn: Hastanın başı ağrıyor ve hafif ateşi var..."
            className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all min-h-[120px] resize-none"
          />
        </div>

        <button
          onClick={handleRecommend}
          disabled={loading || inventory.length === 0 || !complaint.trim()}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Analiz Ediliyor...
            </>
          ) : (
            <>
              <Sparkles size={20} /> Tavsiye Oluştur
            </>
          )}
        </button>
        
        {inventory.length === 0 && (
           <p className="text-center text-red-500 text-sm mt-3">Lütfen önce "Ürünler" sekmesinden envanter yükleyin.</p>
        )}

        {result && (
          <div className="mt-8 animate-fade-in">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Gemini Analiz Sonucu</h3>
              <div className="prose prose-blue prose-sm max-w-none text-slate-700">
                 <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRecommender;