import {$,esc,money,date,label,api,button,field,select,modal,login,table,orderDetail,orderStatusLabel} from './client.js';
let me=null,catalog=null,data=null,page='stock',cart={};
const pages={stock:'Tồn kho cửa hàng',pos:'Lập hóa đơn offline',orders:'Đơn được phân công',commission:'KPI và hoa hồng cá nhân'};
async function refresh(){
 me=await api('/me');
 if(!me){$('#view').innerHTML='<div class="pan"><h2>Đăng nhập nhân viên cửa hàng</h2><p>Tài khoản thử: staff.q1@v0tech.vn / staff.td@v0tech.vn · Demo@12345</p>'+button('Đăng nhập','login','','pri')+'</div>';$('#nav').innerHTML='';$('.who').textContent='Chưa đăng nhập';return;}
 if(me.role!=='employee')throw Error('Dùng tài khoản nhân viên cửa hàng');
 [catalog,data]=await Promise.all([api('/catalog?store='+me.store_id),api('/employee/data')]);
 $('.who').textContent=me.name+' · '+data.store.name;
 $('#nav').innerHTML=Object.entries(pages).map(([id,title])=>'<a href="#'+id+'" data-page="'+id+'" class="'+(id===page?'on':'')+'">'+title+'</a>').join('');render();
}
function render(){
 $('#ttl').textContent=pages[page];for(const a of document.querySelectorAll('[data-page]'))a.classList.toggle('on',a.dataset.page===page);
 if(page==='stock')stock();if(page==='pos')pos();if(page==='orders')orders();if(page==='commission')commission();
}
function stock(){
 $('#view').innerHTML='<div class="bar"><input id="stock-query" placeholder="Tìm sản phẩm hoặc SKU" aria-label="Tìm sản phẩm"></div><div id="stock-results"></div><p class="mu">Nhân viên chỉ xem tồn khả dụng, không được nhập/điều chỉnh kho.</p>';
 const filter=()=>{$('#stock-results').innerHTML=table(['SKU / Sản phẩm','Thương hiệu','Giá','Tồn','Thao tác'],catalog.products.filter(p=>(p.sku+' '+p.name).toLowerCase().includes($('#stock-query').value.toLowerCase())).map(p=>[esc(p.sku)+'<br>'+esc(p.name),esc(p.brand),money(p.price),p.quantity,p.quantity?button('Thêm vào bill','add',p.id):'Hết hàng']));};$('#stock-query').oninput=filter;filter();
}
function pos(){
 $('#view').innerHTML='<p class="mu">Bill được gắn đúng nhân viên/cửa hàng. Thẻ và ngân hàng là mô phỏng, không nhập thông tin thanh toán thật. Quản lý chốt hoàn tất sau khi đã giao hàng và xác nhận thu tiền.</p><div class="bar"><select id="pos-product" aria-label="Sản phẩm">'+catalog.products.map(p=>'<option value="'+p.id+'">'+esc(p.name)+' · còn '+p.quantity+'</option>').join('')+'</select>'+button('Thêm sản phẩm','add-selected')+'</div>'+table(['Sản phẩm','Số lượng','Giá','Thao tác'],Object.entries(cart).map(([id,q])=>{const p=catalog.products.find(p=>p.id===Number(id));return [esc(p.name),'<input type="number" min="1" max="'+Math.min(100,p.quantity)+'" value="'+q+'" data-quantity="'+id+'" aria-label="Số lượng '+esc(p.name)+'">',money(p.price),button('Xóa','remove',id)];}))+'<p>Tạm tính: <strong id="pos-subtotal">'+money(Object.entries(cart).reduce((sum,[id,q])=>sum+catalog.products.find(p=>p.id===Number(id)).price*q,0))+'</strong></p><form id="pos-form" class="pan live-form">'+field('customer_name','Tên khách hàng')+field('phone','Số điện thoại','','tel')+select('payment_method','Thanh toán',[['cash','Tiền mặt / COD'],['card','Thẻ mô phỏng thành công'],['bank_transfer','Ngân hàng/QR mô phỏng thành công']])+'<label class="live-field">Mã khuyến mãi<input name="promo_code" placeholder="Không bắt buộc"></label><details><summary>Điều kiện khuyến mãi cần đối chiếu giấy tờ</summary><label class="live-field">Ngày sinh khách<input type="date" name="dob"></label>'+select('gender','Giới tính',[['','Chưa cung cấp'],['male','Nam'],['female','Nữ'],['other','Khác']])+'<label class="live-field">Nghề nghiệp<input name="occupation"></label><label class="ck"><input type="checkbox" name="eligibility_confirmed">Tôi đã đối chiếu giấy tờ và điều kiện khuyến mãi</label></details><p class="form-error" role="alert"></p><button class="btn pri">Tạo và xác nhận bill offline</button></form>';
 for(const input of document.querySelectorAll('[data-quantity]'))input.onchange=()=>{const q=Number(input.value),p=catalog.products.find(p=>p.id===Number(input.dataset.quantity));if(!Number.isInteger(q)||q<1||q>Math.min(100,p.quantity)){input.value=cart[input.dataset.quantity];return;}cart[input.dataset.quantity]=q;$('#pos-subtotal').textContent=money(Object.entries(cart).reduce((sum,[id,n])=>sum+catalog.products.find(p=>p.id===Number(id)).price*n,0));};
 $('#pos-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,submit=$('button',f);submit.disabled=true;try{const b=Object.fromEntries(new FormData(f));const o=await api('/employee/orders','POST',{...b,eligibility_confirmed:b.eligibility_confirmed==='on',items:Object.entries(cart).map(([id,q])=>({product_id:Number(id),quantity:q}))});cart={};page='orders';await refresh();modal('Đã tạo bill '+o.code,'<p>Bill đã vào danh sách đơn của cửa hàng. Ghi nhận khách nhận hàng, sau đó quản lý xác nhận thu tiền và hoàn tất.</p>');}catch(err){$('.form-error',f).textContent=err.message;}finally{submit.disabled=false;}};
}
function orders(){
 $('#view').innerHTML=table(['Mã / Kênh','Khách hàng','Tổng','Trạng thái','Thanh toán','Thao tác'],data.orders.map(o=>[esc(o.code)+'<br>'+(o.channel==='offline'?'Offline':'Online'),esc(o.customer_name),money(o.total),esc(orderStatusLabel(o)),esc(label(o.payment_status)),button('Chi tiết','detail',o.id)+(o.channel==='offline'&&o.status==='confirmed'?' '+button('Ghi nhận khách nhận hàng','received',o.id):'')]))+'<p class="mu">Chỉ hiển thị các đơn do bạn phụ trách. Quản lý cập nhật đơn online và chốt hoàn tất giao dịch.</p>';
}
function commission(){
 $('#view').innerHTML='<p class="mu">Hoa hồng cơ sở 5%. Dưới 80% KPI: 0%; từ 80% đến dưới 100%: 50% cơ sở; từ 100%: 100% cơ sở. Chỉ bill đã hoàn tất được ghi nhận. Không thu hồi hoa hồng chỉ vì đổi trả sau đó.</p>'+table(['Tháng','Sản phẩm','KPI','Đạt','Doanh số ghi nhận','Hoa hồng'],data.commission.map(d=>[d.period.slice(0,7),d.units,d.target,Math.round(d.ratio*100)+'%',money(d.revenue),money(d.commission)]));
}
async function action(name,id){
 if(name==='login')return login(refresh,true);
 if(name==='add'||name==='add-selected'){
  if(name==='add-selected')id=$('#pos-product').value;const p=catalog.products.find(p=>p.id===Number(id));if((cart[id]||0)>=Math.min(100,p.quantity))throw Error('Vượt tồn khả dụng');cart[id]=(cart[id]||0)+1;page='pos';render();
 }
 if(name==='remove'){delete cart[id];pos();}
 if(name==='detail'){const o=data.orders.find(o=>o.id===Number(id));modal('Chi tiết '+o.code,orderDetail(o));}
 if(name==='received'){await api('/employee/orders/'+id+'/received','POST');await refresh();}
}
document.addEventListener('click',e=>{const a=e.target.closest('[data-page]');if(a){page=a.dataset.page;render();return;}const b=e.target.closest('[data-action]');if(b)Promise.resolve(action(b.dataset.action,b.dataset.id)).catch(err=>modal('Không thể thực hiện','<p>'+esc(err.message)+'</p>'));});
$('#reload').onclick=()=>refresh().catch(err=>modal('Không thể tải dữ liệu','<p>'+esc(err.message)+'</p>'));
$('#logout').onclick=async()=>{await api('/auth/logout','POST');me=null;cart={};await refresh();};
refresh().catch(err=>{$('#view').innerHTML='<p class="pan">'+esc(err.message)+'</p>';});
