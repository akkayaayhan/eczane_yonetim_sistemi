import React, { useState, useRef } from 'react';
import { Mic, FileAudio, Upload, Loader2, AlignLeft } from 'lucide-react';
import { transcribeAudio } from '../services/gemini';

const AudioTranscriber: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult('');
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        const mimeType = file.type;
        
        const text = await transcribeAudio(base64String, mimeType);
        setResult(text);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setResult("Çeviri sırasında hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
        <div className="bg-orange-50 p-6 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
            <Mic className="text-orange-600" />
            Ses Kaydı Çözümleme (Transcription)
          </h2>
          <p className="text-orange-700/70 text-sm mt-1">Hasta şikayetlerini içeren ses kayıtlarını metne dökün.</p>
        </div>

        <div className="p-8 space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50 rounded-xl p-8 cursor-pointer transition-all flex flex-col items-center"
          >
             <FileAudio className="w-12 h-12 text-slate-400 mb-3" />
             <span className="font-medium text-slate-600">{file ? file.name : 'Ses Dosyası Seç (MP3, WAV)'}</span>
             <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
          </div>

          <button
            onClick={handleTranscribe}
            disabled={!file || loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <AlignLeft />}
            Metne Çevir
          </button>

          {result && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Çözümleme Sonucu</h3>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioTranscriber;