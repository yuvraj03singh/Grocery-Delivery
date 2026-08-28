import { ArrowRightIcon, LeafIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { heroSectionData } from "../../assets/assets";

const Hero = () => {
  return (
    <section className="relative overflow-hidden min-h-135 mb-10 rounded-3xl flex items-center">
      <img
        src={heroSectionData.hero_image}
        alt="Hero"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-linear-to-r from-app-green via-app-green/65 to-transparent dark:from-app-cream-dark dark:via-app-cream-dark/80" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
        <div className="max-w-xl xl:pl-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-orange-200 bg-orange-300/10 rounded-full mb-5">
            <LeafIcon className="size-3.5" />
            Farm-Fresh & Organic
          </span>

          <h1 className="font-serif text-white text-4xl sm:text-5xl lg:text-5xl leading-tight mb-5">
            Nourish your home
            <br />
            with <span className="text-orange-300">Earth&apos;s finest</span>
          </h1>

          <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
            {heroSectionData.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="min-w-55 px-8 py-3.5 bg-app-orange text-white font-semibold rounded-full hover:bg-app-orange-dark transition-all flex-center gap-2 active:scale-[0.98]"
            >
              Shop Now <ArrowRightIcon className="size-4" />
            </Link>

            <Link
              to="/products"
              className="min-w-55 px-8 py-3.5 bg-white/10 border border-white/25 text-white font-semibold rounded-full hover:bg-white/20 transition-all flex-center active:scale-[0.98]"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
