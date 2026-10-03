(async function(){
  const root=document.getElementById('product-detail-app');
  if(!root)return;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let data;
  try{
    data=await fetch('data/product-details-all40.json').then(r=>{
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    });
  }catch(e){
    root.innerHTML='<div class="empty">Product data could not be loaded. Please refresh the page.</div>';
    return;
  }

  const q=new URLSearchParams(location.search);
  const key=(q.get('id')||q.get('slug')||q.get('product')||'').toLowerCase();
  let p=data.products.find(x=>x.id.toLowerCase()===key);
  if(!p){
    const n=key.replace(/-/g,' ');
    p=data.products.find(x=>x.name.toLowerCase()===n);
  }
  if(!p){
    root.innerHTML='<div class="empty">Product not found. Open this page from the Products listing.</div>';
    return;
  }

  document.title=`${p.name} — CompareMitra`;

  const specs=[
    ['Display',p.display],['Processor',p.processor],['Rear / Front Camera',p.camera],
    ['Battery',p.battery],['Charging',p.charging],['Operating System',p.os],
    ['Network',p.network],['Weight',p.weight]
  ];

  const priceLabel=p.price || 'Price pending final refresh';
  const statusText=p.status==='hold_final_refresh'
    ? 'Final SKU/price refresh required before commercial publishing.'
    : `Official/source page checked ${data.updated_on}.`;

  const amazonUrl=p.affiliate?.amazon?.url || '';
  const flipkartUrl=p.affiliate?.flipkart?.url || '';

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
          <div class="pd-price">${esc(priceLabel)}</div>
          <div class="pd-price-note">${esc(p.price_note)}</div>
        </div>

        <div class="pd-actions">
          <a class="pd-btn primary" href="${esc(p.official_url)}" target="_blank" rel="noopener noreferrer">Official ${esc(p.brand)} Price</a>
          ${amazonUrl ? `<a class="pd-btn amazon" data-affiliate="amazon" href="${esc(amazonUrl)}" target="_blank" rel="nofollow sponsored noopener noreferrer">Check Amazon Price</a>` : ''}
          ${flipkartUrl ? `<a class="pd-btn marketplace" data-affiliate="flipkart" href="${esc(flipkartUrl)}" target="_blank" rel="nofollow sponsored noopener noreferrer">Check Flipkart Price</a>` : ''}
          <button class="pd-btn compare" type="button" id="compareBtn">Add to Compare</button>
        </div>

        <div class="pd-affiliate-note">
          <strong>Affiliate disclosure:</strong> Some seller links may be affiliate links. If you purchase after clicking an eligible link, CompareMitra may earn a commission at no extra cost to you.
          <br><span>Amazon Associate disclosure: “As an Amazon Associate I earn from qualifying purchases.”</span>
        </div>

        <div class="pd-source">
          <strong>Data status:</strong> <span class="pd-status">${esc(statusText)}</span><br>
          ${amazonUrl ? 'Amazon tracking link is configured.' : 'Amazon link pending exact SiteStripe-generated product link.'}
          ${flipkartUrl ? ' Flipkart tracking link is configured.' : ' Flipkart affiliate link pending.'}
        </div>
      </section>
    </div>

    <section class="pd-section">
      <div class="pd-panel">
        <h2>Available variants</h2>
        <div class="pd-variants">${p.variants.map(v=>`<span class="pd-variant">${esc(v)}</span>`).join('')}</div>
      </div>
    </section>

    <section class="pd-section">
      <div class="pd-panel">
        <h2>Key specifications</h2>
        <div class="pd-specs">${specs.map(([k,v])=>`<div class="pd-spec"><span class="pd-spec-label">${esc(k)}</span><span class="pd-spec-value">${esc(v||'Pending final verification')}</span></div>`).join('')}</div>
      </div>
    </section>

    <section class="pd-section">
      <div class="pd-panel">
        <h2>Price & source note</h2>
        <p class="pd-highlight">CompareMitra displays an observed price, not a permanent price guarantee. Seller price, stock, offers and exchange benefits can change. Always verify the final amount on the seller page before purchase.</p>
        <a class="pd-btn" href="${esc(p.official_url)}" target="_blank" rel="noopener noreferrer">Open Official ${esc(p.brand)} Page</a>
      </div>
    </section>
  </div>`;

  document.querySelectorAll('[data-affiliate]').forEach(a=>{
    a.addEventListener('click',()=>{
      const marketplace=a.getAttribute('data-affiliate');
      if(window.gtag){
        window.gtag('event','affiliate_click',{
          marketplace,
          product_id:p.id,
          product_name:p.name
        });
      }
    });
  });

  const btn=document.getElementById('compareBtn');
  if(btn)btn.addEventListener('click',()=>{
    let a=JSON.parse(localStorage.getItem('compareMitraSelected')||'[]');
    if(!a.includes(p.id))a.push(p.id);
    if(a.length>2)a.shift();
    localStorage.setItem('compareMitraSelected',JSON.stringify(a));
    if(a.length===2) alert('2 products selected. Open Compare to continue.');
    else alert('1 product selected. Select one more product to compare.');
  });
})();