/**
 * The single dynamic endpoint on an otherwise static site.
 *
 * POST /api/feedback stores an anonymous rating: a thumb, an optional short note, and
 * the page it came from. Nothing else -- no IP, no user agent, no identifiers -- because
 * the feedback page promises exactly that. The mailto templates stay for people with
 * something longer to say; this exists because opening a mail app is enough friction
 * that most people say nothing at all.
 */

const MAX_NOTE = 500;
const MAX_PAGE = 200;

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/feedback") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      const rating = body.rating === "up" ? "up" : body.rating === "down" ? "down" : null;
      if (!rating) return new Response("Bad request", { status: 400 });

      const note = typeof body.note === "string" ? body.note.slice(0, MAX_NOTE).trim() : "";
      const page = typeof body.page === "string" ? body.page.slice(0, MAX_PAGE) : "";

      // Timestamp-first keys list chronologically in the dashboard; the random suffix
      // stops two simultaneous ratings clobbering each other.
      const key = `fb:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
      await env.FEEDBACK.put(key, JSON.stringify({ rating, note, page }), {
        // A year is plenty; feedback older than that describes a different site.
        expirationTtl: 60 * 60 * 24 * 365,
      });
      return new Response(null, { status: 204 });
    }

    // Anything else that reached the worker matched no built file; let the asset layer
    // produce its 404 page rather than inventing a second one here.
    return env.ASSETS.fetch(request);
  },
};

export default worker;
