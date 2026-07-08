import { Navigate, Outlet } from "react-router-dom";

export default function AuthLayout() {
  const token = localStorage.getItem("access_token");

  // Kama hana token, tunamfukuza arudi Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Outlet />
    </div>
  );
}
