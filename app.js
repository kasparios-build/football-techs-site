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

    const fallbackImages = [
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390",
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2"
    ];
    
    const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    
    div.innerHTML = `
      <img src="${article.image || randomImage}"
           style="width:100%; height:140px; object-fit:cover; border-radius:10px; margin-bottom:12px;" />
    
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
