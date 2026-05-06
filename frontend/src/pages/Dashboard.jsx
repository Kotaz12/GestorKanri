import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import { formatDate, daysDiff, STATUS_COLOR } from "../lib/status";
import { ArrowRight, CheckCircle, Clock, WarningCircle, XCircle, Files } from "@phosphor-icons/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

const KpiCard = ({ label, value, icon: Icon, color, testid }) => (
    <div
        data-testid={testid}
        className="bg-white border border-slate-200 rounded-md p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
        <div className="flex items-start justify-between">
            <div>
                <div className="text-xs uppercase tracking-[0.15em] font-bold text-slate-500">
                    {label}
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{value}</div>
            </div>
            <div
                className="h-10 w-10 rounded-md grid place-items-center"
                style={{ background: `${color}18`, color }}
            >
                <Icon size={22} weight="bold" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const { data: stats } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => (await api.get("/api/procedures/stats")).data,
    });
    const { data: procedures = [] } = useQuery({
        queryKey: ["procedures"],
        queryFn: async () => (await api.get("/api/procedures")).data,
    });

    const recent = procedures.slice(0, 8);
    const chartData = stats
        ? [
              { name: "A tiempo", value: stats.on_time, color: STATUS_COLOR.on_time },
              { name: "Por vencer", value: stats.warning, color: STATUS_COLOR.warning },
              { name: "Fuera de tiempo", value: stats.late, color: STATUS_COLOR.late },
              { name: "Completados", value: stats.completed, color: STATUS_COLOR.completed },
          ]
        : [];

    return (
        <div className="space-y-6" data-testid="dashboard-page">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Panel general
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Monitorea el estado de todos los trámites activos.
                    </p>
                </div>
                <Link
                    to="/procedures"
                    data-testid="dashboard-cta-procedures"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    Ver todos los trámites <ArrowRight size={14} weight="bold" />
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                    label="Total"
                    value={stats?.total ?? "—"}
                    icon={Files}
                    color="#1D4ED8"
                    testid="kpi-total"
                />
                <KpiCard
                    label="Fuera de tiempo"
                    value={stats?.late ?? "—"}
                    icon={XCircle}
                    color={STATUS_COLOR.late}
                    testid="kpi-late"
                />
                <KpiCard
                    label="Por vencer"
                    value={stats?.warning ?? "—"}
                    icon={WarningCircle}
                    color={STATUS_COLOR.warning}
                    testid="kpi-warning"
                />
                <KpiCard
                    label="A tiempo"
                    value={stats?.on_time ?? "—"}
                    icon={Clock}
                    color={STATUS_COLOR.on_time}
                    testid="kpi-ontime"
                />
                <KpiCard
                    label="Completados"
                    value={stats?.completed ?? "—"}
                    icon={CheckCircle}
                    color={STATUS_COLOR.completed}
                    testid="kpi-completed"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-xs uppercase tracking-[0.15em] font-bold text-slate-500">
                                Distribución
                            </div>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                Trámites por estado
                            </h3>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: "#64748B" }}
                                    axisLine={{ stroke: "#E2E8F0" }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: "#64748B" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: "#F1F5F9" }}
                                    contentStyle={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: 6,
                                        fontSize: 12,
                                    }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6">
                    <div className="text-xs uppercase tracking-[0.15em] font-bold text-slate-500">
                        Resumen
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Indicadores clave</h3>
                    <dl className="mt-5 space-y-4">
                        {[
                            { k: "Cumplimiento", v: stats ? `${Math.round(((stats.on_time + stats.completed) / Math.max(stats.total, 1)) * 100)}%` : "—" },
                            { k: "Tasa de atraso", v: stats ? `${Math.round((stats.late / Math.max(stats.total, 1)) * 100)}%` : "—" },
                            { k: "Pendientes", v: stats ? stats.on_time + stats.warning + stats.late : "—" },
                        ].map(({ k, v }) => (
                            <div key={k} className="flex items-baseline justify-between border-b border-slate-100 pb-3 last:border-b-0">
                                <dt className="text-sm text-slate-500">{k}</dt>
                                <dd className="text-xl font-semibold text-slate-900 tabular-nums">
                                    {v}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="text-xs uppercase tracking-[0.15em] font-bold text-slate-500">
                        Actividad reciente
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Últimos trámites</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {recent.length === 0 && (
                        <li className="p-6 text-sm text-slate-500">Sin trámites registrados.</li>
                    )}
                    {recent.map((p) => {
                        const dd = daysDiff(p.due_date);
                        return (
                            <li key={p.id}>
                                <Link
                                    to={`/procedures/${p.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                    data-testid={`dashboard-recent-${p.id}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-900 truncate">
                                            {p.title}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {p.client_name || "Sin cliente"} ·{" "}
                                            {p.dependency_name || "Sin dependencia"}
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-xs text-slate-500 w-32 text-right">
                                        {formatDate(p.due_date)}
                                        {dd !== null && p.status !== "completed" && (
                                            <div
                                                className="text-[10px] uppercase tracking-wider font-bold mt-0.5"
                                                style={{
                                                    color:
                                                        dd < 0
                                                            ? STATUS_COLOR.late
                                                            : dd <= 2
                                                              ? STATUS_COLOR.warning
                                                              : STATUS_COLOR.on_time,
                                                }}
                                            >
                                                {dd < 0 ? `${Math.abs(dd)}d vencido` : `${dd}d restantes`}
                                            </div>
                                        )}
                                    </div>
                                    <StatusBadge status={p.status} />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
