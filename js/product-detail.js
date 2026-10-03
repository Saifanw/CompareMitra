(async function(){
  const root=document.getElementById('product-detail-app');
  if(!root)return;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const load=async path=>{const r=await fetch(path); if(!r.ok) throw new Error('HTTP '+r.status); return r.json();};
  let data, registry;
  try{
    [data,registry]=await Promise.all([load('data/product-details-all40.json'),load('data/marketplace-offers.json')]);
  }catch(e){
    root.innerHTML='<div class="empty">Product data could not be loaded. Please refresh the page.</div>'; return;
  }
  const q=new URLSearchParams(location.search);
  const key=(q.get('id')||q.get('slug')||q.get('product')||'').toLowerCase();
  let p=data.products.find(x=>String(x.id).toLowerCase()===key);
  if(!p){const n=key.replace(/-/g,' '); p=data.products.find(x=>String(x.name).toLowerCase()===n);}
  if(!p){root.innerHTML='<div class="empty">Product not found. Open this page from the Products listing.</div>';return;}
  document.title=`${p.name} — CompareMitra`;

  const normalized=(registry.offers||[]).filter(o=>o.product_id===p.id && o.affiliate_url);
  // Backward compatibility with v1 data while the registry is being migrated.
  if(!normalized.length){
    for(const [marketplace,obj] of Object.entries(p.affiliate||{})){
      if(obj && obj.url) normalized.push({product_id:p.id,marketplace,affiliate_url:obj.url,price:p.price,status:obj.status||'verified_link'});
    }
  }
  const labels={amazon:'Amazon',flipkart:'Flipkart',myntra:'Myntra',ajio:'AJIO','reliance-digital':'Reliance Digital'};
  const specs=[['Display',p.display],['Processor',p.processor],['Rear / Front Camera',p.camera],['Battery',p.battery],['Charging',p.charging],['Operating System',p.os],['Network',p.network],['Weight',p.weight]];
  const buttons=normalized.map((o,i)=>`<a class="pd-btn marketplace ${o.marketplace==='amazon'?'amazon':''}" data-affiliate="${esc(o.marketplace)}" data-offer-index="${i}" href="${esc(o.affiliate_url)}" target="_blank" rel="nofollow sponsored noopener noreferrer">Check ${esc(labels[o.marketplace]||o.marketplace)} Price</a>`).join('');
  const marketplaceStatus=normalized.length?normalized.map(o=>labels[o.marketplace]||o.marketplace).join(', ')+' tracking link(s) configured.':'No verified marketplace affiliate link is configured yet.';
  const statusText=p.status==='hold_final_refresh'?'Final SKU/price refresh required before commercial publishing.':`Source data checkpoint: ${data.updated_on}.`;

  root.innerHTML=`
  <div class="product-detail-wrap">
    <div class="pd-breadcrumb"><a href="products.html">Mobiles</a> / ${esc(p.brand)} / ${esc(p.name)}</div>
    <div class="pd-layout">
      <aside class="pd-media"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="eager"><span class="pd-preview">CompareMitra Preview Image</span><div class="pd-muted">Real manufacturer/affiliate image will be added only after an authorized image source is locked.</div></aside>
      <section class="pd-info">
        <div class="pd-brand">${esc(p.brand)}</div><h1 class="pd-title">${esc(p.name)}</h1><p class="pd-highlight">${esc(p.highlight)}</p>
        <div class="pd-pricebox"><div class="pd-price">${esc(p.price||'Price pending final refresh')}</div><div class="pd-price-note">${esc(p.price_note||'Verify the final seller price before purchase.')}</div></div>
        <div class="pd-actions"><a class="pd-btn primary" href="${esc(p.official_url)}" target="_blank" rel="noopener noreferrer">Official ${esc(p.brand)} Price</a>${buttons}<button class="pd-btn compare" type="button" id="compareBtn">Add to Compare</button></div>
        <div class="pd-affiliate-note"><strong>Affiliate disclosure:</strong> Some seller links may be affiliate links. If you purchase after clicking an eligible link, CompareMitra may earn a commission at no extra cost to you.<br><span>Amazon Associate disclosure: “As an Amazon Associate I earn from qualifying purchases.”</span></div>
        <div class="pd-source"><strong>Data status:</strong> <span class="pd-status">${esc(statusText)}</span><br>${esc(marketplaceStatus)}</div>
      </section>
    </div>
    <section class="pd-section"><div class="pd-panel"><h2>Available variants</h2><div class="pd-variants">${(p.variants||[]).map(v=>`<span class="pd-variant">${esc(v)}</span>`).join('')}</div></div></section>
    <section class="pd-section"><div class="pd-panel"><h2>Key specifications</h2><div class="pd-specs">${specs.map(([k,v])=>`<div class="pd-spec"><span class="pd-spec-label">${esc(k)}</span><span class="pd-spec-value">${esc(v||'Pending final verification')}</span></div>`).join('')}</div></div></section>
    <section class="pd-section"><div class="pd-panel"><h2>Marketplace engine</h2><p class="pd-highlight">CompareMitra uses a normalized marketplace registry so the same product page can support Amazon, Flipkart and other approved affiliate/deep-link sources without creating separate HTML pages.</p><p class="pd-highlight">Seller price, stock, offers and exchange benefits can change. Verify the final amount on the seller page before purchase.</p></div></section>
  </div>`;

  root.querySelectorAll('[data-affiliate]').forEach(a=>a.addEventListener('click',()=>{
    const marketplace=a.getAttribute('data-affiliate');
    const payload={marketplace,product_id:p.id,product_name:p.name};
    if(window.gtag)window.gtag('event','affiliate_click',payload);
    try{const key='compareMitraAffiliateClicks';const arr=JSON.parse(localStorage.getItem(key)||'[]');arr.push({...payload,ts:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(arr.slice(-500)));}catch(_e){}
  }));
  const btn=document.getElementById('compareBtn');
  if(btn)btn.addEventListener('click',()=>{let a=JSON.parse(localStorage.getItem('compareMitraSelected')||'[]');if(!a.includes(p.id))a.push(p.id);if(a.length>2)a.shift();localStorage.setItem('compareMitraSelected',JSON.stringify(a));alert(a.length===2?'2 products selected. Open Compare to continue.':'1 product selected. Select one more product to compare.');});
})();
