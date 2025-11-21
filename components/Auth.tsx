import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      login(email, name || email.split('@')[0]);
      navigate('/inventory');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-4">
            <HeartPulse className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">PharmaAI'ye Hoşgeldiniz</h2>
          <p className="text-slate-500 text-sm mt-2">
            {isLogin ? 'Hesabınıza giriş yapın' : 'Kişiselleştirilmiş öneriler için hesap oluşturun'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İsim Soyisim</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="Adınız"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta Adresi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="ornek@email.com"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;