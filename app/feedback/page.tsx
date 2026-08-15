import type { Metadata } from "next";
import FeedbackForm from "@/components/FeedbackForm";
import { absolute, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feedback and corrections",
  description:
    "Report a wrong price, suggest a product to add, or send a suggestion — anonymously, right from this page.",
  alternates: { canonical: absolute("/feedback") },
  openGraph: {
    title: `Feedback — ${SITE_NAME}`,
    description: "Report a wrong price, suggest a product, or send a suggestion.",
    url: absolute("/feedback"),
  },
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Same masthead treatment as the rest of the site. */}
      <section className="relative overflow-hidden bg-slate-950 pb-14 pt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-[-10%] h-56 w-56 rounded-full bg-amber-500/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl px-4">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Tell me what&rsquo;s{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              wrong
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            This site is one person checking supermarket prices. If something is out of
            date, missing, or plainly wrong, saying so is the fastest way it gets fixed.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-16">
        <FeedbackForm />

        <section className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          <h2 className="mb-1 font-semibold">Where the prices come from</h2>
          <p>
            Baselines are scraped from Carrefour Egypt and cross-checked against Spinneys,
            Talabat Mart and Mahmoud El Far. Each price on a product card links to the shop
            listings it came from, so you can check any figure yourself. Regional markups
            outside Cairo and the North Coast are estimates and are labelled as such.
          </p>
        </section>
      </div>
    </main>
  );
}
