export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  let feedUrl = "";

  if (type === "nfl") {
    feedUrl = "https://www.espn.com/espn/rss/nfl/news";
  } else if (type === "college") {
    feedUrl = "https://www.espn.com/espn/rss/ncf/news";
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid type. Use ?type=nfl or ?type=college" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const feedResponse = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const xmlText = await feedResponse.text();

    const items = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 6)
      .map(match => {
        const itemXml = match[1];

        const getTag = (tag) => {
          const m = itemXml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`));
          return m ? (m[1] || m[2] || "").trim() : "";
        };

        const imageMatch = itemXml.match(/<media:content.*?url="(.*?)"/);
        const enclosureMatch = itemXml.match(/<enclosure.*?url="(.*?)"/);
        
        return {
          title: getTag("title"),
          link: getTag("link"),
          pubDate: getTag("pubDate"),
          image: imageMatch?.[1] || enclosureMatch?.[1] || null
        };
      });

    return new Response(JSON.stringify({ items }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch feed", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
