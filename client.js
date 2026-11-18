export const $=(s,root=document)=>root.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>Number(n||0).toLocaleString('vi-VN')+' ₫';
export const date=d=>new Date(d).toLocaleString('vi-VN');
export const status={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',processing:'Đang chuẩn bị',received:'Đã nhận hàng',cancelling:'Đang hủy',ready:'Sẵn sàng nhận tại cửa hàng',shipping:'Đang giao hàng',completed:'Hoàn tất',cancelled:'Đã hủy',returned:'Đã trả hàng',approved:'Đã duyệt',rejected:'Từ chối',unpaid:'Chưa thanh toán',paid:'Đã thu tiền',refunded:'Đã ghi nhận hoàn tiền'};
export const label=s=>status[s]||s;
export async function api(url,method='GET',body){const r=await fetch('/api'+url,{method,headers:{'Content-Type':'application/json','X-Session-Scope':['manager','employee'].includes(document.body.dataset.role)?document.body.dataset.role:'customer'},credentials:'same-origin',cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok){const error=Error(data.error||'Không thể kết nối máy chủ');error.status=r.status;throw error;}return data;}
export function toast(s){let el=$('#live-toast');if(!el){el=document.createElement('div');el.id='live-toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=s;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,5000);}
export const button=(title,action,id='',cls='')=>`<button type="button" class="btn ${cls}" data-action="${action}" data-id="${esc(id)}">${esc(title)}</button>`;
export const field=(name,title,value='',type='text',extra='')=>`<label class="live-field">${esc(title)}<input name="${name}" type="${type}" value="${esc(value)}" required ${extra}></label>`;
export const select=(name,title,values,value='')=>`<label class="live-field">${esc(title)}<select name="${name}" aria-label="${esc(title)}">${values.map(([id,t])=>`<option value="${esc(id)}" ${String(value)===String(id)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
export function modal(title,html){let d=$('#live-dialog');if(!d){d=document.createElement('dialog');d.id='live-dialog';document.body.append(d);}d.innerHTML=`<header><h2>${esc(title)}</h2><button type="button" class="btn" id="modal-close" aria-label="Đóng">✕</button></header>${html}`;$('#modal-close',d).onclick=()=>d.close();if(!d.open)d.showModal();return d;}
export function formDialog(title,html,submit,saveText='Lưu'){const d=modal(title,`<form class="live-form">${html}<p class="form-error" role="alert"></p><button class="btn pri" type="submit">${esc(saveText)}</button></form>`);$('form',d).onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=$('[type=submit]',f);btn.disabled=true;try{await submit(Object.fromEntries(new FormData(f)),d);if($("form",d)===f)d.close();}catch(err){$('.form-error',f).textContent=err.message;}finally{btn.disabled=false;}};return d;}
export function login(after,managerOnly=false,register=false){formDialog(register?'Tạo tài khoản khách hàng':'Đăng nhập',`${register?field('name','Họ tên')+field('phone','Số điện thoại','','tel'):''}${field('email','Email',document.body.dataset.role==='employee'?'staff.q1@v0tech.vn':managerOnly?'manager.q1@v0tech.vn':'nam@example.com','email')}${field('password','Mật khẩu','','password','minlength="8" autocomplete="current-password"')}<p class="live-muted">Tài khoản kiểm thử: ${document.body.dataset.role==='employee'?'staff.q1@v0tech.vn / staff.td@v0tech.vn':managerOnly?'manager.q1@v0tech.vn / manager.td@v0tech.vn':'nam@example.com / ha@example.com'}<br>Mật khẩu: Demo@12345</p>${!managerOnly?button(register?'Đã có tài khoản':'Tạo tài khoản','toggle-register'):''}`,async b=>{await api('/auth/'+(register?'register':'login'),'POST',b);await after();},register?'Đăng ký':'Đăng nhập');const t=$('[data-action=toggle-register]');if(t)t.onclick=()=>login(after,false,!register);}
export function table(headers,rows){return `<div class="card live-table"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(c=>`<tr>${c.map(v=>`<td>${v}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">Chưa có dữ liệu</td></tr>`}</tbody></table></div>`;}
export function orderDetail(o){return `<p><strong>${esc(o.code)}</strong> · ${esc(o.store_name)} · ${esc(orderStatusLabel(o))}</p><p>${esc(o.customer_name)} · ${esc(o.phone)}<br>${o.fulfillment==='pickup'?'Nhận tại cửa hàng':'Giao hàng: '+esc(o.address)}<br>${esc(paymentLabel(o.payment_method))} · ${esc(label(o.payment_status))}</p>${table(['Sản phẩm','SL','Giá'],o.items.map(i=>[esc(i.name),i.quantity,money(i.price)]))}<p>Tạm tính: ${money(o.subtotal)} · Giảm: ${money(o.discount)}${o.promo_code?' ('+esc(o.promo_code)+')':''}<br><strong>Tổng: ${money(o.total)}</strong></p><h3>Lịch sử xử lý</h3><ol class="timeline">${o.history.map(h=>`<li>${date(h.created_at)} · ${esc(label(h.status))}<br>${esc(h.actor)}: ${esc(h.note)}</li>`).join('')}</ol>${o.requests.length?'<h3>Yêu cầu của khách</h3>'+o.requests.map(r=>`<p>${r.type==='cancel'?'Hủy đơn':'Trả hàng'} · ${esc(r.type==='cancel'&&o.status==='cancelling'?'Đã chấp nhận hủy, chờ hoàn tất':({pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Từ chối'})[r.status]||r.status)}: ${esc(r.reason)}<br>${esc(r.note)}</p>`).join(''):''}`;}



// Customer order cards retain the original .ord / .oh / .steps presentation.
// The three visible milestones summarize real backend events, never advance orders.
export function customerCanCancel(order){return order.channel!=='offline'&&['pending','confirmed','processing','ready','shipping','received'].includes(order.status)&&(order.payment_method!=='cash'||order.payment_status==='unpaid');}
export const paymentLabel=method=>({cash:'Thanh toán khi nhận hàng (COD)',card:'Visa/Credit Card (mô phỏng)',bank_transfer:'Internet Banking/QR (mô phỏng)'}[method]||method);
export function customerOrderProgress(order) {
  const history = order.history || [];
  const pickup = order.fulfillment === 'pickup';
  const terminal = ['cancelled', 'returned'].includes(order.status);
  const latest = status => [...history].reverse().find(h => h.status === status)?.created_at;
  if (order.status === 'cancelling') return [{text:'Cửa hàng đã chấp nhận hủy',reached:true,terminal:false,at:latest('cancelling') || null}];
  if (terminal) return [{
    text: order.status === 'cancelled' ? 'Đã hủy đơn hàng' : 'Đã trả hàng',
    reached: true, terminal: true, at: latest(order.status) || null
  }];
  const stage = {pending:0,confirmed:0,processing:0,ready:0,shipping:0,received:1,completed:2}[order.status] ?? -1;
  return [
    {text:order.status==='pending'?'Chờ xác nhận':'Đã xác nhận',reached:stage>=0,at:history.find(h=>h.status==='confirmed')?.created_at||order.created_at||null},
    {text:'Đã nhận hàng',reached:stage>=1,at:history.find(h=>h.status==='received')?.created_at||null},
    {text:'Hoàn tất',reached:stage>=2,at:latest('completed')||null}
  ];
}
export const pendingCancellation = order => (order.requests || []).find(r => r.type === 'cancel' && r.status === 'pending');
export const orderStatusLabel = order => order.status==='cancelling' ? 'Đang hủy' : pendingCancellation(order) && !['cancelled','returned','completed'].includes(order.status) ? 'Chờ duyệt hủy' : label(order.status);
export function customerOrderCard(order) {
  const statusClass = ['cancelled', 'returned'].includes(order.status) ? 's3' : order.status === 'completed' ? 's2' : ['shipping', 'ready'].includes(order.status) ? 's1' : 's0';
  const progress = customerOrderProgress(order);
  const requests = order.requests || [];
  const requestLabel = value => ({pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối'}[value] || value);
  const controls = [
    customerCanCancel(order) && !requests.some(r => r.type === 'cancel') ? `<button class="btn-secondary" data-action="cancel" data-id="${esc(order.id)}">Yêu cầu hủy</button>` : '',
    order.status === 'completed' && !requests.some(r => r.type === 'return') ? `<button class="btn-secondary" data-action="return" data-id="${esc(order.id)}">Yêu cầu trả hàng</button>` : '',
    order.payment_method!=='cash'&&order.status==='pending'&&order.payment_status==='unpaid'?`<button class="btn-secondary" data-action="pay-simulate" data-id="${esc(order.id)}">Thanh toán mô phỏng</button>`:''
  ].join('');
  return `<div class="ord" data-order-code="${esc(order.code)}">
    <div class="oh"><b>Mã đơn: <span style="color:var(--brand-primary)">${esc(order.code)}</span></b><span class="tag ${statusClass}">${esc(orderStatusLabel(order))}</span></div>
    <ol class="steps" aria-label="Lộ trình đơn hàng">${progress.map(step => `<li class="${step.reached ? 'on' : ''}${step.terminal ? ' bad' : ''}"><span>${esc(step.text)}</span><small>${step.at && step.reached ? date(step.at) : step.reached ? 'Đã qua bước này' : 'Đang chờ'}</small></li>`).join('')}</ol>
    <div class="customer-order-recipient">Đặt lúc: ${date(order.created_at)} · Khách hàng: <b>${esc(order.customer_name)}</b> (${esc(order.phone)})<br>
      ${order.fulfillment === 'pickup' ? 'Nhận tại cửa hàng: ' + esc(order.store_name) : 'Địa chỉ giao: ' + esc(order.address) + '<br>Cửa hàng xử lý: ' + esc(order.store_name)}<br>
      Thanh toán: <b>${esc(paymentLabel(order.payment_method))}</b> · ${esc(label(order.payment_status))}
    </div>
    <ul class="customer-order-items">${order.items.map(item => `<li>${esc(item.name)} <b>×${Number(item.quantity)}</b></li>`).join('')}</ul>
    ${order.discount > 0 ? `<div class="oh customer-order-discount"><span>Voucher áp dụng (${esc(order.promo_code || '')})</span><span>−${money(order.discount)}</span></div>` : ''}
    <div class="oh customer-order-total"><span>Tổng thanh toán</span><span>${money(order.total)}</span></div>
    ${requests.map(r => `<p class="customer-order-request">${r.type === 'cancel' ? 'Yêu cầu hủy' : 'Yêu cầu trả hàng'}: <b>${esc(r.type==='cancel'&&order.status==='cancelling'?'Đã chấp nhận hủy, chờ hoàn tất':requestLabel(r.status))}</b><br>${esc(r.reason)}${r.note ? '<br>Phản hồi cửa hàng: ' + esc(r.note) : ''}</p>`).join('')}
    ${order.payment_method==='cash'&&order.payment_status==='paid'&&order.status!=='completed'?'<p class="customer-order-request">Đơn COD đã ghi nhận thanh toán nên không còn đủ điều kiện yêu cầu hủy. Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.</p>':''}
    <details class="customer-order-audit"><summary>Chi tiết xử lý đơn hàng</summary><ol>${(order.history || []).map(h => `<li><span>${date(h.created_at)} · ${esc(label(h.status))}</span><br><small>${esc(h.actor)}: ${esc(h.note)}</small></li>`).join('')}</ol></details>
    ${controls ? `<div class="customer-order-actions">${controls}</div>` : ''}
  </div>`;
}
