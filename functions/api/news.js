export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  let feedUrl = "";
  let sectionUrl = "";

  if (type === "nfl") {
    feedUrl = "https://www.espn.com/espn/rss/nfl/news";
    sectionUrl = "https://www.espn.com/nfl/";
  } else if (type === "college") {
    feedUrl = "https://www.espn.com/espn/rss/ncf/news";
    sectionUrl = "https://www.espn.com/college-football/";
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid type. Use ?type=nfl or ?type=college" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getTag(itemXml, tag) {
    const m = itemXml.match(
      new RegExp(
        `<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      )
    );
    return m ? (m[1] || m[2] || "").trim() : "";
  }

  function normalizeImageUrl(src) {
    if (!src) return null;
    if (src.startsWith("//")) return `https:${src}`;
    if (src.startsWith("/")) return `https://www.espn.com${src}`;
    return src;
  }

  function getImageFromSectionHtml(sectionHtml, articleUrl) {
    try {
      const articlePath = new URL(articleUrl).pathname;
      const escapedPath = escapeRegExp(articlePath);

      const patterns = [
        new RegExp(
          `href=["'][^"']*${escapedPath}[^"']*["'][\\s\\S]{0,2500}?<img[^>]+src=["']([^"']+)["']`,
          "i"
        ),
        new RegExp(
          `<img[^>]+src=["']([^"']+)["'][\\s\\S]{0,2500}?href=["'][^"']*${escapedPath}[^"']*["']`,
          "i"
        ),
        new RegExp(
          `href=["'][^"']*${escapedPath}[^"']*["'][\\s\\S]{0,2500}?<img[^>]+data-default-src=["']([^"']+)["']`,
          "i"
        ),
        new RegExp(
          `<img[^>]+data-default-src=["']([^"']+)["'][\\s\\S]{0,2500}?href=["'][^"']*${escapedPath}[^"']*["']`,
          "i"
        )
      ];

      for (const pattern of patterns) {
        const match = sectionHtml.match(pattern);
        if (match?.[1]) {
          return normalizeImageUrl(match[1]);
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  try {
    const [feedResponse, sectionResponse] = await Promise.all([
      fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }),
      fetch(sectionUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      })
    ]);

    const xmlText = await feedResponse.text();
    const sectionHtml = await sectionResponse.text();

    const items = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 6)
      .map((match) => {
        const itemXml = match[1];
        const description = getTag(itemXml, "description");
        const link = getTag(itemXml, "link");

        const mediaContentMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"/i);
        const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
        const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);
        const descriptionImgMatch = description.match(/<img[^>]+src="([^"]+)"/i);

        const rssImage =
          mediaContentMatch?.[1] ||
          mediaThumbnailMatch?.[1] ||
          enclosureMatch?.[1] ||
          descriptionImgMatch?.[1] ||
          null;

        const sectionImage = !rssImage && link
          ? getImageFromSectionHtml(sectionHtml, link)
          : null;

        return {
          title: getTag(itemXml, "title"),
          link,
          pubDate: getTag(itemXml, "pubDate"),
          image: rssImage || sectionImage || null
        };
      });

    return new Response(JSON.stringify({ items }, null, 2), {
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
