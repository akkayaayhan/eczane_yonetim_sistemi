import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Trash2, Plus, Edit, Save, X, Search } from 'lucide-react';
import { Product } from '../types';

interface Props {
  inventory: Product[];
  setInventory: (products: Product[]) => void;
}

const InventoryManager: React.FC<Props> = ({ inventory, setInventory }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: '', description: '', stock: 0, usage: ''
  });

  // Helper to parse CSV (Simulating Excel for browser environment simplicity)
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    
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

  // CRUD Operations
  const handleDelete = (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      setInventory(inventory.filter(p => p.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: '', description: '', stock: 0, usage: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Update existing
      const updatedInventory = inventory.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } as Product : p
      );
      setInventory(updatedInventory);
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name || 'Yeni Ürün',
        category: formData.category || 'Genel',
        description: formData.description || '',
        stock: Number(formData.stock) || 0,
        usage: formData.usage || ''
      };
      setInventory([...inventory, newProduct]);
    }
    setIsModalOpen(false);
  };

  // Filtered List
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Eczane Envanter Yönetimi</h2>
          <p className="text-sm text-slate-500">Stok takibi, ürün ekleme ve düzenleme.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
        >
          <Plus size={20} /> Yeni Ürün Ekle
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          className={`border-2 border-dashed rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-white'}`}
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
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
             <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">Toplu Yükle (Excel/CSV)</h3>
            <p className="text-xs text-slate-500">Dosyayı sürükleyin veya tıklayın</p>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
        </div>

        <div 
          onClick={addDemoData}
          className="border border-slate-200 rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-green-400 hover:bg-green-50 bg-white transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
             <Save size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">Demo Verisi Yükle</h3>
            <p className="text-xs text-slate-500">Test için örnek ilaçlar ekle</p>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-64">
             <input 
               type="text" 
               placeholder="Ürün Ara..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none text-sm"
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          
          <div className="flex items-center gap-4">
             <span className="text-sm text-slate-500 font-medium">Toplam: {inventory.length} Ürün</span>
             {inventory.length > 0 && (
              <button 
                onClick={() => { if(window.confirm('Tüm envanter silinecek?')) setInventory([]) }}
                className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wide"
              >
                Tümünü Temizle
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap md:whitespace-normal">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4 w-1/4">Ürün Adı</th>
                <th className="p-4 w-1/6">Kategori</th>
                <th className="p-4 w-1/3 hidden md:table-cell">Kullanım</th>
                <th className="p-4 w-1/12 text-center">Stok</th>
                <th className="p-4 w-1/12 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 font-medium text-slate-900">{item.name}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{item.category}</span></td>
                  <td className="p-4 hidden md:table-cell truncate max-w-xs text-slate-500">{item.usage}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded font-bold text-xs ${item.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <Search size={32} className="opacity-20" />
                       <p>Ürün bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Ürün Adı</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  placeholder="İlaç adı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Kategori</label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Örn: Ağrı Kesici"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Stok Adedi</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Açıklama</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none h-20 resize-none"
                  placeholder="İlaç hakkında kısa bilgi..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Kullanım Şekli</label>
                <input 
                  type="text" 
                  value={formData.usage}
                  onChange={e => setFormData({...formData, usage: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  placeholder="Örn: Günde 2 kez tok karna"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium shadow-lg shadow-emerald-200 transition-colors flex justify-center items-center gap-2"
                >
                  <Save size={18} /> {editingProduct ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;