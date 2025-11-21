import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, MessageSquare, Radio, Camera, Mic, HeartPulse, User, Search, LogIn } from 'lucide-react';
import InventoryManager from './components/InventoryManager';
import SmartRecommender from './components/SmartRecommender';
import ChatConsultant from './components/ChatConsultant';
import LiveConsultant from './components/LiveConsultant';
import VisualAnalysis from './components/VisualAnalysis';
import AudioTranscriber from './components/AudioTranscriber';
import UserProfile from './components/UserProfile';
import Auth from './components/Auth';
import DrugSearch from './components/DrugSearch';
import { Product } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = ({ inventoryCount }: { inventoryCount: number }) => {
  const { user } = useAuth();

  return (
    <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <HeartPulse className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">PharmaAI</h1>
            <p className="text-xs text-slate-500">Akıllı Eczane Asistanı</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2">
          <div className="text-xs font-semibold text-slate-400 px-4 mb-2 mt-2">ECZANE</div>
          <NavItem to="/inventory" icon={Package} label="Ürünler & Envanter" />
          <NavItem to="/search" icon={Search} label="İlaç Arama" />
          
          <div className="text-xs font-semibold text-slate-400 px-4 mb-2 mt-6">ASİSTAN</div>
          <NavItem to="/recommend" icon={LayoutDashboard} label="Akıllı Öneri" />
          <NavItem to="/chat" icon={MessageSquare} label="AI Sohbet" />
          <NavItem to="/live" icon={Radio} label="Canlı Asistan" />
          <NavItem to="/vision" icon={Camera} label="Görsel Analiz" />
          <NavItem to="/transcribe" icon={Mic} label="Ses Çözümleme" />
          
          <div className="text-xs font-semibold text-slate-400 px-4 mb-2 mt-6">HESAP</div>
          {user ? (
            <NavItem to="/profile" icon={User} label="Profilim" />
          ) : (
            <NavItem to="/auth" icon={LogIn} label="Giriş Yap / Kayıt Ol" />
          )}
        </nav>

        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-2 font-medium">ENVANTER DURUMU</div>
          <div className="text-2xl font-bold text-slate-800">{inventoryCount} <span className="text-sm font-normal text-slate-400">Ürün</span></div>
        </div>
      </aside>
  );
};

const AppContent = () => {
  // Global State for Inventory
  const [inventory, setInventory] = useState<Product[]>([]);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar inventoryCount={inventory.length} />

      {/* Mobile Bottom Nav (Simplified) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around p-3">
         <Link to="/recommend" className="p-2 text-slate-600"><LayoutDashboard size={24}/></Link>
         <Link to="/search" className="p-2 text-slate-600"><Search size={24}/></Link>
         <Link to="/live" className="p-2 text-blue-600 bg-blue-50 rounded-full"><Radio size={24}/></Link>
         <Link to={user ? "/profile" : "/auth"} className="p-2 text-slate-600"><User size={24}/></Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {/* Header for Mobile/Desktop */}
        <div className="flex justify-end mb-4 md:hidden">
           <span className="text-sm font-bold text-blue-900">PharmaAI</span>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="/inventory" element={<InventoryManager inventory={inventory} setInventory={setInventory} />} />
          <Route path="/search" element={<DrugSearch inventory={inventory} />} />
          <Route path="/recommend" element={<SmartRecommender inventory={inventory} />} />
          <Route path="/chat" element={<ChatConsultant inventory={inventory} />} />
          <Route path="/live" element={<LiveConsultant />} />
          <Route path="/vision" element={<VisualAnalysis />} />
          <Route path="/transcribe" element={<AudioTranscriber />} />
          
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/profile" />} />
          <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/auth" />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;