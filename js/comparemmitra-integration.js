/* CompareMitra Phase 3 integration layer
   Non-destructive: reads data/products.json and enhances existing product cards.
*/
(() => {
  const DATA_URL = "data/products.json";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const slug = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  function affiliateUrl(p, marketplace) {
    const direct = p?.links?.[marketplace === "amazon" ? "amazon_affiliate" : "flipkart_affiliate"];
    return direct || "";
  }

  function productUrl(p) {
    return `product.html?id=${encodeURIComponent(p.id)}`;
  }

  function card(p) {
    const image = p?.images?.primary || "";
    const price = p?.india?.price_inr || "Price to verify";
    const hold = p.status === "hold";
    return `
      <article class="cm-product-card" data-product-id="${esc(p.id)}">
        <a class="cm-image-wrap" href="${productUrl(p)}">
          <img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy"
               onerror="this.style.display='none';this.parentElement.classList.add('cm-image-missing')">
        </a>
        <div class="cm-product-body">
          <div class="cm-brand">${esc(p.brand)}</div>
          <h3><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
          <div class="cm-price">${esc(price)}</div>
          ${p?.india?.variants ? `<div class="cm-variants">${esc(p.india.variants)}</div>` : ""}
          <div class="cm-actions">
            <a class="cm-btn cm-secondary" href="${productUrl(p)}">View Details</a>
            ${hold ? `<span class="cm-status">Final verification pending</span>` :
              `<button class="cm-btn cm-primary" data-cm-buy="${esc(p.id)}">Check Price</button>`}
          </div>
        </div>
      </article>`;
  }

  function track(name, p) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, {product_id:p?.id, product_name:p?.name, brand:p?.brand});
    }
  }

  async function load() {
    const res = await fetch(DATA_URL, {cache:"no-store"});
    if (!res.ok) throw new Error("Could not load products.json");
    return res.json();
  }

  function wire(products) {
    document.querySelectorAll("[data-cm-product-grid]").forEach(el => {
      const limit = Number(el.dataset.limit || 0);
      const list = limit ? products.slice(0,limit) : products;
      el.innerHTML = list.map(card).join("");
    });

    document.querySelectorAll("[data-cm-search]").forEach(input => {
      const target = document.querySelector(input.dataset.target || "[data-cm-product-grid]");
      if (!target) return;
      input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        const filtered = products.filter(p =>
          `${p.name} ${p.brand}`.toLowerCase().includes(q));
        target.innerHTML = filtered.map(card).join("");
      });
    });

    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-cm-buy]");
      if (!btn) return;
      const p = products.find(x => x.id === btn.dataset.cmBuy);
      if (!p) return;
      const amazon = affiliateUrl(p,"amazon");
      const flipkart = affiliateUrl(p,"flipkart");
      track("price_check_click",p);

      if (amazon || flipkart) {
        const url = amazon || flipkart;
        window.open(url,"_blank","noopener");
        return;
      }
      alert("Marketplace link abhi final verification mein hai. Please product details page dekhein.");
    });
  }

  window.CompareMitra = {load, wire, slug};

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const data = await load();
      wire(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error("CompareMitra integration:", err);
    }
  });
})();
