import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../components/ui/table";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const empty = { name: "", email: "", phone: "", address: "" };

export default function Clients() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => (await api.get("/api/clients")).data,
    });

    const save = useMutation({
        mutationFn: async (data) => {
            if (editing) return (await api.put(`/api/clients/${editing}`, data)).data;
            return (await api.post("/clients", data)).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["clients"] });
            setOpen(false);
            setForm(empty);
            setEditing(null);
            toast.success(editing ? "Cliente actualizado" : "Cliente creado");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    const remove = useMutation({
        mutationFn: async (id) => (await api.delete(`/api/clients/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Cliente eliminado");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    const openNew = () => {
        setEditing(null);
        setForm(empty);
        setOpen(true);
    };
    const openEdit = (c) => {
        setEditing(c.id);
        setForm({
            name: c.name || "",
            email: c.email || "",
            phone: c.phone || "",
            address: c.address || "",
        });
        setOpen(true);
    };

    return (
        <div className="space-y-5" data-testid="clients-page">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Catálogo
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Clientes
                    </h1>
                </div>
                <Button
                    onClick={openNew}
                    className="bg-blue-700 hover:bg-blue-800"
                    data-testid="client-new-button"
                >
                    <Plus size={16} weight="bold" className="mr-1.5" /> Nuevo cliente
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead className="w-24" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                    Cargando…
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && clients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                    No hay clientes registrados
                                </TableCell>
                            </TableRow>
                        )}
                        {clients.map((c) => (
                            <TableRow key={c.id} className="hover:bg-slate-50">
                                <TableCell className="font-medium text-slate-900">
                                    {c.name}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">{c.email || "—"}</TableCell>
                                <TableCell className="text-sm text-slate-600">{c.phone || "—"}</TableCell>
                                <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                                    {c.address || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <button
                                        onClick={() => openEdit(c)}
                                        data-testid={`client-edit-${c.id}`}
                                        className="h-8 w-8 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 inline-grid"
                                    >
                                        <PencilSimple size={15} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("¿Eliminar cliente?"))
                                                remove.mutate(c.id);
                                        }}
                                        data-testid={`client-delete-${c.id}`}
                                        className="h-8 w-8 grid place-items-center rounded-md text-red-600 hover:bg-red-50 inline-grid"
                                    >
                                        <Trash size={15} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md" data-testid="client-dialog">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
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
                                data-testid="client-name-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Correo</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                data-testid="client-email-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Teléfono</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                data-testid="client-phone-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Dirección</Label>
                            <Input
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                data-testid="client-address-input"
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
                                data-testid="client-submit-button"
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
