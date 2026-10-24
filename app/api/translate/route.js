import translate from "google-translate-api-x";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const text = searchParams.get("text");
  const to = searchParams.get("to") || "en";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/plain; charset=utf-8",
  };

  if (!text || !text.trim()) {
    return new Response("Usage: /api/translate?text=your%20sentence&to=en", {
      status: 400,
      headers,
    });
  }

  if (text.length > 1000) {
    return new Response("Text too long. Max 1000 characters.", {
      status: 400,
      headers,
    });
  }

  try {
    const result = await translate(text, {
      to,
      client: "gtx",
    });

    return new Response(result.text, { status: 200, headers });
  } catch (err) {
    console.error("Translation error:", err);

    return new Response("Translation failed. Try again later.", {
      status: 500,
      headers,
    });
  }
}