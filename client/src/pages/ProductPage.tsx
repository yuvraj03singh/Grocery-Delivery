import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Product } from "../types";
import Loading from "../components/Loading";
import { useCart } from "../context/CartContext";

import {
  ArrowLeftIcon,
  IndianRupeeIcon,
  HomeIcon,
  LeafIcon,
  StarIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
} from "lucide-react";
import DummyReviewsSection from "../assets/DummyReviewsSection";
import ProductCard from "../components/ProductCard";
import api from "../config/api";
import { toast } from "react-hot-toast/headless";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setQuantity(1);
      window.scrollTo(0, 0);

      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);

        const { data: relatedData } = await api.get(
          `/products?category=${data.product.category}`,
        );
        setRelatedProducts(
          relatedData.products.filter(
            (relatedProduct: Product) => relatedProduct.id !== id,
          ),
        );
      } catch (error: any) {
        toast.error(error.response?.data?.message || error?.message);
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  if (loading) return <Loading />;
  if (!product) return null;

  const inCart = items.some((item) => item.product.id === product.id);
  const categoryLabel = product.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/*Bread crumbs*/}
        <nav className="flex items-center gap-2 text-sm text-app-text-light mb-6">
          <Link to="/" className="hover:text-app-green transition-colors">
            <HomeIcon className="size-4" />
          </Link>
          <span></span>
          <Link
            to="/products"
            className="hover:text-app-green transition-colors"
          >
            Products
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-app-green transition-colors capitalize"
          >
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-app-green font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-app-text-light hover:text-app-green transition-colors"
        >
          <ArrowLeftIcon className="size-4" /> Back
        </button>

        {/*Product details*/}
        <div className="bg-white/50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative flex-center p-8 md:p-12 min-h-[320px] md:min-h-[480px]">
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                {product.isOrganic && (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-app-green text-white rounded-full shadow-sm">
                    <LeafIcon className="w-3.5 h-3.5" />
                    Organic
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="px-2.5 py-1 text-xs font-semibold uppercase bg-app-orange text-white rounded-full shadow-sm">
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              <img
                src={product.image}
                alt={product.name}
                className="object-contain max-h-[360px] w-auto"
              />
            </div>

            <div className="p-6 md:p-0 flex flex-col justify-center">
              <span className="text-xs font-medium text-app-text-light dark:text-zinc-400 tracking-wider mb-2 capitalize">
                {categoryLabel}
              </span>
              <h1 className="text-2xl md:text-3xl font-semibold text-app-green dark:text-zinc-100 mb-3">
                {product.name}
              </h1>

              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(product.rating) ? "text-app-warning fill-app-warning" : "text-app-border dark:text-zinc-700"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium dark:text-zinc-100">{product.rating}</span>
                  <span className="text-sm text-app-text-light dark:text-zinc-400">
                    ({product.reviewCount} reviews)
                  </span>
                </div>
              )}

              <div>
                <span className="text-3xl md:text-4xl font-semibold text-app-green dark:text-zinc-100 inline-flex items-center gap-1">
                  <IndianRupeeIcon className="size-6 md:size-7" />
                  {product.price.toFixed(2)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-app-text-light dark:text-zinc-400 line-through ml-2 inline-flex items-center gap-0.5">
                    <IndianRupeeIcon className="size-3.5" />
                    {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-sm text-app-text-light dark:text-zinc-400 leading-relaxed mb-6 mt-4">
                {product.description}
              </p>

              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="text-app-success text-sm font-medium">
                    In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="text-app-danger text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-app-border dark:border-zinc-700 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="p-3 hover:bg-app-cream dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="w-4 h-4 dark:text-zinc-100" />
                  </button>
                  <span className="px-5 text-sm font-semibold min-w-[40px] text-center dark:text-zinc-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="p-3 hover:bg-app-cream dark:hover:bg-zinc-800 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 dark:text-zinc-100" />
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stock <= 0}
                  className={`flex-1 py-3 font-semibold rounded-xl transition-colors flex-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${inCart ? "bg-app-green text-white hover:bg-app-dark-green" : "bg-app-orange text-white hover:bg-app-orange-dark"}`}
                >
                  <ShoppingCartIcon className="w-4 h-4" />
                  {inCart ? "Added to Cart" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/*customer reviews section*/}
        {product.reviewCount > 0 && <DummyReviewsSection product={product} />}

        {/* Related products section */}

        {relatedProducts.length > 0 && (
          <section className="mt-12 mb-44">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-app-green dark:text-zinc-100">
                  Related Products
                </h2>
                <p className="text-sm text-app-text-light dark:text-zinc-400 mt-1">
                  More from {categoryLabel}
                </p>
              </div>
              <Link
                to={`/products?category=${product.category}`}
                className="text-sm text-app-orange font-semibold hover:text-app-orange-dark flex items-center transition-colors gap-1 shrink-0"
              >
                View All
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-8">
              {relatedProducts.slice(0, 5).map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
