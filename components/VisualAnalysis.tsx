import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, Loader2, Camera } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeMedicalImage } from '../services/gemini';

const VisualAnalysis: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      // Extract base64 data part
      const base64Data = image.split(',')[1];
      const analysis = await analyzeMedicalImage(base64Data, prompt);
      setResult(analysis);
    } catch (error) {
      console.error(error);
      setResult("Analiz sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Camera className="text-purple-600" />
               Görsel Analiz
             </h2>
             
             {!image ? (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 flex flex-col items-center justify-center cursor-pointer transition-all group"
               >
                 <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="text-purple-600 w-8 h-8" />
                 </div>
                 <span className="text-slate-600 font-medium">Reçete veya Ürün Fotoğrafı Yükle</span>
                 <span className="text-slate-400 text-xs mt-2">JPG, PNG (Max 5MB)</span>
               </div>
             ) : (
               <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                 <img src={image} alt="Upload" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => { setImage(null); setResult(null); }}
                   className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-700 p-2 rounded-full backdrop-blur-sm transition-colors"
                 >
                   <X size={20} />
                 </button>
               </div>
             )}
             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {image && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Ek Soru (Opsiyonel)</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Örn: Bu reçetedeki ilaçların kullanım şekli nedir?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 transition-all flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Görseli Analiz Et
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 min-h-[400px]">
          <h3 className="font-semibold text-slate-800 mb-4 pb-4 border-b border-slate-100">Analiz Sonuçları</h3>
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
               <p>Görüntü işleniyor ve analiz ediliyor...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none prose-purple">
               <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
               <ImageIcon className="w-12 h-12 opacity-20" />
               <p className="text-center text-sm px-8">Sol taraftan bir görüntü yükleyip "Analiz Et" butonuna basın.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualAnalysis;