/**
 * PCGamer Guide Proxy - Deno Deploy Fix
 * Ensures respondWith always gets a Response
 */

export const handler = async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { game } = await request.json();

    if (!game) {
      return new Response(JSON.stringify({ error: "Missing 'game' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const SEARCH_ENGINE_ID = Deno.env.get("SEARCH_ENGINE_ID");

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      console.error("Missing API key or Search Engine ID");
      return new Response(JSON.stringify({ error: "Server config missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", API_KEY);
    url.searchParams.append("cx", SEARCH_ENGINE_ID);
    url.searchParams.append("q", `${game} site:pcgamer.com`);

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google API error:", errText);
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    const results = (data.items || []).map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // 🔥 CRITICAL: Always return a Response, no matter what
    console.error("Unhandled error in handler:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 🔥 Ensure we always pass a Response to respondWith
addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        return await handler(event.request);
      } catch (err) {
        // Double safety net
        console.error("Critical error in fetch listener:", err);
        return new Response("Internal Server Error", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
