async function fetchNews(type) {
  const res = await fetch(`/api/news?type=${type}`);
  const data = await res.json();

  if (!data.items) {
    throw new Error(data.error || "No news items returned");
  }

  return data.items;
}

function renderNews(containerId, articles) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  articles.forEach(article => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" style="width:100%; height:140px; object-fit:cover; border-radius:10px; margin-bottom:12px;" />` : ""}
    
      <h3>${article.title}</h3>
      <p>${article.pubDate}</p>
      <a href="${article.link}" target="_blank" rel="noopener noreferrer" style="color:#22c55e;">Read more</a>
    `;

    container.appendChild(div);
  });
}

async function loadNews() {
  try {
    const [nflNews, collegeNews] = await Promise.all([
      fetchNews("nfl"),
      fetchNews("college")
    ]);

    renderNews("nfl-news", nflNews);
    renderNews("college-news", collegeNews);
  } catch (error) {
    console.error("Error loading news:", error);

    document.getElementById("nfl-news").innerHTML = `
      <div class="card">
        <h3>Unable to load NFL news</h3>
        <p>Please try again in a minute.</p>
      </div>
    `;

    document.getElementById("college-news").innerHTML = `
      <div class="card">
        <h3>Unable to load college football news</h3>
        <p>Please try again in a minute.</p>
      </div>
    `;
  }
}

loadNews();
