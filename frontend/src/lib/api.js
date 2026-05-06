import axios from "axios";

//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

//export const API_BASE = `${BACKEND_URL}/api`;
export const API_BASE = "/";

const TOKEN_KEY = "kanri_access_token";

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            setToken(null);
        }
        return Promise.reject(err);
    },
);

export function formatError(e) {
    const d = e?.response?.data?.detail;
    if (!d) return e?.message || "Ocurrió un error inesperado";
    if (typeof d === "string") return d;
    if (Array.isArray(d))
        return d.map((x) => (x && typeof x.msg === "string" ? x.msg : JSON.stringify(x))).join(" ");
    if (d && typeof d.msg === "string") return d.msg;
    return String(d);
}
