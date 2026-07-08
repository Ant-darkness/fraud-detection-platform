import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import MobileSidebar from "../components/layout/MobileSidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F4F6F9]">
      <Sidebar />
      <MobileSidebar open={mobileOpen} setOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
