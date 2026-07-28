import { Plus, Star } from "lucide-react";
import { useNavigate } from "react-router";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "₹";

  const { addToCart } = useCart();
  const navigate = useNavigate();

  const discountedPrice =
    product.discount > 0
      ? product.price - (product.price * product.discount) / 100
      : product.price;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-md transition-all duration-300 group animate-fade-in cursor-pointer"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image} //this product image come from the dummy data which is available in assets folder and image store in json format in the assets.ts
          alt={product.name}
          className="w-full h-full object-cover p-4 group-hover:p-2 transition-all duration-300"
        />

        {/* Discount Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.discount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-app-orange text-white rounded-full">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 text-zinc-700">
        <h3 className="text-sm font-medium leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <Star className="size-4 text-app-warning fill-app-warning" />
            <span className="text-xs font-medium text-app-text">
              {product.rating}
            </span>
            <span className="text-xs text-app-text-light">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-app-green">
            {currency}
            {discountedPrice.toFixed(2)}
          </span>

          {product.discount > 0 && (
            <span className="text-sm text-zinc-400 line-through">
              {currency}
              {product.price.toFixed(2)}
            </span>
          )}

          {/*price + add to cart button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 truncate">
              {/* <span className="text-base font-medium">{currency}{product.price.toFixed(1)}</span> */}
              {/* <span className="text-xs text-app-text-light block">{product.unit}</span> */}
              {/* {product.originalPrice> product.price && <span className="text-xs text-app-text-light line-through ml-1.5">{currency}{product.originalPrice.toFixed(1)}</span>} */}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="size-7 rounded-full bg-app-orange text-white flex-center shrink-0 hover:bg-app-orange-dark transition-colors ml-5 active:scale-95"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
