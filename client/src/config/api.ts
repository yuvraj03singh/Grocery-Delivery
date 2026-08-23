import axios from "axios";

/**
 * Configured Axios instance used for all outgoing API requests.
 * Uses the environment variable VITE_BASE_URL or defaults to localhost.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api",
})

/**
 * Request Interceptor
 * Automatically injects the correct JSON Web Token (JWT) into the Authorization header.
 * 
 * Flow:
 * - If the endpoint starts with `/delivery`, it uses the `delivery_token`.
 * - Otherwise, it falls back to the standard `auth_token` for customers/admins.
 */

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

/**
 * Response Interceptor
 * Acts as a global error handler for HTTP responses.
 * 
 * Flow:
 * - If a 401 Unauthorized error occurs, it clears local storage and forces a redirect to the appropriate login page.
 * - Handles both customer auth logic and delivery partner auth logic dynamically.
 */
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