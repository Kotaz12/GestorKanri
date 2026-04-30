import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PWAInstallPrompt from "./PWAInstallPrompt";

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F8FAFC]" data-testid="app-layout">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    paddingLeft:
                        typeof window !== "undefined" && window.innerWidth >= 1024
                            ? collapsed
                                ? 80
                                : 280
                            : 0,
                }}
            >
                <Topbar onMobileMenuClick={() => setMobileOpen(true)} />
                <main className="pt-[64px] min-h-screen p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
            <PWAInstallPrompt />
        </div>
    );
}
