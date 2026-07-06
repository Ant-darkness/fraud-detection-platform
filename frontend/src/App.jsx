import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionReview from './pages/TransactionReview';
import ModelManagement from './pages/ModelManagement';
import OfficerManagement from './pages/OfficerManagement';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Access Layer */}
          <Route path="/login" element={<Login />} />

          {/* Core Protected Architecture Layer */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/review" element={<TransactionReview />} />
              <Route path="/models" element={<ModelManagement />} />
              
              {/* Restricted Administrative Segment */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/officers" element={<OfficerManagement />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all Routing Strategy */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
