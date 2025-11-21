import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Radio, XCircle, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Helper to create PCM Blob for API
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helpers for audio decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveConsultant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Bağlantı Bekleniyor...');
  const [error, setError] = useState<string | null>(null);

  // Refs for Audio Contexts and Streams
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setError(null);
      setStatus("Başlatılıyor...");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Audio Setup
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current!.createGain();
      outputNode.connect(outputAudioContextRef.current!.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("Bağlandı - Konuşabilirsiniz");
            setIsActive(true);
            
            // Setup Input Stream
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
               const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
               const pcmBlob = createBlob(inputData);
               sessionPromise.then(session => {
                   session.sendRealtimeInput({ media: pcmBlob });
               });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setStatus("Bağlantı Kapandı");
            setIsActive(false);
          },
          onerror: (err) => {
            console.error(err);
            setError("Bağlantı hatası oluştu.");
            stopSession();
          }
        },
        config: {
           responseModalities: [Modality.AUDIO],
           systemInstruction: "Sen Türkçe konuşan yardımsever bir eczacı asistanısın. Kısa ve net cevaplar ver.",
           speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
           }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError("Mikrofon izni verilemedi veya API hatası.");
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    // Normally we would call session.close() if exposed, but wrapper handles callback onclose
    setIsActive(false);
    setStatus("Durduruldu");
  };

  useEffect(() => {
      return () => {
          stopSession();
      };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
       {/* Visualizer Background Effect (Simplified) */}
       <div className={`absolute inset-0 opacity-20 transition-all duration-1000 ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-transparent'}`}></div>
       
       <div className="z-10 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Canlı Asistan</h2>
            <p className="text-slate-400">{status}</p>
          </div>

          <div className="relative">
            {isActive ? (
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse">
                    <Radio size={48} className="text-white" />
                </div>
            ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center bg-slate-700 border-4 border-slate-600">
                    <MicOff size={48} className="text-slate-400" />
                </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            {!isActive ? (
                <button 
                  onClick={startSession}
                  className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 font-semibold text-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
                >
                    <Mic size={20} />
                    Konuşmayı Başlat
                </button>
            ) : (
                <button 
                  onClick={stopSession}
                  className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 font-semibold text-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-red-500/25"
                >
                    <XCircle size={20} />
                    Bitir
                </button>
            )}
          </div>
          
          {error && (
              <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-200 max-w-md mx-auto">
                  {error}
              </div>
          )}

          <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
             <Volume2 size={14} />
             <span>Gemini 2.5 Native Audio Live API</span>
          </div>
       </div>
    </div>
  );
};

export default LiveConsultant;