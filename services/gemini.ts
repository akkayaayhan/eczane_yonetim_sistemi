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
    throw new Error("API Anahtarı bulunamadı. Lütfen Vercel ayarlarından API_KEY ekleyin.");
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
    // Envanteri optimize et (Sadece gerekli alanlar)
    const inventoryContext = JSON.stringify(inventory.slice(0, 100).map(p => ({ 
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
      model: 'gemini-2.5-flash', // Flash is faster and sufficient
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
  
  // Token limitini aşmamak için envanteri özetle (Maksimum 50 ürün detaylı, gerisi liste)
  const inventorySummary = inventory.slice(0, 50).map(p => 
    `${p.name} (${p.category}): ${p.description} - Kullanım: ${p.usage}`
  ).join("\n");

  const systemInstruction = `
    Sen PharmaAI, yardımsever bir eczacı asistanısın.
    
    KURALLAR:
    1. Sadece Türkçe konuş.
    2. Kullanıcı bir sağlık sorunu belirttiğinde ÖNCELİKLE aşağıdaki envanter listesinden ürün öner.
    3. Envanterde olmayan bir şey sorsalar bile genel tıbbi bilgi ver ama "Doktora danışın" uyarısını ekle.
    4. Kısa ve net cevaplar ver.
    
    MEVCUT ENVANTER:
    ${inventorySummary || "Envanter şu an boş."}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

/**
 * Analyzes an uploaded medical image.
 */
export const analyzeMedicalImage = async (base64Data: string, promptText: string): Promise<string> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // 2.5 Flash supports vision and is stable
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
          text: "Bu ses kaydını Türkçe metne çevir."
        }
      ]
    }
  });

  return response.text || "Ses çözümlenemedi.";
};
