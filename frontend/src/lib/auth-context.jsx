import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken, getToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // user: null (loading), false (not auth), object (auth)
    const [user, setUser] = useState(null);

    const loadUser = useCallback(async () => {
        if (!getToken()) {
            setUser(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setToken(null);
            setUser(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, password, name) => {
        const { data } = await api.post("/auth/register", { email, password, name });
        setToken(data.access_token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (_) {}
        setToken(null);
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refresh: loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
