import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/status";
import { Bell, Check, CheckCircle } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Notifications() {
    const qc = useQueryClient();
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => (await api.get("/api/auth/notifications")).data,
    });

    const markOne = useMutation({
        mutationFn: async (id) => (await api.post(`/api/auth/notifications/${id}/read`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["unread-count"] });
        },
    });
    const markAll = useMutation({
        mutationFn: async () => (await api.post(`/api/auth/notifications/read-all`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["unread-count"] });
            toast.success("Todas marcadas como leídas");
        },
    });

    const unread = items.filter((n) => !n.read).length;

    return (
        <div className="space-y-5 max-w-3xl" data-testid="notifications-page">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Bandeja
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Notificaciones
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {unread === 0
                            ? "Estás al día"
                            : `${unread} sin leer`}
                    </p>
                </div>
                {unread > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => markAll.mutate()}
                        data-testid="mark-all-read"
                    >
                        <CheckCircle size={16} className="mr-1.5" /> Marcar todas como leídas
                    </Button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
                {isLoading && <div className="p-6 text-sm text-slate-500">Cargando…</div>}
                {!isLoading && items.length === 0 && (
                    <div className="p-10 text-center">
                        <div className="h-14 w-14 mx-auto rounded-full bg-slate-50 grid place-items-center text-slate-400">
                            <Bell size={24} />
                        </div>
                        <div className="mt-3 text-sm text-slate-500">Sin notificaciones</div>
                    </div>
                )}
                {items.map((n) => (
                    <div
                        key={n.id}
                        data-testid={`notification-${n.id}`}
                        className={`flex items-start gap-3 p-4 ${n.read ? "opacity-60" : ""}`}
                    >
                        <div
                            className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${n.read ? "bg-slate-300" : "bg-blue-600"}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-900">{n.message}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {formatDateTime(n.created_at)}
                            </div>
                        </div>
                        {!n.read && (
                            <button
                                onClick={() => markOne.mutate(n.id)}
                                data-testid={`notification-read-${n.id}`}
                                className="shrink-0 h-8 px-2.5 inline-flex items-center gap-1 rounded-md text-xs text-blue-700 hover:bg-blue-50"
                            >
                                <Check size={13} /> Marcar leída
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
