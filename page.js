const $=id=>document.getElementById(id);
const esc=v=>String(v??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const qs=new URLSearchParams(location.search);
const page=location.pathname.split("/").pop().replace(".html","");
const toast=m=>{const t=$("toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),2600)};
const configs={
 members:{pk:"member_id",title:"Member",form:"memberForm.html",cols:[["member_id","ID"],["name","Member"],["email","Email"],["phone","Phone"],["join_date","Join date"],["status","Status"],["trainer_name","Trainer"]],search:["name","email","phone","trainer_name"]},
 trainers:{pk:"trainer_id",title:"Trainer",form:"trainerForm.html",cols:[["trainer_id","ID"],["trainer_name","Trainer"],["email","Email"],["phone","Phone"],["specialization","Specialization"]],search:["trainer_name","email","specialization"]},
 plans:{pk:"plan_id",title:"Plan",form:"planForm.html",cols:[["plan_id","ID"],["plan_name","Plan"],["duration_months","Duration (months)"],["fee","Fee (₹)"],["description","Description"]],search:["plan_name","description"]},
 subscriptions:{pk:"subscription_id",title:"Subscription",form:"subscriptionForm.html",cols:[["subscription_id","ID"],["member_name","Member"],["plan_name","Plan"],["start_date","Start date"],["end_date","Expiry date"],["payment_status","Payment"]],search:["member_name","plan_name","payment_status"]}
};
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json"},...opt});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||"Request failed");return d}
function pill(v){const cl=String(v||"").toLowerCase();return `<span class="pill ${esc(cl)}">${esc(v)}</span>`}
document.querySelectorAll(".nav-link").forEach(a=>{if(a.getAttribute("href")===location.pathname.split("/").pop())a.classList.add("active")});
const globalSearch=$("global-search");
if(globalSearch){
 globalSearch.addEventListener("keydown",e=>{if(e.key==="Enter"){const q=globalSearch.value.trim();if(!q)return;sessionStorage.setItem("gymflowSearch",q);location.href="members.html"}});
 document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();globalSearch.focus()}});
}
async function loadDashboard(){
 try{
  const d=await api("/api/dashboard");
  [["member-count",d.members],["active-count",d.active],["trainer-count",d.trainers],["plan-count",d.plans]].forEach(([id,n])=>{const el=$(id);if(!el)return;const target=Number(n)||0;let start=0;const step=Math.max(1,Math.ceil(target/18));const timer=setInterval(()=>{start=Math.min(target,start+step);el.textContent=start.toLocaleString("en-IN");if(start>=target)clearInterval(timer)},25)});
  const rev=$("revenue-count");if(rev)rev.textContent="₹"+Number(d.revenue||0).toLocaleString("en-IN");
  const exp=$("expiring-list");if(exp)exp.innerHTML=(d.expiring||[]).length?`<table><thead><tr><th>MEMBER</th><th>PLAN</th><th>END DATE</th></tr></thead><tbody>${d.expiring.map(x=>`<tr><td class="item-name">${esc(x.member_name)}</td><td>${esc(x.plan_name)}</td><td>${esc(x.end_date)}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">No subscriptions expiring in the next 15 days.</div>';
  $("recent-list").innerHTML=d.recent.length?`<table><thead><tr><th>MEMBER</th><th>PLAN</th><th>START DATE</th><th>EXPIRY</th><th>PAYMENT</th></tr></thead><tbody>${d.recent.map(x=>`<tr><td class="item-name">${esc(x.member_name)}</td><td>${esc(x.plan_name)}</td><td>${esc(x.start_date)}</td><td>${esc(x.end_date)}</td><td>${pill(x.payment_status)}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">No subscriptions yet. Add your first member subscription to see activity here.</div>';
 }catch(e){$("recent-list").innerHTML=`<div class="empty">${esc(e.message)}. Check that MySQL and the Node server are running.</div>`}
}
let cached=[];
async function loadList(){
 const c=configs[page];try{cached=await api(`/api/${page}`);renderList();const saved=sessionStorage.getItem("gymflowSearch");if(saved&&$("record-search")){$("record-search").value=saved;sessionStorage.removeItem("gymflowSearch");renderList()}}catch(e){$("records-table").innerHTML=`<div class="empty">${esc(e.message)}. Check your database connection.</div>`}
}
function renderList(){
 const c=configs[page],q=($("record-search")?.value||"").toLowerCase();
 const rows=cached.filter(r=>c.search.some(k=>String(r[k]??"").toLowerCase().includes(q)));
 $("record-total").textContent=`${rows.length} ${rows.length===1?"record":"records"}`;
 $("records-table").innerHTML=rows.length?`<table><thead><tr>${c.cols.map(x=>`<th>${esc(x[1])}</th>`).join("")}<th>ACTIONS</th></tr></thead><tbody>${rows.map(r=>`<tr>${c.cols.map(([k])=>`<td>${k==="status"||k==="payment_status"?pill(r[k]):esc(k==="fee"?"₹"+Number(r[k]).toLocaleString("en-IN"):r[k])}</td>`).join("")}<td><a class="action-btn" href="viewRecord.html?type=${page}&id=${r[c.pk]}">View</a><a class="action-btn" href="${c.form}?id=${r[c.pk]}">Edit</a><button class="action-btn delete" onclick="removeRecord(${r[c.pk]})">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">No matching records. Try a different search or add a new record.</div>';
}
window.removeRecord=async id=>{if(!confirm("Delete this record? This action cannot be undone."))return;try{const d=await api(`/${"api"}/${page}/${id}`,{method:"DELETE"});toast(d.message);loadList()}catch(e){toast(e.message)}};
if(configs[page]){loadList();$("record-search")?.addEventListener("input",renderList)}
if(page==="index")loadDashboard();

async function setupForm(){
 const form=$("record-form");if(!form)return;const r=form.dataset.resource,id=qs.get("id");
 let options={members:[],trainers:[],plans:[]};try{options=await api("/api/options")}catch(e){}
 const fill=(name,rows,placeholder)=>{const el=form.elements[name];if(!el)return;const prior=el.value;el.innerHTML=`<option value="">${placeholder}</option>`+rows.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join("");if(prior)el.value=prior};
 if(r==="members"){fill("trainer_id",options.trainers,"No trainer assigned");form.elements.status.innerHTML=["Active","Inactive"].map(x=>`<option value="${x}">${x}</option>`).join("")}
 if(r==="subscriptions"){fill("member_id",options.members,"Select a member");fill("plan_id",options.plans,"Select a membership plan");form.elements.payment_status.innerHTML=["Pending","Paid","Failed"].map(x=>`<option value="${x}">${x}</option>`).join("")}
 if(id){try{const item=await api(`/api/${r}/${id}`);$("form-heading").textContent=`Edit ${configs[r].title.toLowerCase()}`;form.querySelector('button[type="submit"]').textContent="Save changes ↗";for(const [k,v] of Object.entries(item)){if(form.elements[k])form.elements[k].value=v??""}}catch(e){$("form-message").textContent=e.message}}
 // Convenience: calculate expiry from selected plan duration when creating a subscription.
 if(r==="subscriptions"&&!id){const plan=form.elements.plan_id,start=form.elements.start_date,end=form.elements.end_date;const durations=await api("/api/plans").catch(()=>[]);const updateEnd=()=>{const p=durations.find(x=>String(x.plan_id)===String(plan.value));if(p&&start.value){const d=new Date(start.value+"T12:00:00");d.setMonth(d.getMonth()+Number(p.duration_months));end.value=new Date(d.getTime()-86400000).toISOString().slice(0,10)}};plan.addEventListener("change",updateEnd);start.addEventListener("change",updateEnd)}
 form.addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));for(const k of ["trainer_id","member_id","plan_id"])if(data[k]==="")data[k]=null;try{const d=await api(`/api/${r}${id?"/"+id:""}`,{method:id?"PUT":"POST",body:JSON.stringify(data)});$("form-message").textContent=d.message;$("form-message").className="form-message success";setTimeout(()=>location.href=`${r}.html`,650)}catch(err){$("form-message").textContent=err.message;$("form-message").className="form-message error"}});
}
setupForm();
async function setupView(){if(page!=="viewRecord")return;const type=qs.get("type"),id=qs.get("id"),c=configs[type];if(!c)return;try{const item=await api(`/api/${type}/${id}`);$("view-heading").textContent=`${c.title} #${id}`;$("back-link").href=`${type}.html`;$("edit-link").href=`${c.form}?id=${id}`;$("view-content").innerHTML=Object.entries(item).map(([k,v])=>`<div class="detail"><span>${esc(k.replaceAll("_"," ").toUpperCase())}</span><strong>${esc(v)}</strong></div>`).join("")}catch(e){$("view-content").innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
setupView();
