import { useEffect, useState } from "react";
import type { Product } from "../types";
import { useSearchParams } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import { Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ProductCard from "../components/ProductCard";

const SearchResults = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setProducts(
      dummyProducts.filter((p: any) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    );
    setLoading(false);
  }, [query]);

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/*breadcrumbs*/}

        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link to="/" className="transition-colors hover:text-app-green">
            <Home className="size-4" />
          </Link>
          <span>/</span>
          <span className="text-app-green font-medium">Search Results</span>
        </nav>

        {/*header*/}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-app-green mb-1">
            Results for "{query}"
          </h1>
          <p className="text-sm text-app-text-light">
            {loading ? "Searching..." : `${products.length} items found`}
          </p>
        </div>

        {/*results*/}
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="size-16 text-app-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-app-green mb-2">
              No results found
            </h2>
            <p className="text-sm text-app-text-light mb-6 max-w-md mx-auto">
              we couldn't find any products matching your search "{query}".
              Please try again with different keywords.
            </p>
            <Link
              to="/products"
              className="inline-flex px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-lg"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
