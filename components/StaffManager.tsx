
import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldCheck, User, Trash2, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { User as UserType } from '../types';

const StaffManager: React.FC = () => {
  const { createStaff, user } = useAuth();
  const [staffList, setStaffList] = useState<UserType[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // Form States
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoadingList(true);
    try {
      // authService içinde getStaffList simülasyonu
      const list = await authService.getStaffList();
      setStaffList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createStaff(newUsername, newPassword, newName);
      setSuccessMsg('Personel başarıyla oluşturuldu!');
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      loadStaff(); // Listeyi yenile
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Staff Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                 <UserPlus className="text-emerald-600" size={20} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800">Yeni Personel Ekle</h2>
                 <p className="text-sm text-slate-500">Eczane çalışanları için hesap oluşturun.</p>
               </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Ad Soyad</label>
                 <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Örn: Ahmet Yılmaz"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Kullanıcı Adı</label>
                 <input 
                    type="text" 
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Örn: ahmetyilmaz"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Geçici Şifre</label>
                 <input 
                    type="text" 
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-mono"
                    placeholder="123456"
                    minLength={4}
                 />
               </div>

               {errorMsg && <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-100">{errorMsg}</div>}
               {successMsg && <div className="text-green-600 text-sm p-2 bg-green-50 rounded border border-green-100 flex items-center gap-2"><CheckCircle size={14}/> {successMsg}</div>}

               <button
                 type="submit"
                 disabled={isCreating}
                 className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
               >
                 {isCreating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Hesabı Oluştur</>}
               </button>
            </form>
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 min-h-[400px]">
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
               <span>Mevcut Personel Listesi</span>
               <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">{staffList.length}</span>
            </h3>

            {loadingList ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" size={30}/></div>
            ) : (
                <div className="space-y-3">
                   {staffList.map((staff) => (
                       <div key={staff.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                {staff.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <div className="font-semibold text-slate-800">{staff.name}</div>
                                <div className="text-xs text-slate-500 font-mono">@{staff.email}</div>
                             </div>
                          </div>
                          <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">
                             Eczacı
                          </div>
                       </div>
                   ))}
                   
                   {staffList.length === 0 && (
                       <p className="text-slate-400 text-center text-sm py-8">Henüz eklenmiş personel yok.</p>
                   )}
                </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
               <p><strong>Bilgi:</strong> Oluşturulan personel hesapları ile giriş yapılırken kullanıcı adı ve belirlenen şifre kullanılacaktır. Tüm personel envanter yönetimi yetkisine sahiptir.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManager;
