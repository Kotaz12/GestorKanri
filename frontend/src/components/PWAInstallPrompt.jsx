import { useEffect, useState } from "react";
import { Download, X } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";

export default function PWAInstallPrompt() {
    const [evt, setEvt] = useState(null);
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem("kanri_install_dismissed") === "1",
    );

    useEffect(() => {
        // Register SW
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/service-worker.js")
                .catch(() => {});
        }
        const handler = (e) => {
            e.preventDefault();
            setEvt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    if (!evt || dismissed) return null;

    const install = async () => {
        evt.prompt();
        await evt.userChoice;
        setEvt(null);
    };

    const close = () => {
        localStorage.setItem("kanri_install_dismissed", "1");
        setDismissed(true);
    };

    return (
        <div
            data-testid="pwa-install-prompt"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50"
        >
            <div className="bg-white border border-slate-200 rounded-md shadow-lg p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-blue-700 text-white grid place-items-center font-bold">
                    K
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">
                        Instala Gestor Kanri
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Accede más rápido desde tu escritorio o móvil.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            size="sm"
                            onClick={install}
                            data-testid="pwa-install-accept"
                            className="bg-blue-700 hover:bg-blue-800"
                        >
                            <Download size={14} weight="bold" className="mr-1.5" />
                            Instalar
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={close}
                            data-testid="pwa-install-dismiss"
                        >
                            Ahora no
                        </Button>
                    </div>
                </div>
                <button
                    onClick={close}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Cerrar"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
