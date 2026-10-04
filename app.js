const CM={products:[],loaded:false};

async function loadCompareMitraProducts(){
  if(CM.loaded) return CM.products;
  const res=await fetch('data/products.json',{cache:'no-store'});
  if(!res.ok) throw new Error('Could not load product database');
  const data=await res.json();
  CM.products=Array.isArray(data)?data:data.products||[];
  CM.loaded=true;
  window.state={products:CM.products};
  return CM.products;
}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function money(v){if(v==null||v==='')return 'Price not verified'; return esc(v);}
function imageFor(p){return esc((p.image&&p.image.primary)||'assets/logo.svg');}
function specsLine(p){const s=p.specs||{}; return [s.display,s.processor,s.ram_storage].filter(Boolean).slice(0,3).join(' • ');}
function productCard(p){
 const preview=(p.data_status||'').includes('preview')||((p.image||{}).source_type==='temporary_comparemitra_placeholder');
 return `<article class="card product-card cm-product-card">
   <a class="product-img product-image-wrap" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="View ${esc(p.name)}"><img src="${imageFor(p)}" alt="${esc(p.name)}" loading="lazy"><span class="image-badge">${preview?'Preview':''}</span></a>
   <div class="brand">${esc(p.brand)}</div>
   <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
   <p class="product-mini">${esc(specsLine(p)||'Specifications being verified')}</p>
   <span class="price-label">${preview?'Observed price':'Current price'}</span>
   <div class="price">${money(p.india?.price_inr)}</div>
   <div class="card-actions"><a class="card-btn" href="product.html?id=${encodeURIComponent(p.id)}">View details</a><button class="card-btn compare" onclick="addCompare('${esc(p.id)}')">Compare</button></div>
 </article>`;
}
function renderProducts(list,id='product-grid'){
 const e=document.getElementById(id); if(!e)return;
 e.innerHTML=list.length?list.map(productCard).join(''):`<div class="empty" style="grid-column:1/-1">No matching products found.</div>`;
 const count=document.getElementById('product-count'); if(count) count.textContent=`${list.length} product${list.length===1?'':'s'} found`;
}
function getCompare(){return JSON.parse(localStorage.getItem('compareMitraSelected')||'[]');}
function addCompare(id){let a=getCompare(); if(!a.includes(id))a.push(id); if(a.length>4)a.shift(); localStorage.setItem('compareMitraSelected',JSON.stringify(a)); if(a.length>=2) location.href=`compare.html?ids=${a.map(encodeURIComponent).join(',')}`; else alert('1 product selected. Select one more product to compare.');}
function removeCompare(id){const a=getCompare().filter(x=>x!==id);localStorage.setItem('compareMitraSelected',JSON.stringify(a)); location.reload();}
window.addCompare=addCompare; window.removeCompare=removeCompare; window.renderProducts=renderProducts;

function wireSearch(){document.querySelectorAll('[data-search]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const q=new FormData(f).get('q')?.trim();location.href=`products.html${q?'?q='+encodeURIComponent(q):''}`;}));}

async function initProductsPage(){
 const products=await loadCompareMitraProducts(); wireSearch();
 const params=new URLSearchParams(location.search),q=(params.get('q')||'').toLowerCase(),brand=params.get('brand')||'';
 const brandSelect=document.getElementById('brand-filter');
 if(brandSelect){[...new Set(products.map(p=>p.brand))].sort().forEach(b=>{const o=document.createElement('option');o.value=b;o.textContent=b;brandSelect.appendChild(o)});brandSelect.value=brand;}
 const search=document.getElementById('catalog-search'); if(search){search.value=params.get('q')||'';search.addEventListener('input',()=>applyFilters(products));}
 ['brand-filter','price-filter','sort-filter'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>applyFilters(products)));
 document.getElementById('clear-filters')?.addEventListener('click',()=>{if(search)search.value=''; if(brandSelect)brandSelect.value=''; document.getElementById('price-filter').value=''; document.getElementById('sort-filter').value='featured'; applyFilters(products);});
 applyFilters(products);
}
function applyFilters(products){
 const q=(document.getElementById('catalog-search')?.value||'').toLowerCase().trim();
 const b=document.getElementById('brand-filter')?.value||''; const pf=document.getElementById('price-filter')?.value||''; const sort=document.getElementById('sort-filter')?.value||'featured';
 let list=products.filter(p=>{const text=`${p.name} ${p.brand} ${p.category}`.toLowerCase(); if(q&&!text.includes(q))return false; if(b&&p.brand!==b)return false; const n=parseInt(String(p.india?.price_inr||'').replace(/[^0-9]/g,''),10)||0; if(pf==='under20'&&(!n||n>=20000))return false; if(pf==='20to40'&&(!n||n<20000||n>40000))return false; if(pf==='40to60'&&(!n||n<40000||n>60000))return false; if(pf==='60plus'&&(!n||n<60000))return false; return true;});
 list.sort((a,b)=>{const pa=parseInt(String(a.india?.price_inr||'').replace(/[^0-9]/g,''),10)||99999999,pb=parseInt(String(b.india?.price_inr||'').replace(/[^0-9]/g,''),10)||99999999; if(sort==='priceLow')return pa-pb;if(sort==='priceHigh')return pb-pa;if(sort==='name')return a.name.localeCompare(b.name);return a.id.localeCompare(b.id);});
 renderProducts(list);
}

async function initProductDetail(){
 const products=await loadCompareMitraProducts(); wireSearch(); const id=new URLSearchParams(location.search).get('id'); const p=products.find(x=>x.id===id)||products[0]; const e=document.getElementById('product-detail'); if(!p||!e)return;
 document.title=`${p.name} — CompareMitra`;
 const s=p.specs||{}, i=p.image||{}, india=p.india||{};
 e.innerHTML=`<div class="product-detail-head"><div class="detail-image"><img src="${imageFor(p)}" alt="${esc(p.name)}"><span class="image-badge">Development preview</span></div><div><span class="badge">${esc(p.brand)}</span><h1>${esc(p.name)}</h1><p class="muted">${esc(p.verification_note||'Product information is being verified.')}</p><div class="price-box"><span>Observed India price</span><strong>${money(india.price_inr)}</strong><small>Checked: ${esc(india.price_checked_on||'Not verified')} · Recheck before purchase</small></div><div class="detail-actions"><button class="primary cm-primary" onclick="addCompare('${esc(p.id)}')">Add to Compare</button>${india.source_url?`<a class="card-btn" href="${esc(india.source_url)}" target="_blank" rel="noopener">Official source</a>`:''}</div></div></div><div class="notice" style="margin:24px 0">This is the CompareMitra development database. Prices, availability and images are not yet commercial-launch locked.</div><section class="section" style="padding-left:0;padding-right:0"><div class="section-head"><div><h2>Key specifications</h2><p class="muted">Verified fields are shown; missing fields are intentionally not guessed.</p></div></div><div class="table-wrap"><table><tbody>${[['Display',s.display],['Processor',s.processor],['RAM / Storage',s.ram_storage],['Rear camera',s.rear_camera],['Front camera',s.front_camera],['Battery',s.battery],['Charging',s.charging],['Operating system',s.os],['Network',s.network],['IP rating',s.ip_rating]].map(([k,v])=>`<tr><th>${k}</th><td>${esc(v||'Not yet verified')}</td></tr>`).join('')}</tbody></table></div></section>`;
}

async function initComparePage(){
 const products=await loadCompareMitraProducts(); wireSearch(); const e=document.getElementById('comparison-detail'); if(!e)return;
 const q=new URLSearchParams(location.search); let ids=(q.get('ids')||'').split(',').filter(Boolean); if(!ids.length)ids=getCompare(); ids=[...new Set(ids)].slice(0,4); const selected=ids.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 if(selected.length<2){e.innerHTML=`<div class="empty card">Select at least two products from the <a class="link" href="products.html">Products page</a> to compare.</div>`;return;}
 const rows=[['Brand',p=>p.brand],['Observed price',p=>p.india?.price_inr||'Not verified'],['Display',p=>p.specs?.display],['Processor',p=>p.specs?.processor],['RAM / Storage',p=>p.specs?.ram_storage],['Rear camera',p=>p.specs?.rear_camera],['Front camera',p=>p.specs?.front_camera],['Battery',p=>p.specs?.battery],['Charging',p=>p.specs?.charging],['OS',p=>p.specs?.os],['Network',p=>p.specs?.network],['IP rating',p=>p.specs?.ip_rating]];
 e.innerHTML=`<div class="notice">Development comparison: current prices and commercial image rights are not locked yet.</div><div class="compare-toolbar"><a class="card-btn" href="products.html">Add / change products</a><button class="card-btn" onclick="localStorage.removeItem('compareMitraSelected');location.href='products.html'">Clear comparison</button></div><div class="table-wrap"><table class="compare-table"><thead><tr><th>Feature</th>${selected.map(p=>`<th><img class="compare-thumb" src="${imageFor(p)}" alt=""><div>${esc(p.name)}</div><button class="remove-compare" onclick="removeCompare('${esc(p.id)}')">Remove</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th>${label}</th>${selected.map(p=>`<td>${esc(fn(p)||'Not yet verified')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

document.addEventListener('DOMContentLoaded',()=>{const path=location.pathname; loadCompareMitraProducts().then(()=>{if(document.getElementById('product-grid'))initProductsPage();else if(document.getElementById('product-detail'))initProductDetail();else if(document.getElementById('comparison-detail'))initComparePage();else wireSearch();}).catch(err=>{console.error(err);const e=document.querySelector('.page .container');if(e)e.insertAdjacentHTML('afterbegin','<div class="notice">Product database could not be loaded. Check that <strong>data/products.json</strong> exists in GitHub.</div>');});});
