import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
    DialogDescription,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../components/ui/table";
import StatusBadge from "../components/StatusBadge";
import { formatDate, STATUS_LABELS } from "../lib/status";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Procedures() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ["procedures"],
        queryFn: async () => (await api.get("/procedures")).data,
    });
    const { data: clients = [] } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => (await api.get("/clients")).data,
    });
    const { data: types = [] } = useQuery({
        queryKey: ["types"],
        queryFn: async () => (await api.get("/types")).data,
    });
    const { data: deps = [] } = useQuery({
        queryKey: ["dependencies"],
        queryFn: async () => (await api.get("/dependencies")).data,
    });
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => (await api.get("/users")).data,
    });

    const [form, setForm] = useState({
        title: "",
        description: "",
        client_id: "",
        type_id: "",
        dependency_id: "",
        assigned_user_id: "",
        responsible_type: "internal",
    });

    const create = useMutation({
        mutationFn: async (data) => (await api.post("/procedures", data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["procedures"] });
            qc.invalidateQueries({ queryKey: ["stats"] });
            setOpen(false);
            setForm({
                title: "",
                description: "",
                client_id: "",
                type_id: "",
                dependency_id: "",
                assigned_user_id: "",
                responsible_type: "internal",
            });
            toast.success("Trámite creado");
        },
        onError: (e) => toast.error(formatError(e)),
    });

    const filtered = useMemo(() => {
        return procedures.filter((p) => {
            if (statusFilter !== "all" && p.status !== statusFilter) return false;
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                (p.title || "").toLowerCase().includes(s) ||
                (p.client_name || "").toLowerCase().includes(s) ||
                (p.dependency_name || "").toLowerCase().includes(s)
            );
        });
    }, [procedures, search, statusFilter]);

    return (
        <div className="space-y-5" data-testid="procedures-page">
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        Operación
                    </div>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Trámites
                    </h1>
                </div>
                <Button
                    onClick={() => setOpen(true)}
                    className="bg-blue-700 hover:bg-blue-800"
                    data-testid="procedure-new-button"
                >
                    <Plus size={16} weight="bold" className="mr-1.5" /> Nuevo trámite
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <MagnifyingGlass
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por título, cliente o dependencia"
                        className="pl-9"
                        data-testid="procedures-search"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-56" data-testid="procedures-filter-status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trámite</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Dependencia</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                    Cargando…
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                    Sin resultados
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map((p) => (
                            <TableRow key={p.id} className="hover:bg-slate-50">
                                <TableCell>
                                    <Link
                                        to={`/procedures/${p.id}`}
                                        data-testid={`procedure-row-${p.id}`}
                                        className="font-medium text-slate-900 hover:text-blue-700"
                                    >
                                        {p.title}
                                    </Link>
                                    <div className="text-xs text-slate-500">
                                        {p.responsible_type === "internal" ? "Interno" : "Externo"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {p.client_name || "—"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {p.type_name || "—"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {p.dependency_name || "—"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {formatDate(p.due_date)}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={p.status} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg" data-testid="procedure-create-dialog">
                    <DialogHeader>
                        <DialogTitle>Nuevo trámite</DialogTitle>
                        <DialogDescription>
                            El vencimiento se calcula automáticamente a partir del tipo de trámite.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const payload = { ...form };
                            // Convert "" to null for foreign keys
                            ["client_id", "type_id", "dependency_id", "assigned_user_id"].forEach(
                                (k) => {
                                    if (!payload[k]) payload[k] = null;
                                },
                            );
                            create.mutate(payload);
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label>Título *</Label>
                            <Input
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                data-testid="procedure-title-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                data-testid="procedure-description-input"
                                className="mt-1.5"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Cliente</Label>
                                <Select
                                    value={form.client_id}
                                    onValueChange={(v) => setForm({ ...form, client_id: v })}
                                >
                                    <SelectTrigger className="mt-1.5" data-testid="procedure-client-select">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Tipo de trámite</Label>
                                <Select
                                    value={form.type_id}
                                    onValueChange={(v) => setForm({ ...form, type_id: v })}
                                >
                                    <SelectTrigger className="mt-1.5" data-testid="procedure-type-select">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} ({t.response_days}d)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Dependencia</Label>
                                <Select
                                    value={form.dependency_id}
                                    onValueChange={(v) => setForm({ ...form, dependency_id: v })}
                                >
                                    <SelectTrigger className="mt-1.5" data-testid="procedure-dep-select">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deps.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Asignado a</Label>
                                <Select
                                    value={form.assigned_user_id}
                                    onValueChange={(v) => setForm({ ...form, assigned_user_id: v })}
                                >
                                    <SelectTrigger className="mt-1.5" data-testid="procedure-user-select">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name || u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Responsable</Label>
                                <Select
                                    value={form.responsible_type}
                                    onValueChange={(v) => setForm({ ...form, responsible_type: v })}
                                >
                                    <SelectTrigger className="mt-1.5" data-testid="procedure-resp-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="internal">Interno</SelectItem>
                                        <SelectItem value="external">Externo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                data-testid="procedure-cancel-button"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={create.isPending}
                                className="bg-blue-700 hover:bg-blue-800"
                                data-testid="procedure-submit-button"
                            >
                                {create.isPending ? "Guardando…" : "Crear trámite"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
