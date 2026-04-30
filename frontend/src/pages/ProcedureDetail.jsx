import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import { formatDate, formatDateTime, daysDiff, STATUS_COLOR } from "../lib/status";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { ArrowLeft, ChatCircleText, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ProcedureDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const qc = useQueryClient();
    const [note, setNote] = useState("");

    const { data: p } = useQuery({
        queryKey: ["procedure", id],
        queryFn: async () => (await api.get(`/procedures/${id}`)).data,
    });
    const { data: notes = [] } = useQuery({
        queryKey: ["procedure-notes", id],
        queryFn: async () => (await api.get(`/procedures/${id}/notes`)).data,
    });

    const addNote = useMutation({
        mutationFn: async (content) =>
            (await api.post(`/procedures/${id}/notes`, { content })).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["procedure-notes", id] });
            setNote("");
            toast.success("Nota agregada");
        },
        onError: (e) => toast.error(formatError(e)),
    });
    const changeStatus = useMutation({
        mutationFn: async (status) =>
            (await api.patch(`/procedures/${id}/status`, { status })).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["procedure", id] });
            qc.invalidateQueries({ queryKey: ["procedures"] });
            qc.invalidateQueries({ queryKey: ["stats"] });
            toast.success("Estado actualizado");
        },
        onError: (e) => toast.error(formatError(e)),
    });
    const remove = useMutation({
        mutationFn: async () => (await api.delete(`/procedures/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["procedures"] });
            toast.success("Trámite eliminado");
            nav("/procedures");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    if (!p) return <div className="text-slate-500 text-sm">Cargando…</div>;
    const dd = daysDiff(p.due_date);

    return (
        <div className="space-y-6 max-w-5xl" data-testid="procedure-detail-page">
            <Link
                to="/procedures"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft size={14} /> Volver a trámites
            </Link>

            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Trámite · {p.type_name || "Sin tipo"}
                    </div>
                    <h1 className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                        {p.title}
                    </h1>
                    <p className="mt-2 text-slate-600 max-w-2xl leading-relaxed">
                        {p.description || <span className="text-slate-400">Sin descripción</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Select
                        value={p.status}
                        onValueChange={(v) => changeStatus.mutate(v)}
                    >
                        <SelectTrigger className="w-40" data-testid="detail-status-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="on_time">A tiempo</SelectItem>
                            <SelectItem value="warning">Por vencer</SelectItem>
                            <SelectItem value="late">Fuera de tiempo</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (window.confirm("¿Eliminar este trámite?")) remove.mutate();
                        }}
                        data-testid="detail-delete-button"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash size={16} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Cliente" value={p.client_name} />
                <Field label="Dependencia" value={p.dependency_name} />
                <Field label="Asignado" value={p.assigned_user_email} />
                <Field
                    label="Vencimiento"
                    value={formatDate(p.due_date)}
                    accent={
                        p.status !== "completed" && dd !== null
                            ? dd < 0
                                ? STATUS_COLOR.late
                                : dd <= 2
                                  ? STATUS_COLOR.warning
                                  : STATUS_COLOR.on_time
                            : null
                    }
                    sub={
                        p.status !== "completed" && dd !== null
                            ? dd < 0
                                ? `${Math.abs(dd)}d vencido`
                                : `${dd}d restantes`
                            : null
                    }
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold text-slate-500 mb-3">
                    <ChatCircleText size={14} weight="bold" /> Seguimiento
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (note.trim()) addNote.mutate(note.trim());
                    }}
                    className="space-y-3 mb-6"
                >
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Agregar una nota u observación…"
                        rows={3}
                        data-testid="note-input"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!note.trim() || addNote.isPending}
                            className="bg-blue-700 hover:bg-blue-800"
                            data-testid="note-submit-button"
                        >
                            Agregar nota
                        </Button>
                    </div>
                </form>

                {notes.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-6">
                        Sin notas aún. Agrega la primera nota de seguimiento.
                    </div>
                ) : (
                    <ol className="relative pl-4 border-l border-slate-200 space-y-5">
                        {notes.map((n) => (
                            <li key={n.id} className="relative" data-testid={`note-${n.id}`}>
                                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
                                <div className="text-xs text-slate-500">
                                    <span className="font-medium text-slate-700">
                                        {n.user_name || n.user_email || "Sistema"}
                                    </span>{" "}
                                    · {formatDateTime(n.created_at)}
                                </div>
                                <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                                    {n.content}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}

function Field({ label, value, sub, accent }) {
    return (
        <div className="bg-white border border-slate-200 rounded-md p-4">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</div>
            {sub && (
                <div
                    className="text-xs font-bold uppercase mt-1"
                    style={{ color: accent }}
                >
                    {sub}
                </div>
            )}
        </div>
    );
}
