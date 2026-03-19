async function fetchNews(feedUrl) {
  const api = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;

  const res = await fetch(api);
  const data = await res.json();

  const parser = new DOMParser();
  const xml = parser.parseFromString(data.contents, "text/xml");

  const items = [...xml.querySelectorAll("item")].slice(0, 6);

  return items.map(item => ({
    title: item.querySelector("title").textContent,
    link: item.querySelector("link").textContent,
    pubDate: item.querySelector("pubDate").textContent
  }));
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
