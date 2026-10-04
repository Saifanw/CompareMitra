(() => {
  const DATA="data/product-details-all40.json";
  let products=[];
  let active=null;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const stores=[
    {id:"amazon",name:"Amazon",className:"amazon",status:"Connected",color:"amazon"},
    {id:"flipkart",name:"Flipkart",className:"flipkart",status:"Not connected"},
    {id:"meesho",name:"Meesho",className:"meesho",status:"Not connected"},
    {id:"myntra",name:"Myntra",className:"myntra",status:"Not connected"},
    {id:"reliance",name:"Reliance Digital",className:"reliance",status:"Not connected"},
    {id:"croma",name:"Croma",className:"croma",status:"Not connected"}
  ];

  function price(p){
    if(!p) return "";
    if(typeof p==="number") return "₹"+p.toLocaleString("en-IN");
    return String(p);
  }
  function getSpecs(p){
    const s=p.specs||p.specifications||{};
    const flat={};
    Object.entries(s).forEach(([k,v])=>flat[k.toLowerCase()]=v);
    const text=(keys,fallback="—")=>{
      for(const k of keys){if(flat[k]!==undefined && flat[k]!==null && flat[k]!=="") return flat[k]}
      return fallback;
    };
    return {
      "Display":text(["display","screen"]),
      "Processor":text(["processor","chipset"]),
      "RAM & Storage":(p.variants||[]).join(" • ")||text(["ram & storage","ram","storage"]),
      "Camera":text(["camera","rear camera","camera (rear)"]),
      "Battery":text(["battery"]),
      "Charging":text(["charging","fast charging"]),
      "5G Support":text(["5g","5g support"],"Yes"),
      "Weight":text(["weight"])
    };
  }
  function find(q){
    const x=q.toLowerCase().trim();
    if(!x) return null;
    return products.find(p=>p.name?.toLowerCase()===x) ||
      products.find(p=>p.name?.toLowerCase().includes(x)) ||
      products.find(p=>x.includes(p.name?.toLowerCase()));
  }
  function affiliateUrl(p, id){
    const a=p.affiliate?.[id] || p.marketplaces?.[id] || p.offers?.[id];
    if(typeof a==="string") return a;
    if(a && typeof a==="object") return a.url || a.affiliate_url || a.link || null;
    return null;
  }
  function marketplaceData(p,id){
    const offers=p.marketplace_offers||p.marketplaceOffers||p.offers||{};
    const x=offers[id];
    if(!x) return null;
    return typeof x==="string"?{url:x}:x;
  }
  function render(p){
    active=p;
    $("#emptyState").hidden=true;
    $("#productResult").hidden=false;
    $("#productImg").src=p.image||"assets/product-images/1.svg";
    $("#productImg").alt=p.name||"Product";
    $("#productBrand").textContent=p.brand||"";
    $("#productName").textContent=p.name||"";
    $("#productVariant").textContent=(p.variants||[]).join("  |  ")+"  |  5G Smartphone";
    const s=getSpecs(p);
    $("#quickSpecs").innerHTML=[
      ["DISPLAY",s["Display"]],["PROCESSOR",s["Processor"]],["CAMERA",s["Camera"]],["BATTERY",s["Battery"]]
    ].map(x=>`<div class="quick-spec"><small>${esc(x[0])}</small><b>${esc(x[1])}</b></div>`).join("");

    const head=$("#storeHead");
    head.innerHTML="<th>FEATURE</th>"+stores.map(st=>`<th><span class="store-logo">${esc(st.name)}</span><span class="store-status">${st.id==="amazon"?"Connected":"Not connected"}</span></th>`).join("");
    const rows=[];
    const basePrice=price(p.price);
    const amazon=marketplaceData(p,"amazon");
    rows.push(["Price",basePrice, ...stores.slice(1).map(()=> "—")]);
    Object.entries(s).forEach(([k,v])=>rows.push([k,v,...stores.slice(1).map(()=>v)]));
    $("#tableBody").innerHTML=rows.map((r,ri)=>{
      const cells=r.slice(1).map((v,ci)=>{
        const st=stores[ci];
        if(ri===0 && st.id==="amazon"){
          const url=affiliateUrl(p,"amazon") || amazon?.url;
          return `<td><span class="store-price">${esc(basePrice)}</span>${url?`<a class="store-btn" target="_blank" rel="nofollow sponsored noopener" href="${esc(url)}">Check price ↗</a>`:"<span class='unavailable'>Link pending</span>"}</td>`;
        }
        if(ri===0 && st.id!=="amazon") return `<td><span class="unavailable">—</span></td>`;
        if(st.id!=="amazon" && ri>0) return `<td><span class="unavailable">—</span></td>`;
        return `<td class="feature-label">${esc(v)}</td>`;
      }).join("");
      return `<tr><td>${esc(r[0])}</td>${cells}</tr>`;
    }).join("");
  }
  function search(q){
    const p=find(q);
    if(p) render(p);
    else {
      $("#emptyState").hidden=false;$("#productResult").hidden=true;
      const h=$("#emptyState h2"); if(h) h.textContent=q.trim()?`No verified product found for “${q.trim()}”`:"Search once. See everything.";
    }
  }
  function submit(form,input){
    form.addEventListener("submit",e=>{e.preventDefault();search(input.value);window.scrollTo({top:0,behavior:"smooth"});});
  }
  async function init(){
    try{
      const r=await fetch(DATA,{cache:"no-store"}); const d=await r.json();
      products=Array.isArray(d)?d:(d.products||[]);
    }catch(e){products=[]}
    submit($("#topSearch"),$("#topInput")); submit($("#heroSearch"),$("#heroInput"));

    // If the browser restored a search value, render it immediately.
    // This also makes a direct homepage visit with a prefilled search feel alive.
    const restoredQuery = ($("#heroInput").value || $("#topInput").value || "").trim();
    if (restoredQuery && products.length) {
      $("#heroInput").value = restoredQuery;
      $("#topInput").value = restoredQuery;
      search(restoredQuery);
    }
    document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>{$("#heroInput").value=b.dataset.q;search(b.dataset.q)}));
    $("#clearBtn").addEventListener("click",()=>{active=null;$("#productResult").hidden=true;$("#emptyState").hidden=false;$("#heroInput").value="";});
    $("#highlightBtn").addEventListener("click",()=>{document.querySelectorAll("#compareTable tbody td").forEach(td=>td.classList.toggle("diff"));$("#highlightBtn").classList.toggle("active")});
    $("#moreStores").addEventListener("click",()=>alert("More marketplace connectors will appear here as verified affiliate/store integrations are added."));
    $("#addCompare").addEventListener("click",()=>{if(active){let a=[];try{a=JSON.parse(localStorage.getItem("comparemmitra_compare")||"[]")}catch{};if(!a.includes(active.id))a.push(active.id);localStorage.setItem("comparemmitra_compare",JSON.stringify(a));$("#compareCount").textContent=a.length;}});
    try{$("#compareCount").textContent=JSON.parse(localStorage.getItem("comparemmitra_compare")||"[]").length}catch{}
  }
  init();
})();