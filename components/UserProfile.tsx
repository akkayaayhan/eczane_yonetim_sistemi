import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, History, Save, LogOut, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const UserProfile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || 'Diğer');
  const [allergies, setAllergies] = useState(user?.allergies || '');

  if (!user) return null;

  const handleSave = () => {
    updateProfile({
      age: Number(age),
      gender: gender as any,
      allergies
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-600" />
            Kullanıcı Profili
          </h2>
          <button onClick={logout} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{user.name}</h3>
              <p className="text-slate-500">{user.email}</p>
            </div>
            <button 
               onClick={() => isEditing ? handleSave() : setIsEditing(true)}
               className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
               {isEditing ? <><Save size={16} /> Kaydet</> : 'Düzenle'}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Yaş</label>
              {isEditing ? (
                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full p-2 border rounded-lg" />
              ) : (
                <div className="text-slate-800 font-medium">{user.age || 'Belirtilmemiş'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Cinsiyet</label>
              {isEditing ? (
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 border rounded-lg">
                   <option value="Erkek">Erkek</option>
                   <option value="Kadın">Kadın</option>
                   <option value="Diğer">Diğer</option>
                </select>
              ) : (
                <div className="text-slate-800 font-medium">{user.gender || 'Belirtilmemiş'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Alerjiler / Kronik Durumlar</label>
              {isEditing ? (
                <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Penisilin vb." />
              ) : (
                <div className="text-slate-800 font-medium">{user.allergies || 'Yok'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100">
        <div className="p-6 border-b border-slate-200">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Clock className="text-orange-500" />
             Geçmiş Öneriler
           </h2>
        </div>
        <div className="divide-y divide-slate-100">
           {user.history.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Henüz bir öneri geçmişiniz bulunmuyor.
              </div>
           ) : (
             user.history.map((record) => (
               <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-slate-500">{new Date(record.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">Şikayet</span>
                    <p className="mt-1 text-slate-800">{record.complaint}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                     <ReactMarkdown>{record.recommendation}</ReactMarkdown>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;