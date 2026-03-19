async function fetchNews(feedUrl) {
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

  const res = await fetch(api);
  const data = await res.json();

  return data.items.slice(0, 6);
}

function renderNews(containerId, articles) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  articles.forEach(article => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${article.title}</h3>
      <p>${article.pubDate}</p>
      <a href="${article.link}" target="_blank" style="color:#22c55e;">Read more</a>
    `;

    container.appendChild(div);
  });
}

async function loadNews() {
  try {
    const nflFeed = "https://www.espn.com/espn/rss/nfl/news";
    const collegeFeed = "https://www.espn.com/espn/rss/ncf/news";

    const nflNews = await fetchNews(nflFeed);
    const collegeNews = await fetchNews(collegeFeed);

    renderNews("nfl-news", nflNews);
    renderNews("college-news", collegeNews);
  } catch (error) {
    console.error("Error loading news:", error);
  }
}

loadNews();
