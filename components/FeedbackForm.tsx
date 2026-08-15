"use client";

import { useState } from "react";

/**
 * The feedback page's four categories, now posting to the site's own anonymous endpoint
 * instead of opening a mail app.
 *
 * The mailto version exposed a personal address to scrapers and asked visitors to switch
 * apps -- enough friction that most said nothing. This keeps the structured prompts (a
 * bare "the price is wrong" with no product or place is unactionable) and sends them the
 * same way as the thumbs widget. Anonymous by default; anyone wanting a reply can leave
 * their own address in the text.
 */
const TOPICS = [
  {
    id: "wrong-price",
    title: "A price looks wrong",
    blurb:
      "The most useful thing you can send. Prices are scraped from Egyptian supermarkets, so they can lag reality or pick the wrong pack size.",
    placeholder:
      "Product:\nPrice shown on the site:\nPrice you actually saw:\nWhere (shop and area):",
    tone: "ring-amber-300 bg-amber-50 dark:ring-amber-700 dark:bg-amber-950",
  },
  {
    id: "add-product",
    title: "Add a product",
    blurb: "Something tourists buy that isn't listed yet.",
    placeholder: "Product and brand:\nSize:\nWhere you usually see it:",
    tone: "ring-sky-300 bg-sky-50 dark:ring-sky-700 dark:bg-sky-950",
  },
  {
    id: "bug",
    title: "Something is broken",
    blurb: "A page that won't load, a link that goes nowhere, a photo that's wrong.",
    placeholder: "What happened:\nPage or product:\nPhone and browser:",
    tone: "ring-rose-300 bg-rose-50 dark:ring-rose-700 dark:bg-rose-950",
  },
  {
    id: "other",
    title: "Suggestion or complaint",
    blurb: "Anything else — how it works, what's missing, what's annoying.",
    placeholder: "Say anything…",
    tone: "ring-slate-300 bg-white dark:ring-slate-600 dark:bg-slate-800",
  },
] as const;

type State = "idle" | "sending" | "sent" | "failed";

export default function FeedbackForm() {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(kind: string) {
    if (!text.trim()) return;
    setState("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, note: text.trim(), page: "/feedback" }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("sent");
      setText("");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") {
    return (
      <div className="-mt-6 rounded-2xl bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-300 dark:bg-emerald-950 dark:ring-emerald-700">
        <p className="font-bold text-emerald-900 dark:text-emerald-100">
          Got it — thank you.
        </p>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
          Every report gets read.{" "}
          <button
            type="button"
            onClick={() => setState("idle")}
            className="underline underline-offset-2"
          >
            Send another
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="-mt-6 space-y-3">
      {TOPICS.map((topic) => (
        <div
          key={topic.id}
          className={`rounded-2xl p-4 shadow-sm ring-1 transition ${topic.tone}`}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(open === topic.id ? null : topic.id);
              setText("");
              setState("idle");
            }}
            className="block w-full text-left"
          >
            <h2 className="font-bold text-slate-900 dark:text-slate-50">
              {topic.title}{" "}
              <span aria-hidden="true">{open === topic.id ? "↓" : "→"}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{topic.blurb}</p>
          </button>

          {open === topic.id && (
            <div className="mt-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder={topic.placeholder}
                className="w-full rounded-xl border-0 bg-white/80 px-3 py-2.5 text-base
                           placeholder:whitespace-pre-line placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-amber-400
                           dark:bg-slate-900/60 dark:text-slate-50"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Anonymous. Want a reply? Include your email in the message.
                </p>
                <button
                  type="button"
                  onClick={() => submit(topic.id)}
                  disabled={state === "sending" || !text.trim()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white
                             transition enabled:hover:bg-slate-700 disabled:opacity-40
                             dark:bg-slate-100 dark:text-slate-900"
                >
                  {state === "sending" ? "Sending…" : "Send"}
                </button>
              </div>
              {state === "failed" && (
                <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">
                  Couldn&rsquo;t send — you may be offline. Your text is still here; try
                  again when you have signal.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
