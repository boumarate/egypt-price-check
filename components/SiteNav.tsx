"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Prices" },
  { href: "/feedback", label: "Feedback" },
];

/**
 * Top navigation, drawn as part of the dark masthead so the home page's hero and the nav
 * read as one branded band rather than two stacked grey bars.
 *
 * Plain links rather than a router-driven tab widget: the site is a static export and
 * every destination is a real page, so ordinary anchors keep working with no JavaScript.
 */
export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="bg-slate-950">
      <div className="mx-auto flex max-w-2xl items-center gap-1 px-4">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500"
        />
        {TABS.map((tab) => {
          // "/" must match exactly, or it would light up on every product page too.
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "border-amber-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
