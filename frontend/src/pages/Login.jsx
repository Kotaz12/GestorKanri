import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { formatError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { LockKey, Envelope, User } from "@phosphor-icons/react";
import { toast } from "sonner";

const BG = "https://images.unsplash.com/photo-1774272864432-97dc997432c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGFic3RyYWN0JTIwYXJjaGl0ZWN0dXJhbCUyMGRldGFpbHN8ZW58MHx8fHwxNzc3NTc1ODY1fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
    const { user, login, register } = useAuth();
    const nav = useNavigate();
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("admin@kanri.mx");
    const [password, setPassword] = useState("Kanri2026!");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (user && user !== false) return <Navigate to="/" replace />;

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "login") {
                await login(email, password);
                toast.success("Sesión iniciada");
            } else {
                await register(email, password, name || null);
                toast.success("Cuenta creada");
            }
            nav("/", { replace: true });
        } catch (err) {
            toast.error(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" data-testid="login-page">
            {/* Left visual */}
            <div
                className="hidden lg:block lg:w-1/2 relative"
                style={{ backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
                <div className="absolute inset-0 bg-slate-900/80" />
                <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-blue-600 text-white grid place-items-center font-bold">
                                K
                            </div>
                            <div>
                                <div className="font-bold text-lg leading-tight">Gestor Kanri</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                                    Control de Trámites
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
                            Cada trámite en su tiempo.
                            <br />
                            <span className="text-blue-300">Nunca más fuera de plazo.</span>
                        </h1>
                        <p className="mt-6 text-white/70 max-w-md leading-relaxed">
                            Monitorea, asigna y responde. Alertas por vencer, semáforo de estado y
                            trazabilidad completa de cada trámite.
                        </p>
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-[0.2em]">
                        Versión 1.0 · PWA habilitado
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-blue-700 text-white grid place-items-center font-bold">
                            K
                        </div>
                        <div className="font-bold text-slate-900">Gestor Kanri</div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
                        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    </div>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
                        {mode === "login" ? "Bienvenido de nuevo" : "Únete al equipo"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {mode === "login"
                            ? "Ingresa tus credenciales para acceder al panel."
                            : "Completa los datos para crear una cuenta."}
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-4">
                        {mode === "register" && (
                            <div>
                                <Label htmlFor="name">Nombre</Label>
                                <div className="mt-1.5 relative">
                                    <User
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="pl-9"
                                        data-testid="register-name-input"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="email">Correo electrónico</Label>
                            <div className="mt-1.5 relative">
                                <Envelope
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.mx"
                                    className="pl-9"
                                    data-testid="login-email-input"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="mt-1.5 relative">
                                <LockKey
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9"
                                    data-testid="login-password-input"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            data-testid="login-submit-button"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white h-10 mt-2"
                        >
                            {loading
                                ? "Procesando…"
                                : mode === "login"
                                  ? "Iniciar sesión"
                                  : "Crear cuenta"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                        <button
                            onClick={() => setMode(mode === "login" ? "register" : "login")}
                            data-testid="toggle-auth-mode"
                            className="text-blue-700 hover:text-blue-800 font-medium"
                        >
                            {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
                        </button>
                    </div>

                    {mode === "login" && (
                        <div className="mt-8 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            <div className="font-semibold text-slate-700 mb-1">
                                Credenciales de demo
                            </div>
                            admin@kanri.mx · Kanri2026!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
