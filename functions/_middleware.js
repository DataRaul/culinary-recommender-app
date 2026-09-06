const STEP7E_GENERATED_PATH = "/src/data/external/generated/forkrecipe-step7e-live/";

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if (pathname.startsWith(STEP7E_GENERATED_PATH)) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
        "x-content-type-options": "nosniff"
      }
    });
  }
  return context.next();
}
