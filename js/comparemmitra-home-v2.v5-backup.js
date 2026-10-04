(()=>{
const DATA_URL="data/product-details-all40.json", OFFER_URL="data/marketplace-offers.json", MARKET_URL="data/marketplace-config.json";
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=()=>{try{return JSON.parse(localStorage.getItem("comparemmitra_compare")||"[]")}catch{return[]}};
const save=a=>localStorage.setItem("comparemmitra_compare",JSON.stringify(a));
let products=[], offers=[], marketplaces=[], selected=null, marketIndex=0, compareProducts=[];
const state={query:"Samsung Galaxy M36 5G"};
function count(){const e=$("#compareCount");if(e)e.textContent=ids().length}
function go(v){v=v.trim();location.href=v?`products.html?search=${encodeURIComponent(v)}`:"products.html"}
function scoreText(p){return p.price_note&&/observed/i.test(p.price_note)?"Observed price":"Catalog price"}
function compareIds(){return compareProducts.map(p=>p.id)}
function compareScore(p){
  const text=[p.display,p.processor,p.camera,p.battery,p.charging,p.network,p.weight].join(' ');
  let score=7.5;
  if(/120Hz|144Hz|OLED|AMOLED/i.test(text)) score+=0.25;
  if(/5G/i.test(p.network||'')) score+=0.2;
  if(/5000|5500|6000/i.test(p.battery||'')) score+=0.15;
  if(/50MP|64MP|108MP/i.test(p.camera||'')) score+=0.15;
  return Math.min(9.9,score).toFixed(1);
}
function marketplacePrice(p,id){const o=getOffer(p,id); return o&&o.price?o.price:'—'}
function toggleCompareProduct(p){
  if(!p)return;
  const i=compareProducts.findIndex(x=>x.id===p.id);
  if(i>=0){ if(compareProducts.length>1) compareProducts.splice(i,1); }
  else if(compareProducts.length<4) compareProducts.push(p);
  selected=compareProducts[0]||p;
  renderComparisonMatrix();
  renderResults(state.query);
  count();
}
function renderComparisonMatrix(){
  const table=$('#comparisonMatrix'); if(!table)return;
  if(!compareProducts.length){table.querySelector('thead').innerHTML='';table.querySelector('tbody').innerHTML='<tr><td class="matrix-empty" colspan="5">Add products from the left panel to start comparing.</td></tr>';return;}
  const rows=[
    ['Price',p=>p.price||'—'],
    ['Amazon',p=>marketplacePrice(p,'amazon')],
    ['Display',p=>p.display||'—'],
    ['Processor',p=>p.processor||'—'],
    ['RAM & Storage',p=>(p.variants||[]).join(' • ')||'—'],
    ['Rear / Front Camera',p=>p.camera||'—'],
    ['Battery',p=>p.battery||'—'],
    ['Charging',p=>p.charging||'—'],
    ['Operating System',p=>p.os||'—'],
    ['5G Support',p=>p.network||'—'],
    ['Weight',p=>p.weight||'—'],
    ['CompareMitra Score',p=>compareScore(p)+'/10']
  ];
  const head='<tr><th class="feature-col">Feature</th>'+compareProducts.map(p=>`<th class="product-col"><div class="matrix-product"><div class="matrix-image"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div><div><span>${esc(p.brand)}</span><b>${esc(p.name)}</b><small>${esc((p.variants||[])[0]||'')}</small></div><button class="matrix-remove" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></div></th>`).join('')+'</tr>';
  table.querySelector('thead').innerHTML=head;
  table.querySelector('tbody').innerHTML=rows.map(([label,fn])=>{
    const vals=compareProducts.map(fn), different=vals.some(v=>v!==vals[0]&&v!=='—'&&vals[0]!=='—');
    return `<tr class="${different?'is-different':''}"><th>${esc(label)}</th>${vals.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
  }).join('');
  table.querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.remove;compareProducts=compareProducts.filter(x=>x.id!==id);if(!compareProducts.length&&products[0])compareProducts=[products.find(x=>x.id===selected?.id)||products[0]];selected=compareProducts[0];selectProduct(selected);});
  const diff=$('#highlightDifferences'); table.classList.toggle('highlight-mode',!!diff?.checked);
}
function renderPopular(){const root=$("#popularProducts");if(!root)return;const list=products.filter(p=>p.status!=="hold_final_refresh").slice(0,8);root.innerHTML=list.map((p,i)=>`<article class="product-card"><a href="product.html?id=${encodeURIComponent(p.id)}" class="product-image-wrap"><span class="product-tag">${i<2?"FEATURED":"COMPARE"}</span><img class="product-image" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a><div class="product-brand">${esc(p.brand)}</div><h3><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3><div class="product-price">${esc(p.price||"Price being refreshed")}</div><div class="product-meta">${esc((p.variants||[]).slice(0,2).join(" • ")||p.network||"Mobile")}</div><div class="product-actions"><a href="product.html?id=${encodeURIComponent(p.id)}">View details</a><button data-compare="${esc(p.id)}">${ids().includes(p.id)?"Added ✓":"Compare"}</button></div></article>`).join("");
root.querySelectorAll("[data-compare]").forEach(b=>b.onclick=()=>{let a=ids(),id=b.dataset.compare;if(a.includes(id))a=a.filter(x=>x!==id);else if(a.length<4)a.push(id);else{b.textContent="Max 4";return}save(a);count();b.textContent=a.includes(id)?"Added ✓":"Compare"})}
function findProducts(q){const words=q.toLowerCase().split(/\s+/).filter(Boolean);return products.map(p=>{const hay=[p.name,p.brand,p.highlight,p.display,p.processor,p.network,(p.variants||[]).join(" ")].join(" ").toLowerCase();const score=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0);return {p,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.p.name.localeCompare(b.p.name)).slice(0,8).map(x=>x.p)}
function renderResults(q){const root=$("#searchResults"),list=findProducts(q);$("#resultCount").textContent=list.length;root.innerHTML=list.length?list.map((p,i)=>{const added=compareIds().includes(p.id);return `<button class="result-item ${added?"active":""}" data-id="${esc(p.id)}"><img src="${esc(p.image)}" alt=""><span><b>${esc(p.brand)} ${esc(p.name)}</b><small>${esc((p.variants||[])[0]||p.network||"Product")}</small></span><strong>${added?"✓":"+"}</strong></button>`}).join(""):`<div class="empty-results">No matching product in the current catalog.<br><a href="products.html?search=${encodeURIComponent(q)}">Search all products →</a></div>`;
root.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>toggleCompareProduct(products.find(p=>p.id===b.dataset.id)))}
function renderVariants(p){const root=$("#variantRow");root.innerHTML=(p.variants||[]).map((v,i)=>`<span class="variant-pill ${i===0?"selected":""}">${esc(v)}</span>`).join("")}
function renderSpecs(p){const rows=[['Display',p.display],['Processor',p.processor],['RAM & Storage',(p.variants||[]).join(' • ')||'—'],['Rear / Front Camera',p.camera],['Battery',p.battery],['Charging',p.charging],['Operating System',p.os],['5G Support',p.network],['Weight',p.weight]];$("#specTable").innerHTML=rows.map(r=>`<div class="spec-row"><span>${esc(r[0])}</span><b>${esc(r[1]||'—')}</b></div>`).join("")}
function getOffer(p,id){return offers.find(o=>o.product_id===p.id&&o.marketplace===id)}
function renderMarkets(p){const track=$("#marketplaceTrack");const ordered=marketplaces.slice();track.innerHTML=ordered.map(m=>{const o=getOffer(p,m.id);const active=!!(o&&o.affiliate_url&&o.status&&/verified|active/i.test(o.status));const hasPrice=!!(o&&o.price);return `<article class="market-card ${active?"is-active":"is-pending"}"><div class="market-top"><span class="market-logo market-${esc(m.id)}">${esc(m.name.replace(/ India$/,''))}</span>${active?'<span class="live-dot">LIVE</span>':'<span class="pending-dot">SOON</span>'}</div><div class="market-price">${active&&hasPrice?esc(o.price):active?'Connected':'—'}</div><div class="market-status">${active?(o.availability&&o.availability!=="unknown"?esc(o.availability):"Price source connected"):'Marketplace connection pending'}</div><div class="market-spec"><span>Product data</span><b>${active?'Available':'Not connected'}</b></div><div class="market-spec"><span>Affiliate</span><b>${active?'Verified link':'Not active'}</b></div>${active?`<a class="market-cta" href="${esc(o.affiliate_url)}" target="_blank" rel="nofollow sponsored noopener">View on ${esc(m.name.replace(/ India$/,''))} ↗</a>`:`<button class="market-cta disabled" disabled>Connection pending</button>`}</article>`}).join("");
track.style.transform=`translateX(-${marketIndex*296}px)`; const max=Math.max(0,ordered.length-3); $("#marketPrev").disabled=marketIndex<=0;$("#marketNext").disabled=marketIndex>=max; $("#storeDots").innerHTML=ordered.map((_,i)=>`<i class="${i===marketIndex?'active':''}"></i>`).join("")}
function selectProduct(p){if(!p)return;selected=p;if(!compareProducts.some(x=>x.id===p.id)){if(compareProducts.length<4)compareProducts.push(p);else compareProducts[0]=p;}marketIndex=0;state.query=`${p.brand} ${p.name}`;$("#dashboardSearchInput").value=state.query;$("#selectedName").textContent=`${p.brand} ${p.name}`;$("#selectedTitle").textContent=p.name;$("#selectedBrand").textContent=p.brand;$("#selectedHighlight").textContent=p.highlight||"Compare the product's key specifications and current connected offers.";$("#selectedImage").src=p.image;$("#selectedImage").alt=`${p.brand} ${p.name}`;$("#specDisplay").textContent=p.display||"—";$("#specProcessor").textContent=p.processor||"—";$("#specCamera").textContent=p.camera||"—";$("#specBattery").textContent=p.battery||"—";$("#specNetwork").textContent=p.network||"—";$("#specWeight").textContent=p.weight||"—";$("#detailsLink").href=`product.html?id=${encodeURIComponent(p.id)}`;$("#priceNote").textContent=p.price_note||scoreText(p);renderVariants(p);renderSpecs(p);renderResults(state.query);renderMarkets(p);renderComparisonMatrix()}
function bind(){["#headerSearch","#dashboardSearch"].forEach(s=>{const f=$(s);if(f)f.onsubmit=e=>{e.preventDefault();const q=$("input",f).value.trim();if(!q)return;state.query=q;const list=findProducts(q);if(list[0])selectProduct(list[0]);else{renderResults(q);go(q)}}});$$('.search-chips button').forEach(b=>b.onclick=()=>{state.query=b.dataset.query;$("#dashboardSearchInput").value=state.query;const list=findProducts(state.query);if(list[0])selectProduct(list[0]);else renderResults(state.query)});$("#marketPrev").onclick=()=>{marketIndex=Math.max(0,marketIndex-1);renderMarkets(selected)};$("#marketNext").onclick=()=>{const max=Math.max(0,marketplaces.length-3);marketIndex=Math.min(max,marketIndex+1);renderMarkets(selected)};$("#addProductBtn").onclick=()=>{$("#dashboardSearchInput").focus();document.querySelector('.search-results')?.scrollIntoView({behavior:'smooth',block:'nearest'})};
  $("#clearComparison").onclick=()=>{if(selected)compareProducts=[selected];renderComparisonMatrix();renderResults(state.query);count()};
  $("#highlightDifferences").onchange=()=>renderComparisonMatrix();
  $("#headerCompare").onclick=e=>{e.preventDefault();$("#smartComparison")?.scrollIntoView({behavior:'smooth',block:'start'})};
  const m=$("#mobileMenuBtn"),n=$("#categoryNav");if(m&&n)m.onclick=()=>n.classList.toggle("mobile-open");addEventListener("storage",count)}
async function init(){count();try{const [dr,or,mr]=await Promise.all([fetch(DATA_URL,{cache:'no-store'}),fetch(OFFER_URL,{cache:'no-store'}),fetch(MARKET_URL,{cache:'no-store'})]);if(!dr.ok||!or.ok||!mr.ok)throw new Error();const d=await dr.json(),od=await or.json(),md=await mr.json();products=d.products||[];offers=od.offers||[];marketplaces=md.marketplaces||[]}catch(e){products=[];offers=[];marketplaces=[]}renderPopular();const initial=products.find(p=>p.id==='mobile-01')||products[0];if(initial){compareProducts=[initial];selectProduct(initial)}else renderResults(state.query);bind()}
init();
})();
