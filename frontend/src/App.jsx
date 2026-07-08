import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Models from "./pages/Models";
import Metrics from "./pages/Metrics";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout"; // Kama unayo sidebar kuu

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Njia za Wazi (Public Routes) */}
        <Route path="/" element={<Login />} />

        {/* Njia Zinazohitaji Token (Protected Routes) */}
        <Route element={<AuthLayout />}>
          <Route path="/change-password" element={<ChangePassword />} />
          
          {/* Njia za Dashboard na Ukaguzi zikiwa ndani ya Layout ya Maafisa */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/models" element={<Models />} />
            <Route path="/metrics" element={<Metrics />} />
          </Route>
        </Route>

        {/* Ukirudi hewani vibaya, rudishwa Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
