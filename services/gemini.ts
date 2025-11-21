import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Product, User } from "../types";

// Güvenli API Anahtarı Erişimi - Tüm olası değişkenleri dener
const getAPIKey = () => {
  // 1. Standart process.env
  if (process.env.API_KEY) return process.env.API_KEY;
  if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
  if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
  
  // 2. Vite ortamı kontrolü (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    // @ts-ignore
    if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
  }
  
  // 3. Global tanımlama kontrolü (fallback)
  if ((window as any).API_KEY) return (window as any).API_KEY;

  return ''; 
};

const getAI = () => {
  const key = getAPIKey();
  if (!key) {
    throw new Error("API Anahtarı bulunamadı. Lütfen Vercel ayarlarından API_KEY veya VITE_API_KEY ekleyin.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates a drug recommendation based on inventory and complaint.
 */
export const getRecommendation = async (
  complaint: string,
  inventory: Product[],
  userProfile?: User | null
): Promise<string> => {
  try {
    const ai = getAI();
    // Envanteri optimize et (Sadece gerekli alanlar ve limitli sayıda)
    const inventoryContext = JSON.stringify(inventory.slice(0, 80).map(p => ({ 
      name: p.name, 
      cat: p.category, 
      desc: p.description, 
      use: p.usage 
    })));

    let userContext = "";
    if (userProfile) {
      userContext = `
      HASTA: ${userProfile.age || '?'} yaş, ${userProfile.gender || '?'}.
      ALERJİ: ${userProfile.allergies || 'Yok'}
      `;
    }

    const prompt = `
      Rol: Eczacı Asistanı.
      Envanter: ${inventoryContext}
      Hasta Profili: ${userContext}
      Şikayet: "${complaint}"

      Görev: Envanterden en uygun ürünü seç. Yoksa "Stokta uygun ürün yok" de.
      Format: Markdown.
      **Önerilen:** [Ürün]
      **Neden:** [Kısa açıklama]
      **Kullanım:** [Talimat]
      **Uyarı:** [Varsa]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
    });

    return response.text || "Bir öneri oluşturulamadı.";
  } catch (error: any) {
    console.error("Recommendation Error:", error);
    return `Hata oluştu: ${error.message || 'Bilinmeyen hata'}`;
  }
};

/**
 * Chat with the AI using the inventory context.
 */
export const createPharmacyChat = (inventory: Product[]) => {
  const ai = getAI();
  
  // OPTIMIZATION: Büyük envanterler hataya neden olur. Veriyi küçültüyoruz.
  // Sadece ilk 50 ürünü detaylı al, geri kalanını alırsak token limiti dolabilir.
  const inventorySummary = inventory.slice(0, 60).map(p => 
    `- ${p.name} (${p.category}): ${p.usage}`
  ).join("\n");

  const systemInstruction = `
    Sen PharmaAI, profesyonel ve yardımsever bir eczacı asistanısın.
    
    GÖREVLERİN:
    1. Kullanıcının sağlık sorunlarını dinle.
    2. Aşağıdaki "MEVCUT STOK LİSTESİ" içinden uygun ilaç varsa öner.
    3. Eğer stokta yoksa, genel tıbbi tavsiye ver ama "Stoklarımızda bulunmamaktadır" diye belirt.
    4. Her zaman "Bu bir tıbbi tavsiye değildir, doktora danışın" uyarısını yap.
    5. Türkçe konuş. Kısa, net ve anlaşılır cevaplar ver.

    MEVCUT STOK LİSTESİ (Sadece bunları öner):
    ${inventorySummary || "Şu an envanter boş."}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7, // Daha tutarlı cevaplar için
    },
  });
};

/**
 * Analyzes an uploaded medical image.
 */
export const analyzeMedicalImage = async (base64Data: string, promptText: string): Promise<string> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: promptText || "Bu tıbbi görüntüyü/reçeteyi analiz et. İlaçları veya durumu açıkla."
        }
      ]
    }
  });

  return response.text || "Görüntü analiz edilemedi.";
};

/**
 * Transcribes audio to text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: "Bu ses kaydını Türkçe metne çevir. Sadece konuşulanları yaz."
        }
      ]
    }
  });

  return response.text || "Ses çözümlenemedi.";
};