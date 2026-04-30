import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Procedures from "./pages/Procedures";
import ProcedureDetail from "./pages/ProcedureDetail";
import Clients from "./pages/Clients";
import ProcedureTypes from "./pages/ProcedureTypes";
import Dependencies from "./pages/Dependencies";
import Notifications from "./pages/Notifications";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Dashboard />} />
                            <Route path="/procedures" element={<Procedures />} />
                            <Route path="/procedures/:id" element={<ProcedureDetail />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/types" element={<ProcedureTypes />} />
                            <Route path="/dependencies" element={<Dependencies />} />
                            <Route path="/notifications" element={<Notifications />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster position="top-right" richColors />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
