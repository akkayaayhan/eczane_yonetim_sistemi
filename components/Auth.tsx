
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, ArrowRight, ShieldCheck, User, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'patient' | 'pharmacist'>('patient');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localLoading, setLocalLoading] = useState(false); // UI loading state to prevent flicker
  
  const { login, register, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Tab değişince form ve hataları temizle
  useEffect(() => {
    clearError();
    setEmail('');
    setPassword('');
    setName('');
    // Eczacı girişine geçerken register modunu kapat
    if (activeTab === 'pharmacist') {
        setIsRegistering(false);
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    
    try {
      if (isRegistering) {
        if (password.length < 6) {
            throw new Error("Şifre en az 6 karakter olmalıdır.");
        }
        await register(email, password, name, activeTab);
      } else {
        await login(email, password);
      }
      
      // Yönlendirme
      if (activeTab === 'pharmacist') {
        navigate('/inventory');
      } else {
        navigate('/recommend');
      }
    } catch (err) {
      console.error(err);
      // Hata Context'te set ediliyor, UI'da gösterilecek
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-fade-in">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
           <button 
             onClick={() => { setActiveTab('patient'); setIsRegistering(false); }}
             className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'patient' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
           >
             <User size={18} /> Hasta Girişi
           </button>
           <button 
             onClick={() => { setActiveTab('pharmacist'); setIsRegistering(false); }}
             className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'pharmacist' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
           >
             <ShieldCheck size={18} /> Eczacı Girişi
           </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 transition-all duration-300 ${activeTab === 'patient' ? 'bg-blue-600 shadow-blue-200 rotate-0' : 'bg-emerald-600 shadow-emerald-200 rotate-12'}`}>
              <HeartPulse className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
               {activeTab === 'patient' ? 'PharmaAI Asistan' : 'Eczane Yönetimi'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {isRegistering 
                ? (activeTab === 'patient' ? 'Sağlık geçmişinizi takip etmek için kayıt olun' : 'Yeni personel kaydı')
                : (activeTab === 'patient' ? 'Hesabınıza giriş yaparak devam edin' : 'Yetkili personel girişi')
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-pulse">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="animate-fade-in-up">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">İsim Soyisim</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                {activeTab === 'pharmacist' ? 'Kullanıcı Adı' : 'E-posta Adresi'}
              </label>
              <input
                type={activeTab === 'pharmacist' ? "text" : "email"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all ${activeTab === 'patient' ? 'focus:border-blue-500 focus:ring-blue-100' : 'focus:border-emerald-500 focus:ring-emerald-100'}`}
                placeholder={activeTab === 'pharmacist' ? "Kullanıcı adınız" : "ornek@email.com"}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Şifre</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none transition-all ${activeTab === 'patient' ? 'focus:border-blue-500 focus:ring-blue-100' : 'focus:border-emerald-500 focus:ring-emerald-100'}`}
                  placeholder="••••••"
                  minLength={4}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
              {isRegistering && <p className="text-[10px] text-slate-400 mt-1 ml-1">En az 6 karakter</p>}
            </div>

            <button
              type="submit"
              disabled={localLoading}
              className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] ${activeTab === 'patient' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {localLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              {activeTab === 'patient' && (
                  <>
                      {isRegistering ? "Zaten hesabınız var mı?" : "Hesabınız yok mu?"}{" "}
                      <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="font-bold hover:underline text-blue-600"
                      >
                        {isRegistering ? "Giriş Yapın" : "Kayıt Olun"}
                      </button>
                  </>
              )}
              {activeTab === 'pharmacist' && !isRegistering && (
                  <span className="text-xs text-slate-400">
                      Personel hesabı oluşturmak için yetkili bir Eczacı ile iletişime geçin.
                  </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
