import {
  ArrowUpRightIcon,
  BikeIcon,
  ChevronDownIcon,
  LogOutIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
    // Implement logout logic here (e.g., clear user session, redirect to login page)
  };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-app-border print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 h-16 flex items-center gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-[22px] font-medium shrink-0"
        >
          <BikeIcon size={24} />
          Apna Bazaar
        </Link>

        {/* Menu + Search */}
        <div className="w-full flex items-center justify-end gap-4 lg:gap-8">
          {/* Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-600">
            <Link to="/" className="hover:text-app-orange transition">
              Home
            </Link>

            <Link to="/products" className="hover:text-app-orange transition">
              Products
            </Link>

            <Link
              to="/deals"
              className="text-app-orange hover:text-orange-600 transition"
            >
              Deals
            </Link>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-sm sm:text-sm"
          >
            <div className="relative w-full max-w-md">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />

              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-orange-50 border border-orange-200 focus:outline-none focus:ring-2 focus:ring-app-orange/30"
              />
            </div>
          </form>

          {/*right side */}

          <div className="flex items-center gap-3">
            {/* Cart */}

            <button
              className="relative p-2 rounded-full"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCartIcon className="size-5 text-zinc-900" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 size-4
                bg-app-orange text-white text-[10px] rounded-full flex items-center justify-center "
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <div
                    className="size-7 rounded-full bg-green-950
                    text-white flex-center"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDownIcon className="size-5 text-zinc-900" />
                </button>
              ) : (
                <div className="flex-center gap-2">
                  <Link
                    to="/login"
                    className="hidden md:flex items-center gap-2 px-4 py-2
                    text-sm font-medium text-white bg-green-950 rounded-full hover:bg-green-950-light transition-colors"
                  >
                    <UserIcon size={16} />
                    Sign In
                  </Link>
                  {userMenuOpen ? (
                    <XIcon
                      className="md:hidden"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    />
                  ) : (
                    <MenuIcon
                      className="md:hidden"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    />
                  )}
                </div>
              )}

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2.5 w-56 bg-white rounded-xl shadow-lg border 
                  border-app-border py-2 z-50 animate-fade-in"
                  >
                    {user && (
                      <div className="px-4 py-2 border-app-border border-b">
                        <p className="font-medium text-zinc-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-zinc-500">{user?.email}</p>
                      </div>
                    )}

                    <div
                      onClick={() => setUserMenuOpen(false)}
                      className="py-2 text-sm text-zinc-700"
                    >
                      {!user && (
                        <Link to="/login" className="dropdown-link">
                          <UserIcon size={16} /> Sign In
                        </Link>
                      )}
                      {user && (
                        <Link to="/orders" className="dropdown-link">
                          <PackageIcon size={16} />
                          My Orders
                        </Link>
                      )}
                      {user && (
                        <Link to="/addresses" className="dropdown-link">
                          <MapPinIcon size={16} />
                          Addresses
                        </Link>
                      )}
                      <Link to="/products" className="dropdown-link">
                        <ArrowUpRightIcon size={16} />
                        Products
                      </Link>
                      <Link to="/deals" className="dropdown-link">
                        <ArrowUpRightIcon size={16} />
                        Deals
                      </Link>

                      {user?.isAdmin && (
                        <Link to="/admin/products" className="dropdown-link">
                          <ShieldIcon
                            className="text-app-orange-dark"
                            size={16}
                          />
                          <span className="text-app-orange-dark">
                            Admin Panel
                          </span>
                        </Link>
                      )}

                      {user && (
                        <div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-error hover:bg-red-50 w-full transition-colors"
                          >
                            <LogOutIcon size={16} /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
