import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api",
})

//inject jwt token in request headers

api.interceptors.request.use((config) => {
    const isDeliveryRoute = config.url?.startsWith('/delivery');
    
    if (isDeliveryRoute) {
        const deliveryToken = localStorage.getItem("delivery_token");
        if (deliveryToken) {
            config.headers.Authorization = `Bearer ${deliveryToken}`;
            return config;
        }
    }

    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

//handle auth error globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isDeliveryRoute = error.config?.url?.startsWith('/delivery');
            
            if (isDeliveryRoute) {
                localStorage.removeItem("delivery_token");
                localStorage.removeItem("delivery_partner");
                if (!window.location.pathname.includes("/delivery/login")) {
                    window.location.href = "/delivery/login";
                }
            } else {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                if (!window.location.pathname.includes("/login") &&
                    !window.location.pathname.includes("/register")) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }

)
export default api;