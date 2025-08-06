export const handler = (request) => {
  return new Response("Hello from Deno!", {
    headers: { "Content-Type": "text/plain" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handler(event.request));
});
