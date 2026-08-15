"use client";

import { useState } from "react";

/**
 * One-tap feedback: a thumb, then an optional note.
 *
 * The mailto templates ask someone to open their mail app, which is enough friction that
 * most people say nothing. A thumb is one tap and anonymous -- it sends exactly what the
 * user can see (the thumb, the note if they write one, and which page they were on) to
 * the site's own /api/feedback, and nothing else.
 *
 * The rating posts immediately on tap rather than waiting for the note: a thumb alone is
 * already the signal, and most people will not write anything.
 */
type State = "idle" | "sent" | "noted" | "failed";

export default function RateWidget() {
  const [state, setState] = useState<State>("idle");
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [note, setNote] = useState("");

  async function send(payload: { rating: "up" | "down"; note?: string }) {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, page: window.location.pathname }),
    });
    if (!response.ok) throw new Error(String(response.status));
  }

  async function rate(value: "up" | "down") {
    setRating(value);
    try {
      await send({ rating: value });
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  async function sendNote() {
    if (!rating || !note.trim()) return;
    try {
      await send({ rating, note: note.trim() });
      setState("noted");
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      {state === "idle" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Did this help?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => rate("up")}
              aria-label="Yes, this helped"
              className="rounded-full bg-slate-100 px-4 py-2 text-lg transition hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-900"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => rate("down")}
              aria-label="No, this did not help"
              className="rounded-full bg-slate-100 px-4 py-2 text-lg transition hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-900"
            >
              👎
            </button>
          </div>
          <p className="w-full text-xs text-slate-400 dark:text-slate-500">
            Anonymous — sends only the thumb and anything you type.
          </p>
        </div>
      )}

      {state === "sent" && (
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Thanks! Anything you&rsquo;d change?{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">
              (optional)
            </span>
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder={
                rating === "down" ? "What went wrong?" : "What would make it better?"
              }
              className="min-w-0 flex-1 rounded-xl border-0 bg-slate-100 px-3 py-2.5 text-base
                         placeholder:text-slate-400 focus:outline-none focus:ring-2
                         focus:ring-amber-400 dark:bg-slate-800 dark:text-slate-50"
            />
            <button
              type="button"
              onClick={sendNote}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white
                         transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {state === "noted" && (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Got it — thank you.
        </p>
      )}

      {state === "failed" && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Couldn&rsquo;t send — you may be offline. Try again when you have signal.
        </p>
      )}
    </section>
  );
}
