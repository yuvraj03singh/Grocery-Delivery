import { MailIcon } from "lucide-react";

const Newsletter = () => {
  return (
    <section className="bg-white dark:bg-zinc-900 py-18 px-4 sm:px-6 lg:px-8 rounded-3xl mx-auto shadow-xs mt-32 mb-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="size-16 bg-white dark:bg-zinc-800 rounded-xl flex-center mx-auto mb-6 shadow">
          <MailIcon className="size-8 text-app-green dark:text-zinc-100" strokeWidth={1.5} />
        </div>

        <h2 className="text-3xl font-semibold text-app-green dark:text-zinc-100 mb-4">
          Subscribe to our newsletter
        </h2>
        <p className="text-app-text-light dark:text-zinc-400 mb-8 text-base">
          Get Weekly Updates and Exclusive Offers on your email and exclusive
          deals.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="Enter your email"
            required
            className="flex-1 px-5 py-3.5 rounded-xl border border-app-border dark:border-zinc-700
                focus:border-app-green dark:focus:border-zinc-500 focus:ring bg-white dark:bg-zinc-800 text-sm dark:text-zinc-100 transition-all"
          />
          <button
            type="submit"
            className="px-8 py-3.5 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light
                transition-colors shadow-sm active:scale-[0.98] whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};
export default Newsletter;
