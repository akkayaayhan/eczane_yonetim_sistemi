
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, MessageSquare, Radio, Camera, Mic, HeartPulse, User, Search, LogIn, Menu, X, ShieldCheck, Users } from 'lucide-react';
import InventoryManager from './components/InventoryManager';
import SmartRecommender from './components/SmartRecommender';
import ChatConsultant from './components/ChatConsultant';
import LiveConsultant from './components/LiveConsultant';
import VisualAnalysis from './components/VisualAnalysis';
import AudioTranscriber from './components/AudioTranscriber';
import UserProfile from './components/UserProfile';
import Auth from './components/Auth';
import DrugSearch from './components/DrugSearch';
import StaffManager from './components/StaffManager';
import { Product } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  onClick?: () => void;
}

const NavItem = ({ to, icon: Icon, label, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = ({ inventoryCount, isOpen, onClose }: { inventoryCount: number, isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();

  // Base classes for sidebar
  const baseClasses = "bg-white border-r border-slate-200 flex flex-col p-6 h-full z-40 transition-transform duration-300 ease-in-out";
  // Mobile specific: fixed position, slide in/out
  const mobileClasses = `fixed inset-y-0 left-0 w-72 shadow-2xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:shadow-none`;

  const isPharmacist = user?.role === 'pharmacist';

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`${baseClasses} ${mobileClasses}`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isPharmacist ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'}`}>
              {isPharmacist ? <ShieldCheck className="text-white" /> : <HeartPulse className="text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">PharmaAI</h1>
              <p className="text-xs text-slate-500">
                 {isPharmacist ? 'Yönetim Paneli' : 'Kişisel Asistan'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* ECZACI MENÜSÜ */}
          {isPharmacist && (
            <>
              <div className="text-xs font-semibold text-emerald-600 px-4 mb-2 mt-2 bg-emerald-50 py-1 rounded">YÖNETİM</div>
              <NavItem to="/inventory" icon={Package} label="Envanter Yönetimi" onClick={onClose} />
              <NavItem to="/search" icon={Search} label="İlaç Veritabanı" onClick={onClose} />
              <NavItem to="/staff" icon={Users} label="Personel Yönetimi" onClick={onClose} />
              <div className="my-4 border-t border-slate-100"></div>
            </>
          )}

          {/* ORTAK / HASTA MENÜSÜ */}
          <div className="text-xs font-semibold text-slate-400 px-4 mb-2 mt-2">ASİSTAN</div>
          <NavItem to="/recommend" icon={LayoutDashboard} label="Akıllı Öneri" onClick={onClose} />
          <NavItem to="/chat" icon={MessageSquare} label="AI Sohbet" onClick={onClose} />
          <NavItem to="/live" icon={Radio} label="Canlı Asistan" onClick={onClose} />
          <NavItem to="/vision" icon={Camera} label="Görsel Analiz" onClick={onClose} />
          <NavItem to="/transcribe" icon={Mic} label="Ses Çözümleme" onClick={onClose} />
          
          <div className="text-xs font-semibold text-slate-400 px-4 mb-2 mt-6">HESAP</div>
          {user ? (
            <NavItem to="/profile" icon={User} label="Profilim" onClick={onClose} />
          ) : (
            <NavItem to="/auth" icon={LogIn} label="Giriş Yap / Kayıt Ol" onClick={onClose} />
          )}
        </nav>
        
        {isPharmacist && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-xs text-emerald-700 mb-2 font-medium">ENVANTER DURUMU</div>
            <div className="text-2xl font-bold text-slate-800">{inventoryCount} <span className="text-sm font-normal text-slate-400">Ürün</span></div>
          </div>
        )}
      </aside>
    </>
  );
};

// Protected Route Wrappers
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
    const { user } = useAuth();
    
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If patient tries to access pharmacist page, redirect to safe page
        return <Navigate to="/recommend" replace />;
    }

    return <>{children}</>;
};

const AppContent = () => {
  // Global State for Inventory
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/inventory': return 'Envanter Yönetimi';
      case '/staff': return 'Personel Yönetimi';
      case '/search': return 'İlaç Arama';
      case '/recommend': return 'Akıllı Öneri';
      case '/chat': return 'AI Sohbet';
      case '/live': return 'Canlı Asistan';
      case '/vision': return 'Görsel Analiz';
      case '/transcribe': return 'Ses Çözümleme';
      case '/profile': return 'Profil';
      case '/auth': return 'Giriş';
      default: return 'PharmaAI';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar is always visible on desktop, conditional on mobile */}
      <Sidebar 
        inventoryCount={inventory.length} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pb-24 md:pb-8 overflow-x-hidden w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 md:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-20">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
             >
               <Menu size={24} />
             </button>
             <span className="font-bold text-slate-800 text-lg">{getPageTitle()}</span>
           </div>
           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user?.role === 'pharmacist' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
             {user ? user.name.charAt(0).toUpperCase() : <User size={16} />}
           </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to={user.role === 'pharmacist' ? '/inventory' : '/profile'} />} />
            
            {/* Protected: Pharmacist Only */}
            <Route path="/inventory" element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                    <InventoryManager inventory={inventory} setInventory={setInventory} />
                </ProtectedRoute>
            } />

            <Route path="/staff" element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                    <StaffManager />
                </ProtectedRoute>
            } />
            
            {/* Protected: Both (Or Pharmacist mainly, but readable by user if needed - decided to keep search open for all but better for pharmacist) */}
            <Route path="/search" element={
                <ProtectedRoute allowedRoles={['pharmacist', 'patient']}>
                    <DrugSearch inventory={inventory} />
                </ProtectedRoute>
            } />

            {/* Protected: All Logged In Users */}
            <Route path="/" element={<Navigate to={user ? '/recommend' : '/auth'} replace />} />
            <Route path="/recommend" element={<ProtectedRoute><SmartRecommender inventory={inventory} /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatConsultant inventory={inventory} /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LiveConsultant /></ProtectedRoute>} />
            <Route path="/vision" element={<ProtectedRoute><VisualAnalysis /></ProtectedRoute>} />
            <Route path="/transcribe" element={<ProtectedRoute><AudioTranscriber /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex justify-around p-2 pb-safe">
           <Link to="/recommend" className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/recommend' ? 'text-blue-600' : 'text-slate-400'}`}>
              <LayoutDashboard size={20}/>
              <span className="text-[10px] font-medium">Öneri</span>
           </Link>
           <Link to="/chat" className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/chat' ? 'text-blue-600' : 'text-slate-400'}`}>
              <MessageSquare size={20}/>
              <span className="text-[10px] font-medium">Sohbet</span>
           </Link>
           <Link to="/live" className="p-3 -mt-6 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-300 border-4 border-slate-50">
              <Radio size={24}/>
           </Link>
           <Link to="/vision" className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/vision' ? 'text-blue-600' : 'text-slate-400'}`}>
              <Camera size={20}/>
              <span className="text-[10px] font-medium">Görsel</span>
           </Link>
           {/* Only show Inventory link on mobile bottom nav if pharmacist */}
           {user.role === 'pharmacist' ? (
               <Link to="/inventory" className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/inventory' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <Package size={20}/>
                  <span className="text-[10px] font-medium">Stok</span>
               </Link>
           ) : (
               <Link to="/profile" className={`p-2 flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <User size={20}/>
                  <span className="text-[10px] font-medium">Profil</span>
               </Link>
           )}
        </div>
      )}
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
