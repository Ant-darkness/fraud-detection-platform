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
import { FcCheckmark, FcHighPriority } from 'react-icons/fc';

const App = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModelForMetrics, setSelectedModelForMetrics] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Toast Notification State
  const [toast, setToast] = useState(null);

  // ULINZI DHIDI YA INSPECT ELEMENT NA DOM EDITING
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
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
    <div className="min-h-screen bg-[#e6ebf0] text-slate-800 flex relative font-sans antialiased select-none overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab === 'metrics' ? 'models' : activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Layout Workspace Container */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${
        isCollapsed ? 'pl-20' : 'pl-64'
      }`}>
        {/* Topbar Header */}
        <Topbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Dynamic Workspace Screens */}
        <main className="pt-24 pb-8 px-6 flex-1 overflow-y-auto scrollbar-thin">
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

      {/* Soft Neomorphic Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl neo-card border transition-all duration-300 ${
          toast.type === 'success' 
            ? 'border-emerald-300/80 text-emerald-900' 
            : 'border-rose-300/80 text-rose-900'
        }`}>
          <span className="text-xl">
            {toast.type === 'success' ? <FcCheckmark /> : <FcHighPriority />}
          </span>
          <span className="text-xs font-black tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
