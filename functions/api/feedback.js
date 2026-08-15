/**
 * The single dynamic endpoint on an otherwise static site (Cloudflare Pages Function --
 * file-based routing maps this file to POST /api/feedback).
 *
 * Stores an anonymous rating: a thumb, an optional short note, and the page it came
 * from. Nothing else -- no IP, no user agent, no identifiers -- because the feedback page
 * promises exactly that. Only onRequestPost is exported, so Pages answers every other
 * method with 405 by itself.
 */

const MAX_NOTE = 1000;
const MAX_PAGE = 200;

// Structured reports from the feedback page use the same endpoint as the thumbs widget,
// so removing the public email address cost no reporting ability.
const KINDS = new Set(["wrong-price", "add-product", "bug", "other"]);

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const rating = body.rating === "up" ? "up" : body.rating === "down" ? "down" : null;
  const kind = KINDS.has(body.kind) ? body.kind : null;
  const note = typeof body.note === "string" ? body.note.slice(0, MAX_NOTE).trim() : "";
  const page = typeof body.page === "string" ? body.page.slice(0, MAX_PAGE) : "";

  // Two valid shapes: a thumb (note optional), or a categorised report (note required --
  // an empty "wrong price" report carries no information at all).
  if (!rating && !(kind && note)) return new Response("Bad request", { status: 400 });

  // Timestamp-first keys list chronologically in the dashboard; the random suffix stops
  // two simultaneous ratings clobbering each other.
  const key = `fb:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
  await context.env.FEEDBACK.put(key, JSON.stringify({ rating, kind, note, page }), {
    // A year is plenty; feedback older than that describes a different site.
    expirationTtl: 60 * 60 * 24 * 365,
  });
  return new Response(null, { status: 204 });
}
