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
import { Plus, PencilSimple, Trash, Buildings } from "@phosphor-icons/react";
import { toast } from "sonner";

const empty = { name: "", description: "" };

export default function Dependencies() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);

    const { data: deps = [] } = useQuery({
        queryKey: ["dependencies"],
        queryFn: async () => (await api.get("/dependencies")).data,
    });

    const save = useMutation({
        mutationFn: async (data) => {
            if (editing) return (await api.put(`/dependencies/${editing}`, data)).data;
            return (await api.post("/dependencies", data)).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["dependencies"] });
            setOpen(false);
            setForm(empty);
            setEditing(null);
            toast.success(editing ? "Dependencia actualizada" : "Dependencia creada");
        },
        onError: (e) => toast.error(formatError(e)),
    });
    const remove = useMutation({
        mutationFn: async (id) => (await api.delete(`/dependencies/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["dependencies"] });
            toast.success("Dependencia eliminada");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    return (
        <div className="space-y-5" data-testid="dependencies-page">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Catálogo
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Dependencias
                    </h1>
                </div>
                <Button
                    onClick={() => {
                        setEditing(null);
                        setForm(empty);
                        setOpen(true);
                    }}
                    className="bg-blue-700 hover:bg-blue-800"
                    data-testid="dep-new-button"
                >
                    <Plus size={16} weight="bold" className="mr-1.5" /> Nueva dependencia
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {deps.map((d) => (
                    <div
                        key={d.id}
                        data-testid={`dep-card-${d.id}`}
                        className="bg-white border border-slate-200 rounded-md p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-md bg-blue-50 text-blue-700 grid place-items-center">
                                <Buildings size={20} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 truncate">{d.name}</div>
                                <p className="mt-1 text-sm text-slate-500 line-clamp-3">
                                    {d.description || "Sin descripción"}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-1">
                            <button
                                onClick={() => {
                                    setEditing(d.id);
                                    setForm({ name: d.name, description: d.description || "" });
                                    setOpen(true);
                                }}
                                data-testid={`dep-edit-${d.id}`}
                                className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-xs text-slate-500 hover:bg-slate-100"
                            >
                                <PencilSimple size={13} /> Editar
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Eliminar dependencia?"))
                                        remove.mutate(d.id);
                                }}
                                data-testid={`dep-delete-${d.id}`}
                                className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-xs text-red-600 hover:bg-red-50"
                            >
                                <Trash size={13} /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
                {deps.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-10">
                        Aún no hay dependencias registradas.
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md" data-testid="dep-dialog">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Editar dependencia" : "Nueva dependencia"}
                        </DialogTitle>
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
                                data-testid="dep-name-input"
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
                                data-testid="dep-description-input"
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
                                data-testid="dep-submit-button"
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
