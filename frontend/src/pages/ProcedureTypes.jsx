import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const empty = { name: "", description: "", response_days: 5 };

export default function ProcedureTypes() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);

    const { data: types = [] } = useQuery({
        queryKey: ["types"],
        queryFn: async () => (await api.get("/api/auth/types")).data,
    });

    const save = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data, response_days: Number(data.response_days) };
            if (editing) return (await api.put(`/api/auth/types/${editing}`, payload)).data;
            return (await api.post("/api/types", payload)).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["types"] });
            setOpen(false);
            setForm(empty);
            setEditing(null);
            toast.success(editing ? "Tipo actualizado" : "Tipo creado");
        },
        onError: (e) => toast.error(formatError(e)),
    });
    const remove = useMutation({
        mutationFn: async (id) => (await api.delete(`/api/auth/types/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["types"] });
            toast.success("Tipo eliminado");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    const openNew = () => {
        setEditing(null);
        setForm(empty);
        setOpen(true);
    };
    const openEdit = (t) => {
        setEditing(t.id);
        setForm({
            name: t.name,
            description: t.description || "",
            response_days: t.response_days,
        });
        setOpen(true);
    };

    return (
        <div className="space-y-5" data-testid="types-page">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Catálogo
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Tipos de trámite
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Cada tipo define los días de respuesta que se usan para calcular el vencimiento.
                    </p>
                </div>
                <Button
                    onClick={openNew}
                    className="bg-blue-700 hover:bg-blue-800"
                    data-testid="type-new-button"
                >
                    <Plus size={16} weight="bold" className="mr-1.5" /> Nuevo tipo
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((t) => (
                    <div
                        key={t.id}
                        data-testid={`type-card-${t.id}`}
                        className="bg-white border border-slate-200 rounded-md p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                    {t.name}
                                </div>
                                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                    {t.description || "Sin descripción"}
                                </p>
                            </div>
                            <div className="shrink-0 ml-3 flex gap-1">
                                <button
                                    onClick={() => openEdit(t)}
                                    data-testid={`type-edit-${t.id}`}
                                    className="h-8 w-8 grid place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                                >
                                    <PencilSimple size={15} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("¿Eliminar este tipo?"))
                                            remove.mutate(t.id);
                                    }}
                                    data-testid={`type-delete-${t.id}`}
                                    className="h-8 w-8 grid place-items-center rounded-md text-red-600 hover:bg-red-50"
                                >
                                    <Trash size={15} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 tabular-nums">
                                {t.response_days}
                            </span>
                            <span className="text-xs uppercase tracking-[0.15em] font-bold text-slate-500">
                                días de respuesta
                            </span>
                        </div>
                    </div>
                ))}
                {types.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-10">
                        Aún no hay tipos de trámite registrados.
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md" data-testid="type-dialog">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar tipo" : "Nuevo tipo"}</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate(form);
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label>Nombre *</Label>
                            <Input
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                data-testid="type-name-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                                rows={3}
                                data-testid="type-description-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Días de respuesta *</Label>
                            <Input
                                required
                                type="number"
                                min={1}
                                value={form.response_days}
                                onChange={(e) =>
                                    setForm({ ...form, response_days: e.target.value })
                                }
                                data-testid="type-days-input"
                                className="mt-1.5"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={save.isPending}
                                className="bg-blue-700 hover:bg-blue-800"
                                data-testid="type-submit-button"
                            >
                                {save.isPending ? "Guardando…" : editing ? "Guardar" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
