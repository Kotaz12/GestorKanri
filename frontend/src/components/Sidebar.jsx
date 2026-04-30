import { NavLink } from "react-router-dom";
import {
    SquaresFour,
    FileText,
    Users,
    Tag,
    Buildings,
    Bell,
    CaretLeft,
    CaretRight,
    X,
} from "@phosphor-icons/react";

const NAV = [
    { to: "/", label: "Dashboard", icon: SquaresFour, testid: "nav-dashboard" },
    { to: "/procedures", label: "Trámites", icon: FileText, testid: "nav-procedures" },
    { to: "/clients", label: "Clientes", icon: Users, testid: "nav-clients" },
    { to: "/types", label: "Tipos de Trámite", icon: Tag, testid: "nav-types" },
    { to: "/dependencies", label: "Dependencias", icon: Buildings, testid: "nav-dependencies" },
    { to: "/notifications", label: "Notificaciones", icon: Bell, testid: "nav-notifications" },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const width = collapsed ? "w-20" : "w-[280px]";

    const content = (
        <>
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-md bg-blue-700 text-white grid place-items-center font-bold">
                        K
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="font-bold text-slate-900 tracking-tight text-[15px] leading-tight">
                                Gestor Kanri
                            </div>
                            <div className="text-[11px] text-slate-500 uppercase tracking-[0.15em]">
                                Trámites
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden text-slate-500"
                    aria-label="Cerrar"
                    data-testid="sidebar-close-mobile"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            data-testid={item.testid}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                } ${collapsed ? "justify-center" : ""}`
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} weight="regular" />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-slate-200">
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    data-testid="sidebar-toggle"
                    className={`hidden lg:flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors ${
                        collapsed ? "justify-center" : ""
                    }`}
                >
                    {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
                    {!collapsed && <span>Colapsar</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop */}
            <aside
                className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 ${width} bg-white border-r border-slate-200 transition-[width] duration-300 ease-in-out`}
            >
                {content}
            </aside>

            {/* Mobile */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                >
                    <aside
                        className="absolute inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {content}
                    </aside>
                </div>
            )}
        </>
    );
}
