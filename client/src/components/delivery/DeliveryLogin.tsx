import { useState, useEffect } from "react";
import { BikeIcon, HomeIcon } from "lucide-react";
import { heroSectionData } from "../../assets/assets";
import api from "../../config/api";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

export default function DeliveryLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("delivery_token")) {
            navigate("/delivery");
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            toast.error("Only @gmail.com email addresses are allowed");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post('/delivery/login', { email, password });
            localStorage.setItem('delivery_token', data.token);
            localStorage.setItem('delivery_partner', JSON.stringify(data.partner));
            toast.success("Logged In");
            navigate('/delivery');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-app-green dark:bg-zinc-950 relative items-center justify-center">
                <img src={heroSectionData.hero_image} alt="" className="absolute inset-0 object-cover h-full bg-center opacity-10" />
                <div className="relative text-center px-12">
                    <h2 className="text-4xl font-semibold text-white mb-4">Delivery Partner Portal</h2>
                    <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">Manage your deliveries and keep customers happy.</p>
                </div>
            </div>

            {/* Right Side Form */}
            <div className="flex-1 flex-center px-4 py-12 bg-app-cream relative">
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-4">
                    <ThemeToggle />
                    <Link to="/" className="flex items-center gap-2 text-app-text-light hover:text-app-green dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                        <HomeIcon className="size-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </div>
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="flex-center gap-2 mb-4">
                            <BikeIcon className="size-7 text-app-green dark:text-app-green-lighter" />
                            <span className="text-2xl font-semibold text-app-green dark:text-zinc-100">Apna Bazar</span>
                        </div>
                        <h1 className="text-2xl font-semibold text-app-green dark:text-zinc-100 mb-2">Delivery Partner Login</h1>
                        <p className="text-sm text-app-text-light dark:text-zinc-400">Sign in to manage your deliveries</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl p-8 space-y-5 shadow-sm dark:shadow-none">
                        <div>
                            <label className="block text-sm font-medium text-app-green dark:text-zinc-300 mb-1.5">Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-app-border dark:border-zinc-700 text-sm transition-colors dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-app-green dark:focus:border-app-green-lighter focus:ring-1 focus:ring-app-green dark:focus:ring-app-green-lighter" placeholder="partner@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-green dark:text-zinc-300 mb-1.5">Password</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-app-border dark:border-zinc-700 text-sm transition-colors dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-app-green dark:focus:border-app-green-lighter focus:ring-1 focus:ring-app-green dark:focus:ring-app-green-lighter" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 bg-app-green dark:bg-app-green-lighter text-white font-semibold rounded-xl hover:bg-app-green-light dark:hover:bg-app-green transition-colors disabled:opacity-60">
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
