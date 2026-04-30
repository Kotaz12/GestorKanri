import { STATUS_LABELS, STATUS_CLASS } from "../lib/status";

export default function StatusBadge({ status }) {
    const label = STATUS_LABELS[status] || status;
    const klass = STATUS_CLASS[status] || "kanri-badge-completed";
    return (
        <span
            data-testid={`status-badge-${status}`}
            className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold ${klass}`}
        >
            {label}
        </span>
    );
}
