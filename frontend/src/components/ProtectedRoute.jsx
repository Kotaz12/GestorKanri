import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (user === null)
        return (
            <div className="h-screen grid place-items-center bg-slate-50">
                <div className="text-slate-500 text-sm">Cargando…</div>
            </div>
        );
    if (user === false) return <Navigate to="/login" replace />;
    return children;
}
