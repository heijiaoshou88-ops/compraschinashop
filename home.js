(function () {
  const menuToggle = document.querySelector(".site-header__menu-toggle");
  const nav = document.getElementById("site-header-nav");
  const latestList = document.getElementById("latest-articles-list");
  const guideList = document.getElementById("site-guide-articles");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    });
  }

  if (!latestList && !guideList) {
    return;
  }

  const hadPrerenderedArticles = latestList && latestList.querySelector(".article-card") !== null;
  const hadPrerenderedGuide = guideList && guideList.querySelector(".site-guide-article") !== null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toAbsolutePath(path) {
    if (!path) return "/";
    if (/^https?:\/\//i.test(path)) return path;
    return "/" + String(path).replace(/^\/+/, "");
  }

  function formatDate(value) {
    if (!value) return "";
    const iso = String(value).trim();
    const parsed = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    if (Number.isNaN(parsed.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(parsed);
  }

  function sortArticles(items) {
    return [...items].sort(function (left, right) {
      const rightDate = String(right.updated_at || right.date || "");
      const leftDate = String(left.updated_at || left.date || "");
      if (rightDate !== leftDate) return rightDate.localeCompare(leftDate);
      return Number(right.number || 0) - Number(left.number || 0);
    });
  }

  function renderLatestEmpty(message) {
    if (latestList) {
      latestList.innerHTML = '<div class="empty-state">' + escapeHtml(message) + "</div>";
    }
  }

  function renderGuideEmpty(message) {
    if (guideList) {
      guideList.innerHTML = '<li class="site-guide-empty">' + escapeHtml(message) + "</li>";
    }
  }

  function firstImagePath(item) {
    if (!item || !Array.isArray(item.blocks)) return item && item.og_image ? item.og_image : "";
    const imageBlock = item.blocks.find(function (block) {
      return block && block.type === "image" && block.path;
    });
    if (imageBlock && imageBlock.path) return imageBlock.path;
    return item.og_image || "";
  }

  function renderArticles(items) {
    if (!latestList) return;
    latestList.innerHTML = items.map(function (item) {
      const path = toAbsolutePath(item.path || "");
      const imagePath = toAbsolutePath(firstImagePath(item));
      const meta = [
        formatDate(item.date || ""),
        item.category || ""
      ].filter(Boolean).map(escapeHtml).join(" | ");
      return [
        '<article class="article-card">',
        imagePath ? '<a class="article-card__media" href="' + escapeHtml(path) + '"><img src="' + escapeHtml(imagePath) + '" alt="' + escapeHtml(item.title || "") + '" loading="lazy" decoding="async" width="1280" height="720"></a>' : "",
        meta ? '<p class="article-card__meta">' + meta + "</p>" : "",
        '<h3 class="article-card__title"><a href="' + escapeHtml(path) + '">' + escapeHtml(item.title || "") + "</a></h3>",
        '<p class="article-card__description">' + escapeHtml(item.description || "") + "</p>",
        '<a class="article-card__cta" href="' + escapeHtml(path) + '">Ler artigo</a>',
        "</article>"
      ].join("");
    }).join("");
  }

  function renderGuideArticles(items) {
    if (!guideList) return;
    guideList.innerHTML = items.map(function (item) {
      const path = toAbsolutePath(item.path || "");
      const meta = [
        formatDate(item.date || ""),
        item.category || ""
      ].filter(Boolean).map(escapeHtml).join(" | ");
      return [
        '<li class="site-guide-article">',
        '<a href="' + escapeHtml(path) + '">',
        meta ? '<span class="site-guide-article__meta">' + meta + "</span>" : "",
        '<strong>' + escapeHtml(item.title || "") + "</strong>",
        '<p>' + escapeHtml(item.description || "") + "</p>",
        "</a>",
        "</li>"
      ].join("");
    }).join("");
  }

  async function loadHomepageArticles() {
    const source = (latestList && latestList.dataset.articlesSource) || (guideList && guideList.dataset.guideSource) || "/articles.json";
    const latestEmptyMessage = latestList ? latestList.dataset.emptyMessage || "Nenhum artigo publicado ainda." : "";
    const guideEmptyMessage = guideList ? guideList.dataset.emptyMessage || "Nenhum artigo publicado ainda." : "";
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("articles_json_unavailable");
      }
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) {
        if (!hadPrerenderedArticles) {
          renderLatestEmpty(latestEmptyMessage);
        }
        if (!hadPrerenderedGuide) {
          renderGuideEmpty(guideEmptyMessage);
        }
        return;
      }
      const published = sortArticles(
        data.filter(function (item) {
          return item && String(item.status || "published") === "published";
        })
      ).slice(0, 6);
      if (!published.length) {
        if (!hadPrerenderedArticles) {
          renderLatestEmpty(latestEmptyMessage);
        }
        if (!hadPrerenderedGuide) {
          renderGuideEmpty(guideEmptyMessage);
        }
        return;
      }
      renderArticles(published);
      renderGuideArticles(published.slice(0, 4));
    } catch (error) {
      if (!hadPrerenderedArticles) {
        renderLatestEmpty(latestEmptyMessage);
      }
      if (!hadPrerenderedGuide) {
        renderGuideEmpty(guideEmptyMessage);
      }
      console.error(error);
    }
  }

  loadHomepageArticles();
})();
