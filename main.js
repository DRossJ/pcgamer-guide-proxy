// search.js - Deno Deploy Proxy for PCGamer Guide Search

// Environment variables:
// GOOGLE_API_KEY = Your Google Custom Search API key
// SEARCH_ENGINE_ID = Your CSE ID

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
      return new Response(
        JSON.stringify({ error: "Server config missing: GOOGLE_API_KEY or SEARCH_ENGINE_ID" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const query = `site:pcgamer.com "${game} guide"`;
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", API_KEY);
    url.searchParams.append("cx", SEARCH_ENGINE_ID);
    url.searchParams.append("q", query);

    console.log("🔍 Searching Google CSE:", url.toString());

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Search API failed", details: errText }),
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: "No guides found for this game." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = data.items.map((item) => ({
      title: item.title,
      url: item.link,
    }));

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle incoming requests
addEventListener("fetch", (event) => {
  event.respondWith(handler(event.request));
});
