import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Trash2, Plus } from 'lucide-react';
import { Product } from '../types';

interface Props {
  inventory: Product[];
  setInventory: (products: Product[]) => void;
}

const InventoryManager: React.FC<Props> = ({ inventory, setInventory }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to parse CSV (Simulating Excel for browser environment simplicity)
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    
    const newProducts: Product[] = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        id: `prod-${Date.now()}-${index}`,
        name: values[0]?.trim() || 'Bilinmeyen Ürün',
        category: values[1]?.trim() || 'Genel',
        description: values[2]?.trim() || '',
        stock: parseInt(values[3]?.trim()) || 0,
        usage: values[4]?.trim() || 'Belirtilmemiş'
      };
    });
    setInventory([...inventory, ...newProducts]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const addDemoData = () => {
    const demo: Product[] = [
      { id: '1', name: 'Parol 500mg', category: 'Ağrı Kesici', description: 'Hafif ve orta şiddetli ağrılar', stock: 100, usage: 'Günde 3-4 defa tok karna' },
      { id: '2', name: 'Majezik Sprey', category: 'Boğaz', description: 'Boğaz ağrısı ve iltihabı', stock: 45, usage: 'Günde 3 defa boğaza sıkılır' },
      { id: '3', name: 'Bepanthol Krem', category: 'Cilt Bakımı', description: 'Kuru ve tahriş olmuş ciltler', stock: 20, usage: 'İhtiyaç duyuldukça uygulanır' },
      { id: '4', name: 'Tylolhot Paket', category: 'Grip/Soğuk Algınlığı', description: 'Grip belirtilerini hafifletir', stock: 200, usage: 'Sıcak suda eritilerek içilir' },
    ];
    setInventory([...inventory, ...demo]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Eczane Envanter Yönetimi</h2>
        <p className="text-slate-600">Ürünlerinizi yükleyin (.csv) veya demo verisi ekleyin. Bu veriler yapay zeka önerilerinde kullanılacaktır.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (evt) => parseCSV(evt.target?.result as string);
                reader.readAsText(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="font-semibold text-lg text-slate-700">Excel/CSV Dosyası Yükle</h3>
          <p className="text-sm text-slate-500 mt-2">Dosyayı sürükleyin veya tıklayın</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.txt"
            onChange={handleFileUpload}
          />
        </div>

        {/* Demo Data Button */}
        <div 
          onClick={addDemoData}
          className="border-2 border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
        >
          <Plus className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="font-semibold text-lg text-slate-700">Demo Verisi Yükle</h3>
          <p className="text-sm text-slate-500 mt-2">Sistemi test etmek için örnek ilaçlar ekle</p>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Yüklü Ürünler ({inventory.length})</h3>
          {inventory.length > 0 && (
            <button 
              onClick={() => setInventory([])}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
            >
              <Trash2 size={16} /> Temizle
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold">
              <tr>
                <th className="p-4">Ürün Adı</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Kullanım</th>
                <th className="p-4 text-right">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{item.name}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">{item.category}</span></td>
                  <td className="p-4 truncate max-w-xs">{item.usage}</td>
                  <td className="p-4 text-right">{item.stock}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Henüz ürün yüklenmedi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;