import type { PagesFunction, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  IMAGES_BUCKET: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const name = context.params.name;
  if (!name || typeof name !== 'string') {
    return new Response("Missing filename", { status: 400 });
  }

  try {
    const object = await context.env.IMAGES_BUCKET.get(name);
    if (!object) {
      return new Response("Object Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // Set content type if not present based on file extension
    if (!headers.has("content-type")) {
      if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
        headers.set("content-type", "image/jpeg");
      } else if (name.endsWith(".png")) {
        headers.set("content-type", "image/png");
      } else if (name.endsWith(".gif")) {
        headers.set("content-type", "image/gif");
      } else if (name.endsWith(".webp")) {
        headers.set("content-type", "image/webp");
      } else if (name.endsWith(".svg")) {
        headers.set("content-type", "image/svg+xml");
      }
    }

    return new Response(object.body, {
      headers,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
