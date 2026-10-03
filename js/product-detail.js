(async function(){
  const root=document.getElementById('product-detail-app');
  if(!root)return;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let data;
  try{data=await fetch('data/samsung-first4.json').then(r=>r.json())}catch(e){root.innerHTML='<div class="empty">Product data could not be loaded.</div>';return}
  const q=new URLSearchParams(location.search);
  const key=(q.get('id')||q.get('slug')||q.get('product')||'').toLowerCase();
  let p=data.products.find(x=>x.id.toLowerCase()===key||x.slugs.some(s=>s.toLowerCase()===key)||key===x.id.split('-').pop());
  if(!p)p=data.products[0];
  document.title=`${p.name} — CompareMitra`;
  const specs=[['Display',p.display],['Processor',p.processor],['Rear / Front Camera',p.camera],['Battery',p.battery],['Charging',p.charging],['Operating System',p.os],['Network',p.network],['Weight',p.weight]];
  root.innerHTML=`
  <div class="product-detail-wrap">
    <div class="pd-breadcrumb"><a href="products.html">Mobiles</a> / ${esc(p.brand)} / ${esc(p.name)}</div>
    <div class="pd-layout">
      <aside class="pd-media">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="eager">
        <span class="pd-preview">CompareMitra Preview Image</span>
        <div class="pd-muted">Real manufacturer/affiliate image will be added only after an authorized image source is locked.</div>
      </aside>
      <section class="pd-info">
        <div class="pd-brand">${esc(p.brand)}</div>
        <h1 class="pd-title">${esc(p.name)}</h1>
        <p class="pd-highlight">${esc(p.highlight)}</p>
        <div class="pd-pricebox">
          <div class="pd-price">${esc(p.price)}</div>
          <div class="pd-price-note">${esc(p.price_note)}</div>
        </div>
        <div class="pd-actions">
          <a class="pd-btn primary" href="${esc(p.official_url)}" target="_blank" rel="noopener noreferrer">Check Samsung Price</a>
          <button class="pd-btn compare" type="button" id="compareBtn">Add to Compare</button>
        </div>
        <div class="pd-source"><strong>Price status:</strong> <span class="pd-status">Official Samsung India source checked ${esc(data.updated_on)}</span><br>Marketplace affiliate links are not shown until the exact SKU/variant tracking link is generated.</div>
      </section>
    </div>
    <section class="pd-section"><div class="pd-panel"><h2>Available variants</h2><div class="pd-variants">${p.variants.map(v=>`<span class="pd-variant">${esc(v)}</span>`).join('')}</div></div></section>
    <section class="pd-section"><div class="pd-panel"><h2>Key specifications</h2><div class="pd-specs">${specs.map(([k,v])=>`<div class="pd-spec"><span class="pd-spec-label">${esc(k)}</span><span class="pd-spec-value">${esc(v)}</span></div>`).join('')}</div></div></section>
    <section class="pd-section"><div class="pd-panel"><h2>Price & source note</h2><p class="pd-highlight">CompareMitra displays a current observed price, not a permanent price guarantee. Seller price, stock, offers and exchange benefits can change. Always verify the final amount on the seller page before purchase.</p><a class="pd-btn" href="${esc(p.official_url)}" target="_blank" rel="noopener noreferrer">Open Official Samsung Page</a></div></section>
  </div>`;
  document.getElementById('compareBtn').addEventListener('click',()=>{
    let a=JSON.parse(localStorage.getItem('compareMitraSelected')||'[]');
    if(!a.includes(p.id))a.push(p.id);
    if(a.length>2)a.shift();
    localStorage.setItem('compareMitraSelected',JSON.stringify(a));
    if(a.length===2) alert('2 products selected. Compare page integration will use these IDs.');
    else alert('1 product selected. Select one more product to compare.');
  });
})();
