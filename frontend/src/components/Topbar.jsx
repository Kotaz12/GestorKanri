import { List, Bell, SignOut } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Topbar({ onMobileMenuClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const { data: unread } = useQuery({
        queryKey: ["unread-count"],
        queryFn: async () => (await api.get("/notifications/unread-count")).data.count,
        refetchInterval: 30_000,
    });

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const initials = (user?.name || user?.email || "U")
        .split(/[\s@]/)[0]
        .slice(0, 2)
        .toUpperCase();

    return (
        <header
            className="fixed top-0 right-0 left-0 lg:left-[inherit] z-30 h-16 backdrop-blur-xl bg-white/80 border-b border-slate-200"
            data-testid="topbar"
        >
            <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMobileMenuClick}
                        className="lg:hidden text-slate-600 hover:text-slate-900 p-2 -ml-2"
                        aria-label="Abrir menú"
                        data-testid="mobile-menu-toggle"
                    >
                        <List size={22} />
                    </button>
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500">
                            Panel
                        </div>
                        <div className="text-sm font-semibold text-slate-900 -mt-0.5">
                            {user?.name || user?.email || "Gestor Kanri"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/notifications")}
                        className="relative h-10 w-10 grid place-items-center rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        aria-label="Notificaciones"
                        data-testid="topbar-notifications"
                    >
                        <Bell size={20} />
                        {unread > 0 && (
                            <span
                                data-testid="unread-badge"
                                className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold grid place-items-center"
                            >
                                {unread > 99 ? "99+" : unread}
                            </span>
                        )}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-10 px-2.5 flex items-center gap-2 rounded-md hover:bg-slate-50 transition-colors"
                                data-testid="user-menu-trigger"
                            >
                                <div className="h-8 w-8 rounded-full bg-blue-700 text-white grid place-items-center text-xs font-bold">
                                    {initials}
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                                {user?.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                data-testid="logout-button"
                                className="text-red-600 focus:text-red-700"
                            >
                                <SignOut size={16} className="mr-2" />
                                Cerrar sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
