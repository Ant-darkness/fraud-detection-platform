import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FraudReviews from './pages/FraudReviews';
import VolumeAnalysis from './pages/VolumeAnalysis';
import BusinessAnalytics from './pages/BusinessAnalytics'; // 👈 1. IMPORT HAPA
import ModelsRegistry from './pages/ModelsRegistry';
import MetricsReadOnly from './pages/MetricsReadOnly';
import OfficersAdmin from './pages/OfficersAdmin';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';

const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Toast State ya mfumo mzima
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Inafuta baada ya sekunde 4
  };

  // Kama mtumiaji hajalogin, tunaonyesha Login
  if (!user) {
    return <Login showToast={showToast} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex relative">
      {/* Sidebar ya mfumo */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Layout */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Dashboard space yenye Glass Containers */}
        <main className="pt-24 pb-12 px-8 flex-1 bg-black">
          {activeTab === 'dashboard' && <Dashboard showToast={showToast} />}
          {activeTab === 'reviews' && <FraudReviews showToast={showToast} />}
          {activeTab === 'volume' && <VolumeAnalysis showToast={showToast} />}
          {activeTab === 'businessAnalytics' && <BusinessAnalytics showToast={showToast} />} {/* 👈 2. RENDER HAPA */}
          {activeTab === 'models' && <ModelsRegistry showToast={showToast} />}
          {activeTab === 'metrics' && <MetricsReadOnly showToast={showToast} />}
          {activeTab === 'transactions' && <Transactions showToast={showToast} />}
          {activeTab === 'officers' && <OfficersAdmin showToast={showToast} />}
          {activeTab === 'change-password' && <ChangePassword showToast={showToast} />}
        </main>
      </div>

      {/* Global UI ya Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideIn ${
          toast.type === 'success' 
            ? 'bg-green-950/40 border-green-500/30 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.15)]' 
            : 'bg-red-950/40 border-red-500/30 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
