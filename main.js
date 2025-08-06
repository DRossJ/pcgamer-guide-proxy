export const handler = (request) => {
  return new Response("✅ PCGamer Proxy is LIVE!", {
    headers: { "Content-Type": "text/plain" },
  });
};

// Critical: Register the fetch listener
addEventListener("fetch", (event) => {
  event.respondWith(handler(event.request));
});
