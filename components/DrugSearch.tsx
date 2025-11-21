import React, { useState } from 'react';
import { Search, Filter, Sparkles, Pill, Info } from 'lucide-react';
import { Product } from '../types';
import { GoogleGenAI } from '@google/genai';

interface Props {
  inventory: Product[];
}

const DrugSearch: React.FC<Props> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [aiMode, setAiMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>(inventory);
  const [isSearching, setIsSearching] = useState(false);

  // Extract unique categories
  const categories = ['Tümü', ...Array.from(new Set(inventory.map(p => p.category)))];

  const handleStandardSearch = (term: string, category: string) => {
    if (aiMode) return; // Don't filter locally if in AI mode until triggered

    let results = inventory;

    if (category !== 'Tümü') {
      results = results.filter(p => p.category === category);
    }

    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) || 
        p.description.toLowerCase().includes(lowerTerm) ||
        p.usage.toLowerCase().includes(lowerTerm)
      );
    }

    setSearchResults(results);
  };

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inventoryContext = JSON.stringify(inventory.map(p => ({ 
        id: p.id,
        name: p.name, 
        description: p.description,
        category: p.category 
      })));

      const prompt = `
        KULLANICI SORGUSU: "${searchTerm}"
        
        ENVANTER:
        ${inventoryContext}
        
        GÖREV:
        Kullanıcının sorgusuyla eşleşen ilaçların ID'lerini JSON listesi olarak döndür.
        Kullanıcı "ağrı kesici", "uyku yapmayan", "parasetamol içeren" gibi etken madde veya endikasyon araması yapabilir.
        Envanterdeki açıklama veya isimden bu özellikleri çıkarım yap.
        
        Sadece ID listesi döndür. Örn: ["prod-1", "prod-2"]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const matchingIds = JSON.parse(response.text || '[]');
      const results = inventory.filter(p => matchingIds.includes(p.id));
      setSearchResults(results);

    } catch (error) {
      console.error("AI Search error", error);
      // Fallback to standard search
      handleStandardSearch(searchTerm, filterCategory);
    } finally {
      setIsSearching(false);
    }
  };

  // Update results when inventory changes
  React.useEffect(() => {
    setSearchResults(inventory);
  }, [inventory]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
              <Search className="text-indigo-600" />
              İlaç Arama Motoru
            </h2>
            <p className="text-indigo-600/70 text-sm">İlaç adı, etken madde, endikasyon veya yan etkiye göre arayın.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-lg">
             <button 
               onClick={() => { setAiMode(false); setSearchResults(inventory); setSearchTerm(''); }}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!aiMode ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
             >
               Standart
             </button>
             <button 
               onClick={() => { setAiMode(true); setSearchResults([]); }}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${aiMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
             >
               <Sparkles size={14} /> AI Semantik
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!aiMode) handleStandardSearch(e.target.value, filterCategory);
              }}
              onKeyDown={(e) => e.key === 'Enter' && aiMode && handleAiSearch()}
              placeholder={aiMode ? 'Örn: "Mideye dokunmayan ağrı kesici" veya "İbuprofen içerenler"' : 'İlaç adı veya açıklama ara...'}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {!aiMode && (
            <div className="w-full md:w-48 relative">
               <select 
                 value={filterCategory}
                 onChange={(e) => {
                   setFilterCategory(e.target.value);
                   handleStandardSearch(searchTerm, e.target.value);
                 }}
                 className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none bg-white shadow-sm"
               >
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          )}

          {aiMode && (
            <button 
              onClick={handleAiSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition-all disabled:bg-slate-300 min-w-[120px]"
            >
              {isSearching ? 'Aranıyor...' : 'AI ile Bul'}
            </button>
          )}
        </div>
        
        {aiMode && (
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Info size={12} />
            AI Semantik arama, envanterinizde açıkça yazmasa bile etken madde ve yan etki bilgisini tahmin eder.
          </p>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map(product => (
          <div key={product.id} className="bg-white rounded-xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Pill size={20} />
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">{product.category}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{product.name}</h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
            <div className="pt-4 border-t border-slate-50 mt-auto">
              <div className="text-xs text-slate-500 font-medium uppercase mb-1">Kullanım</div>
              <div className="text-sm text-slate-700">{product.usage}</div>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Search className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Sonuç Bulunamadı</h3>
          <p className="text-slate-500 mt-1">Farklı bir arama terimi deneyin veya filtreleri temizleyin.</p>
        </div>
      )}
    </div>
  );
};

export default DrugSearch;