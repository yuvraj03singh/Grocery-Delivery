import { Zap } from "lucide-react";
import { dummyProducts } from "../assets/assets";
import type { Product } from "../types";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import ProductCard from "../components/ProductCard";

const FlashDeals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProducts(dummyProducts.filter((p: any) => p.stock > 0));
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="min-h-screen bg-app-cream">
      {/*banner*/}
      <div className="bg-linear-to-r from-app-orange to-app-orange-dark text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex-center gap-2 mb-3">
            <Zap size-6 fill-white />
            <h1 className="text-3xl font-bold">Flash Deals</h1>
            <Zap size-6 fill-white />
          </div>
          <p className="text-white/80 max-w-md mx-auto">
            Limited Time Offers on Selected Products.Grab them before they're
            gone!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="size-6 fill-white" />
            <h2 className="text-lg font-semibold text-app-green mb-2">
              No Flash Deals Available
            </h2>
            <p className="text-white/80 mt-4">Check back soon!</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
            xl:grid-cols-5 gap-4"
          >
            {products.map(
              (product) =>
                product.stock > 0 && (
                  <ProductCard key={product._id} product={product} />
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashDeals;
