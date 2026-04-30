export const STATUS_LABELS = {
    on_time: "A tiempo",
    warning: "Por vencer",
    late: "Fuera de tiempo",
    completed: "Completado",
};

export const STATUS_CLASS = {
    on_time: "kanri-badge-on_time",
    warning: "kanri-badge-warning",
    late: "kanri-badge-late",
    completed: "kanri-badge-completed",
};

export const STATUS_COLOR = {
    on_time: "#10B981",
    warning: "#EAB308",
    late: "#EF4444",
    completed: "#64748B",
};

export function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

export function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function daysDiff(iso) {
    if (!iso) return null;
    const due = new Date(iso).getTime();
    const now = Date.now();
    return Math.round((due - now) / (1000 * 60 * 60 * 24));
}
