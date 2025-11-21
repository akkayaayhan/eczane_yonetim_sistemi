import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Product, User } from "../types";

// Güvenli API Anahtarı Erişimi
const getAPIKey = () => {
  // 1. Vercel/Node ortamı kontrolü
  if (process.env.API_KEY) return process.env.API_KEY;
  
  // 2. Vite ortamı kontrolü (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  
  // 3. Global tanımlama kontrolü (fallback)
  if ((window as any).API_KEY) return (window as any).API_KEY;

  console.warn("API Anahtarı bulunamadı! Lütfen Vercel ayarlarından API_KEY veya VITE_API_KEY ekleyin.");
  return ''; 
};

const getAI = () => new GoogleGenAI({ apiKey: getAPIKey() });

/**
 * Generates a drug recommendation based on inventory and complaint.
 */
export const getRecommendation = async (
  complaint: string,
  inventory: Product[],
  userProfile?: User | null
): Promise<string> => {
  const ai = getAI();
  const inventoryContext = JSON.stringify(inventory.map(p => ({ 
    name: p.name, 
    category: p.category, 
    description: p.description, 
    usage: p.usage 
  })));

  let userContext = "";
  if (userProfile) {
    userContext = `
    HASTA PROFİLİ:
    - Yaş: ${userProfile.age || 'Bilinmiyor'}
    - Cinsiyet: ${userProfile.gender || 'Bilinmiyor'}
    - Bilinen Alerjiler/Durumlar: ${userProfile.allergies || 'Yok'}
    
    ÖNEMLİ: Eğer hastanın alerjisi veya yaşı bu ilaç için risk oluşturuyorsa kesinlikle uyar.
    `;
  }

  const prompt = `
    Sen uzman bir eczacı asistanısın. 
    
    MEVCUT ENVANTER (Sadece bu ürünleri önerebilirsin):
    ${inventoryContext}
    ${userContext}

    HASTA ŞİKAYETİ:
    "${complaint}"

    GÖREV:
    Mevcut envanterden hastanın şikayetine ve (varsa) profiline en uygun ilacı/ürünü seç. 
    Eğer uygun ürün yoksa dürüstçe belirt.
    
    Çıktı formatı (Markdown):
    **Önerilen Ürün:** [Ürün Adı]
    **Neden:** [Kısa açıklama, profil uyumluluğu dahil]
    **Kullanım Şekli:** [Envanterdeki veya genel kullanım bilgisi]
    **Uyarılar:** [Varsa önemli uyarılar, özellikle hasta profiliyle ilgili]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using advanced model for reasoning
    contents: prompt,
  });

  return response.text || "Bir öneri oluşturulamadı.";
};

/**
 * Chat with the AI using the inventory context.
 */
export const createPharmacyChat = (inventory: Product[]) => {
  const ai = getAI();
  const systemInstruction = `
    Sen PharmaAI, eczane asistanısın. Türkçe konuşuyorsun.
    Aşağıdaki envantere erişimin var. Sorulara bu envanter ışığında cevap ver.
    Envanter: ${JSON.stringify(inventory.map(p => p.name).join(", "))}
  `;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

/**
 * Analyzes an uploaded medical image (prescription, skin issue, etc.).
 */
export const analyzeMedicalImage = async (base64Data: string, promptText: string): Promise<string> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Supports high quality image analysis
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: promptText || "Bu görüntüyü bir eczacı bakış açısıyla analiz et. Eğer bir reçete ise ilaçları listele. Eğer bir cilt sorunu ise olası durumu ve genel önerileri (tıbbi tavsiye olmadığını belirterek) söyle."
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
    model: 'gemini-2.5-flash', // Fast model for transcription
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: "Lütfen bu ses kaydını kelimesi kelimesine Türkçe'ye çevir (transcribe et)."
        }
      ]
    }
  });

  return response.text || "Ses çözümlenemedi.";
};