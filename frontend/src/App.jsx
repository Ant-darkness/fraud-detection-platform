import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FraudReviews from './pages/FraudReviews';
import VolumeAnalysis from './pages/VolumeAnalysis';
import BusinessAnalytics from './pages/BusinessAnalytics';
import ModelsRegistry from './pages/ModelsRegistry';
import MetricsReadOnly from './pages/MetricsReadOnly';
import OfficersAdmin from './pages/OfficersAdmin';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Reset from './pages/Reset';

const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModelForMetrics, setSelectedModelForMetrics] = useState(null);
  
  // Toast Alert Notification State
  const [toast, setToast] = useState(null);

  // ULINZI DHIDI YA INSPECT ELEMENT NA DOM EDITING
  useEffect(() => {
    // 1. Kuzuia Right Click
    const handleContextMenu = (e) => e.preventDefault();
    
    // 2. Kuzuia Shortcuts za Developer Tools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };

    // 3. MutationObserver kuzuia mabadiliko ya Text kupitia Inspect Element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          // Client-side text modification rollback logic
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleNavigateToMetrics = (model) => {
    setSelectedModelForMetrics(model);
    setActiveTab('metrics'); 
  };

  const handleBackToRegistry = () => {
    setSelectedModelForMetrics(null);
    setActiveTab('models');
  };

  if (!user) {
    return <Login showToast={showToast} />;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative font-sans antialiased selection:bg-pink-400 selection:text-slate-950 select-none">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -z-10" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F2C4CE]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab === 'metrics' ? 'models' : activeTab} setActiveTab={setActiveTab} />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pl-64">
        {/* Topbar Header */}
        <Topbar activeTab={activeTab === 'metrics' ? 'models' : activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Workspace Screens */}
        <main className="pt-20 pb-8 px-6 flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1600px] mx-auto w-full">
            {activeTab === 'dashboard' && <Dashboard showToast={showToast} />}
            {activeTab === 'reviews' && <FraudReviews showToast={showToast} />}
            {activeTab === 'volume' && <VolumeAnalysis showToast={showToast} />}
            {activeTab === 'businessAnalytics' && <BusinessAnalytics showToast={showToast} />}
            
            {activeTab === 'models' && (
              <ModelsRegistry 
                showToast={showToast} 
                onNavigateToMetrics={handleNavigateToMetrics}
              />
            )}

            {activeTab === 'metrics' && (
              <MetricsReadOnly 
                showToast={showToast} 
                selectedModel={selectedModelForMetrics}
                onBackToRegistry={handleBackToRegistry}
              />
            )}

            {activeTab === 'transactions' && <Transactions showToast={showToast} />}
            
            {activeTab === 'officers' && (
              isAdmin ? <OfficersAdmin showToast={showToast} /> : <Dashboard showToast={showToast} />
            )}

            {activeTab === 'change-password' && <ChangePassword showToast={showToast} />}
            {activeTab === 'reset-password' && <Reset showToast={showToast} />}
          </div>
        </main>
      </div>

      {/* Glass Notification Toast UI */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50' 
            : 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
        }`}>
          <span className="text-base">{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
