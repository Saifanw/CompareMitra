(() => {
  "use strict";

  const PRODUCT_DATA = "data/product-details-all40.json";
  const OFFER_DATA = "data/marketplace-offers.json";

  let products = [];
  let offers = [];
  let activeProduct = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const esc = (value) => String(value ?? "—").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  const normalize = (value) => String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const marketplaceList = [
    { id:"amazon", name:"Amazon" },
    { id:"flipkart", name:"Flipkart" },
    { id:"myntra", name:"Myntra" },
    { id:"reliance", name:"Reliance Digital" },
    { id:"croma", name:"Croma" }
  ];

  function asProducts(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  function asOffers(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.offers)) return data.offers;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  async function loadJson(path) {
    try {
      const response = await fetch(path, { cache:"no-store" });
      if (!response.ok) throw new Error(`${response.status} ${path}`);
      return await response.json();
    } catch (error) {
      console.warn("CompareMitra:", error.message);
      return null;
    }
  }

  function findProduct(query) {
    const q = normalize(query);
    if (!q) return null;

    // Exact name first.
    let product = products.find(p => normalize(p.name) === q);
    if (product) return product;

    // Important: current data may use "Galaxy M36 5G" while UI says
    // "Samsung Galaxy M36 5G". Brand + name are therefore matched together.
    product = products.find(p => {
      const full = normalize(`${p.brand || ""} ${p.name || ""}`);
      return full === q;
    });
    if (product) return product;

    // Containment in either direction.
    product = products.find(p => {
      const name = normalize(p.name);
      const full = normalize(`${p.brand || ""} ${p.name || ""}`);
      return full.includes(q) || q.includes(full) || name.includes(q) || q.includes(name);
    });
    if (product) return product;

    // Token scoring for practical searches such as "Samsung M36".
    const tokens = q.split(" ").filter(Boolean);
    let best = null;
    let bestScore = 0;

    for (const p of products) {
      const text = normalize(`${p.brand || ""} ${p.name || ""}`);
      let score = 0;
      for (const token of tokens) {
        if (text.includes(token)) score += token.length >= 3 ? 2 : 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    return bestScore >= Math.max(3, Math.ceil(tokens.length * 1.5)) ? best : null;
  }

  function findOffer(product, marketplace) {
    const pid = String(product?.id ?? "");
    const mid = normalize(marketplace);
    return offers.find(o =>
      String(o.product_id ?? o.productId ?? o.id ?? "") === pid &&
      normalize(o.marketplace ?? o.store ?? "") === mid
    ) || null;
  }

  function getAffiliateUrl(product, marketplace) {
    const direct = product?.affiliate?.[marketplace];

    if (typeof direct === "string" && direct.trim()) return direct;
    if (direct && typeof direct === "object") {
      return direct.url || direct.affiliate_url || direct.link || null;
    }

    const offer = findOffer(product, marketplace);
    return offer?.affiliate_url || offer?.url || offer?.link || null;
  }

  function displayPrice(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
    return String(value);
  }

  /*
   * IMPORTANT:
   * The uploaded project stores these fields at the product ROOT:
   * display, processor, camera, battery, charging, network, weight.
   * They are NOT required to be inside p.specs.
   */
  function getSpecifications(product) {
    const specs = product?.specs || product?.specifications || {};

    return {
      "Display": product.display ?? specs.display ?? specs.screen ?? "—",
      "Processor": product.processor ?? specs.processor ?? specs.chipset ?? "—",
      "RAM & Storage": Array.isArray(product.variants)
        ? product.variants.join(" • ")
        : (product.variants || product.ram_storage || specs.ram_storage || "—"),
      "Camera": product.camera ?? specs.camera ?? specs.rear_camera ?? "—",
      "Battery": product.battery ?? specs.battery ?? "—",
      "Charging": product.charging ?? specs.charging ?? specs.fast_charging ?? "—",
      "5G Support": product.network ?? specs.network ?? specs["5g support"] ?? "5G",
      "Weight": product.weight ?? specs.weight ?? "—"
    };
  }

  function renderQuickSpecs(specs) {
    const target = $("#quickSpecs");
    if (!target) return;

    const selected = [
      ["DISPLAY", specs.Display],
      ["PROCESSOR", specs.Processor],
      ["CAMERA", specs.Camera],
      ["BATTERY", specs.Battery]
    ];

    target.innerHTML = selected.map(([label, value]) => `
      <div class="quick-spec">
        <small>${esc(label)}</small>
        <b>${esc(value)}</b>
      </div>
    `).join("");
  }

  function renderStoreHeader(product) {
    const head = $("#storeHead");
    if (!head) return;

    head.innerHTML = `<th>FEATURE</th>` + marketplaceList.map(store => {
      const offer = findOffer(product, store.id);
      const url = getAffiliateUrl(product, store.id);
      const connected = !!offer || !!url || store.id === "amazon";

      return `
        <th>
          <span class="store-logo">${esc(store.name)}</span>
          <span class="store-status">${connected ? "Connected" : "Not connected"}</span>
        </th>
      `;
    }).join("");
  }

  function renderMarketplaceCell(product, store, row, specs) {
    const offer = findOffer(product, store.id);
    const url = getAffiliateUrl(product, store.id);

    if (row === "Price") {
      const price = offer?.price ?? (store.id === "amazon" ? product.price : null);

      if (price !== null && price !== undefined && price !== "") {
        const cta = url
          ? `<a class="store-btn ${store.id === "amazon" ? "" : "generic-btn"}"
                target="_blank" rel="nofollow sponsored noopener"
                href="${esc(url)}">Check price ↗</a>`
          : `<span class="unavailable">Link pending</span>`;

        return `
          <td>
            <span class="store-price">${esc(displayPrice(price))}</span>
            ${cta}
          </td>
        `;
      }

      return `<td><span class="unavailable">Not connected</span></td>`;
    }

    // Until an actual marketplace feed/API is connected, do not copy the
    // product's specification into another store column and imply verification.
    if (store.id !== "amazon") {
      return `<td><span class="unavailable">—</span></td>`;
    }

    return `<td class="feature-label">${esc(specs[row])}</td>`;
  }

  function renderProduct(product) {
    activeProduct = product;

    $("#emptyState").hidden = true;
    $("#productResult").hidden = false;

    const image = $("#productImg");
    image.src = product.image || "assets/product-images/1.svg";
    image.alt = product.name || "Product";

    $("#productBrand").textContent = product.brand || "";
    $("#productName").textContent = product.name || "";

    const variants = Array.isArray(product.variants)
      ? product.variants.join("  |  ")
      : String(product.variants || "");

    $("#productVariant").textContent =
      `${variants}${product.network ? `  |  ${product.network}` : ""}`;

    const specs = getSpecifications(product);
    renderQuickSpecs(specs);
    renderStoreHeader(product);

    const rows = ["Price", ...Object.keys(specs)];

    $("#tableBody").innerHTML = rows.map(row => `
      <tr>
        <td>${esc(row)}</td>
        ${marketplaceList.map(store =>
          renderMarketplaceCell(product, store, row, specs)
        ).join("")}
      </tr>
    `).join("");
  }

  function renderEmpty(query = "") {
    $("#emptyState").hidden = false;
    $("#productResult").hidden = true;

    const title = $("#emptyState h2");
    const description = $("#emptyState p");

    if (query.trim()) {
      title.textContent = `No verified product found for “${query.trim()}”`;
      description.textContent =
        "Try a product name such as Samsung Galaxy M36 5G, iPhone 17 or OnePlus Nord 6.";
    } else {
      title.textContent = "Search once. See everything.";
      description.textContent =
        "Start with a product on the left. CompareMitra will bring useful specifications and connected store options into one clean workspace.";
    }
  }

  function searchProduct(query) {
    const product = findProduct(query);
    if (product) {
      renderProduct(product);
    } else {
      renderEmpty(query);
    }
  }

  function syncInputs(value) {
    if ($("#heroInput")) $("#heroInput").value = value;
    if ($("#topInput")) $("#topInput").value = value;
  }

  function bindSearch(form, input) {
    if (!form || !input) return;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const query = input.value.trim();
      syncInputs(query);
      searchProduct(query);
    });
  }

  async function init() {
    const [productData, offerData] = await Promise.all([
      loadJson(PRODUCT_DATA),
      loadJson(OFFER_DATA)
    ]);

    products = asProducts(productData);
    offers = asOffers(offerData);

    bindSearch($("#topSearch"), $("#topInput"));
    bindSearch($("#heroSearch"), $("#heroInput"));

    $$("[data-q]").forEach(button => {
      button.addEventListener("click", () => {
        const query = button.dataset.q || "";
        syncInputs(query);
        searchProduct(query);
      });
    });

    $("#clearBtn")?.addEventListener("click", () => {
      syncInputs("");
      activeProduct = null;
      renderEmpty("");
    });

    $("#highlightBtn")?.addEventListener("click", () => {
      $("#compareTable")?.querySelectorAll("tbody td").forEach(cell =>
        cell.classList.toggle("diff")
      );
      $("#highlightBtn")?.classList.toggle("active");
    });

    $("#moreStores")?.addEventListener("click", () => {
      alert("More marketplace columns will appear here as verified affiliate/API integrations are added.");
    });

    $("#addCompare")?.addEventListener("click", () => {
      if (!activeProduct) return;

      let ids = [];
      try {
        ids = JSON.parse(localStorage.getItem("comparemmitra_compare") || "[]");
      } catch (_) {}

      if (!ids.includes(activeProduct.id)) ids.push(activeProduct.id);
      localStorage.setItem("comparemmitra_compare", JSON.stringify(ids));

      const counter = $("#compareCount");
      if (counter) counter.textContent = ids.length;
    });

    try {
      const ids = JSON.parse(localStorage.getItem("comparemmitra_compare") || "[]");
      if ($("#compareCount")) $("#compareCount").textContent = ids.length;
    } catch (_) {}

    /*
     * Critical fix:
     * Browsers can restore the previous search text after a refresh.
     * Once JSON is loaded, use that restored text to render the product.
     */
    const restoredQuery =
      ($("#heroInput")?.value || $("#topInput")?.value || "").trim();

    if (restoredQuery) {
      searchProduct(restoredQuery);
    } else {
      renderEmpty("");
    }
  }

  init();
})();
