import { NavLink, Outlet } from "react-router-dom";
import { PlusIcon, PackageSearchIcon, ShoppingBagIcon, LogOutIcon, BarChart3Icon, ShieldIcon, Truck } from "lucide-react";
import Navbar from "../../components/Navbar";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminLayout() {

    const { user } = useAuth();

    const AdminLinkData = [
        { to: "/admin", label: "Dashboard", icon: BarChart3Icon },
        { to: "/admin/products/new", label: "Add Product", icon: PlusIcon },
        { to: "/admin/products", label: "Products", icon: PackageSearchIcon },
        { to: "/admin/orders", label: "Orders", icon: ShoppingBagIcon },
        { to: "/admin/delivery-partners", label: "Delivery Partners", icon: Truck },
        { to: "/", label: "Exit", icon: LogOutIcon },
    ]

    if (!user?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="h-screen overflow-hidden">
            <div className="max-lg:hidden">
                <Navbar />
            </div>
            <div className="flex flex-col h-full lg:flex-row gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {/* Admin Sidebar */}
                <aside className="w-full lg:w-64 shrink-0 h-fit bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-app-border dark:border-zinc-800">
                    <div className="pb-4 mb-4 border-b border-app-border dark:border-zinc-800 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-app-green dark:text-zinc-100 flex items-center gap-2 px-2">
                            <ShieldIcon className="size-5 text-green-900 dark:text-zinc-100" /> Admin Panel
                        </h2>
                        <ThemeToggle />
                    </div>
                    <nav className="flex flex-col gap-1.5">

                        {AdminLinkData.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={true}
                                className={({ isActive }) => `flex items-center gap-3 p-2.5 rounded-md text-sm transition-colors ${isActive
                                    ? "bg-app-green text-white"
                                    : "text-app-text-light hover:bg-orange-50 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                    }`}
                            >
                                <link.icon className="size-4" /> {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
