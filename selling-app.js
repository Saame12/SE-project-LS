import {$, esc, money, date, label, api, field, select, modal, customerOrderCard} from './client.js';

// Keep the original storefront markup/classes; all business data still comes from MySQL.
let user = null, data = null;
let store = Number(localStorage.getItem('v0_selected_store')) || 1;
let category = '', brand = '', sorting = '', minPrice = 0, maxPrice = Infinity, cart = {}, selectedPromo = '';
let draft = {}, orderCache = [];
let orderView = {type: 'history', query: ''};
const cartIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
try {
  cart = JSON.parse(localStorage.getItem('v0_live_cart') || '{}');
  if (!cart || Array.isArray(cart) || typeof cart !== 'object') cart = {};
  for (const [id, qty] of Object.entries(cart)) {
    if (!/^\d+$/.test(id) || !Number.isInteger(qty) || qty < 1 || qty > 100) delete cart[id];
  }
} catch { cart = {}; }
const storeName = () => data.stores.find(s => s.id === store)?.name || '';
const specs = p => p.specs.split('·').map(s => s.trim()).filter(Boolean);
const save = () => {
  localStorage.setItem('v0_live_cart', JSON.stringify(cart));
  $('#cc').textContent = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
};
function toast(message) {
  $('#ts').textContent = message;
  $('#ts').classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#ts').classList.remove('on'), 4500);
}
function closePanels() {
  $('#ov').classList.remove('on');
  $('#dr').classList.remove('on');
  $('#live-dialog')?.close();
}
function showShop() {
  closePanels();
  $('#shop').hidden = false;
  $('#auth').hidden = true;
  $('#acct').hidden = true;
  window.scrollTo({top: 0, behavior: 'smooth'});
}
async function refresh() {
  [user, data] = await Promise.all([api('/me'), api('/catalog?store=' + store)]);
  $('#ub .btn-label').textContent = user ? user.name.split(' ').pop() : 'Đăng nhập';
  $('#ub').title = user ? 'Tài khoản: ' + user.name : 'Đăng nhập / Tài khoản';
  if (selectedPromo && !data.promotions.some(p => p.code === selectedPromo)) selectedPromo = '';
  renderFilters(); render(); save();
}
async function changeStore(value) {
  store = Number(value);
  localStorage.setItem('v0_selected_store', store);
  await refresh();
}
function renderFilters() {
  const cats = ['', ...new Set(data.products.map(p => p.category))];
  $('#cats').innerHTML = cats.map(c => `<button class="chip" aria-pressed="${c === category}" data-category="${esc(c)}"><span>${esc(c || 'Tất cả')}</span><span class="chip-count">${data.products.filter(p => !c || p.category === c).length}</span></button>`).join('') +
    `<select id="so" aria-label="Sắp xếp sản phẩm"><option value="">Sắp xếp: Mặc định</option><option value="a">Giá: Thấp đến cao</option><option value="d">Giá: Cao đến thấp</option></select>` +
    `<button class="chip" data-action="price-filter">Lọc khoảng giá</button>` +
    (brand ? `<button class="chip" aria-pressed="true" data-action="clear-brand">${esc(brand)} ×</button>` : '');
  $('#so').value = sorting;
  $('#so').onchange = e => { sorting = e.target.value; render(); };
  for (const chip of document.querySelectorAll('[data-category]')) {
    chip.onclick = () => { category = chip.dataset.category; renderFilters(); render(); };
  }
}
function render() {
  let products = data.products.filter(p => p.price>=minPrice && p.price<=maxPrice && (!category || p.category === category) && (!brand || p.brand === brand) &&
    `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase().includes($('#q').value.toLowerCase()));
  if (sorting) products.sort((a, b) => sorting === 'a' ? a.price - b.price : b.price - a.price);
  $('#g').innerHTML = products.map(p => `
    <article class="card">
      <button class="im" data-action="detail" data-id="${p.id}" aria-label="Xem chi tiết ${esc(p.name)}">
        <span class="cat-badge">${esc(p.category)}</span>
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
      </button>
      <div class="bd">
        <div class="brand-meta">
          <button class="brand-name-tag" data-action="brand" data-id="${esc(p.brand)}" title="Xem sản phẩm ${esc(p.brand)}">${esc(p.brand)}</button>
          <span class="stock-label ${p.quantity ? '' : 'sold-out'}" title="${esc(storeName())}: ${p.quantity} sản phẩm">● ${p.quantity ? 'Còn hàng' : 'Hết hàng'}</span>
        </div>
        <button class="view" data-action="detail" data-id="${p.id}" title="${esc(p.name)}">${esc(p.name)}</button>
        <ul class="specs-teaser">${specs(p).slice(0, 2).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="price-block"><div class="price">${money(p.price)}</div></div>
        <button class="add" data-action="add" data-id="${p.id}" ${p.quantity ? '' : 'disabled'}>${cartIcon}<span>Thêm vào giỏ</span></button>
      </div>
    </article>`).join('') || '<div class="empty-state"><h3>Không tìm thấy sản phẩm phù hợp</h3><p>Thử tìm với từ khóa khác hoặc chọn danh mục “Tất cả”.</p></div>';
}
function detail(id) {
  closePanels();
  const p = data.products.find(p => p.id === Number(id));
  if (!p) return;
  $('#ov').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(p.name)}">
    <div class="modal-img-col"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>
    <div class="modal-content-col">
      <div class="modal-top"><span class="brand-name-tag">${esc(p.category)} · ${esc(p.brand)}</span><button class="close-btn" data-action="close-panels" aria-label="Đóng popup">×</button></div>
      <h2>${esc(p.name)}</h2><div class="price">${money(p.price)}</div>
      <ul class="modal-specs-list">${specs(p).map(s => `<li>✓ <span>${esc(s)}</span></li>`).join('')}</ul>
      ${select('detail-store', 'Kiểm tra tại cửa hàng', data.stores.map(s => [s.id, s.name]), store)}
      <p class="stock-label ${p.quantity ? '' : 'sold-out'}">${p.quantity ? `Còn ${p.quantity} sản phẩm` : 'Hết hàng tại cửa hàng này'}</p>
      <div class="modal-actions"><button class="add" data-action="add-detail" data-id="${p.id}" ${p.quantity ? '' : 'disabled'}>${cartIcon}<span>Thêm vào giỏ hàng ngay</span></button></div>
    </div></div>`;
  $('#ov').classList.add('on');
  $('[data-action=close-panels]', $('#ov')).focus();
  $('[name=detail-store]').onchange = e => run(async () => { await changeStore(e.target.value); detail(id); });
}
function rememberDraft() {
  const form = $('#cart-checkout');
  if (form) draft = {...draft, ...Object.fromEntries(new FormData(form))};
}
function cartTotals() {
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => sum + (data.products.find(p => p.id === Number(id))?.price || 0) * qty, 0);
  const promo = data.promotions.find(p => p.code === selectedPromo);
  const discount = promo && subtotal >= promo.min_total ? Math.min(Math.floor(subtotal * promo.percent / 100), promo.max_discount) : 0;
  return {subtotal, promo, discount, total: subtotal - discount};
}
function cartView(message = '', code = '') {
  if (!message) rememberDraft();
  closePanels();
  const ids = Object.keys(cart);
  const totals = cartTotals();
  const expectedCustomerId = user?.id;
  $('#dr').innerHTML = `<div class="drawer-header"><div class="drawer-title">${cartIcon}<span>Giỏ Hàng (${Object.values(cart).reduce((a, b) => a + b, 0)})</span></div><button class="close-btn" data-action="close-panels" aria-label="Đóng giỏ hàng">×</button></div>` +
    (message ? `<div class="items-list empty-state"><h3>Đặt hàng thành công!</h3><p>${esc(message)}</p><button class="btn-primary" data-action="track" data-id="${esc(code)}">Xem lộ trình đơn hàng</button></div>` :
    ids.length ? `<div class="items-list">${ids.map(id => {
      const p = data.products.find(p => p.id === Number(id));
      return `<div class="cart-item"><img src="${esc(p?.image || 'IMG/placeholder.svg')}" alt="${esc(p?.name || '')}"><div class="item-details"><h4>${esc(p?.name || 'Sản phẩm không còn bán')}</h4><div class="item-price">${money(p?.price)}</div><div class="quantity-controls"><button class="qty-btn" data-action="minus" data-id="${id}" aria-label="Giảm số lượng">−</button><span>${cart[id]}</span><button class="qty-btn" data-action="add-cart" data-id="${id}" aria-label="Tăng số lượng">+</button></div><small class="stock-label ${p && p.quantity >= cart[id] ? '' : 'sold-out'}">Còn ${p?.quantity || 0} tại cửa hàng</small></div><button class="remove-btn" data-action="remove" data-id="${id}" aria-label="Xóa ${esc(p?.name || 'sản phẩm')}">×</button></div>`;
    }).join('')}</div>
    <div class="promo-box">${selectedPromo ? `<div class="applied-promo-badge"><span><b>${esc(selectedPromo)}</b></span><button data-action="remove-promo">Gỡ bỏ</button></div>${totals.promo && totals.subtotal < totals.promo.min_total ? '<p class="sold-out">Chưa đạt giá trị tối thiểu của mã.</p>' : ''}` : '<div class="promo-input-row"><input id="pc" placeholder="Nhập mã voucher" aria-label="Nhập mã voucher"><button data-action="apply-promo">Áp dụng</button></div>'}<button class="voucher-link" data-action="promos">Xem danh sách mã voucher có sẵn</button></div>
    <div class="summary-row"><span>Tạm tính</span><span>${money(totals.subtotal)}</span></div>
    ${totals.discount ? `<div class="summary-row discount"><span>Voucher giảm giá</span><span>−${money(totals.discount)}</span></div>` : ''}
    <div class="total-row"><span>Tổng thanh toán</span><span class="total-amount">${money(totals.total)}</span></div>
    <form id="cart-checkout" class="checkout-form">
      ${select('store_id', 'Cửa hàng xử lý đơn', data.stores.map(s => [s.id, s.name]), store)}
      <input name="customer_name" aria-label="Họ tên người nhận" placeholder="Họ và tên người nhận *" value="${esc(draft.customer_name || user?.name || '')}" required maxlength="120">
      <input name="phone" type="tel" aria-label="Số điện thoại" placeholder="Số điện thoại nhận hàng *" value="${esc(draft.phone || user?.phone || '')}" required>
      ${select('fulfillment', 'Hình thức nhận', [['pickup', 'Nhận tại cửa hàng'], ['delivery', 'Giao tận nơi']], draft.fulfillment || 'pickup')}
      <input name="address" aria-label="Địa chỉ giao hàng" placeholder="Địa chỉ giao hàng chi tiết *" value="${esc(draft.address || user?.address || '')}" maxlength="255" ${draft.fulfillment === 'delivery' ? 'required' : 'hidden'}>
      <div class="pay-section"><div class="pay-title">Phương thức thanh toán</div><div class="pay-list" role="radiogroup" aria-label="Phương thức thanh toán">
      ${[['cash', '💵', 'Thanh toán khi nhận hàng (COD)', 'Tiền mặt khi nhận tại cửa hàng hoặc nhận giao hàng'], ['bank_transfer', '🏦', 'Internet Banking/QR (mô phỏng)', 'Thanh toán mô phỏng trước khi cửa hàng xác nhận'], ['card','💳','Visa/Credit Card (mô phỏng)','Không yêu cầu thông tin thẻ thật']].map(([id, icon, name, desc]) => `<label class="pay-opt${(draft.payment_method || 'cash') === id ? ' on' : ''}"><input type="radio" name="payment_method" value="${id}" ${(draft.payment_method || 'cash') === id ? 'checked' : ''}><span class="pay-ico">${icon}</span><span class="pay-info"><b>${name}</b><small>${desc}</small></span></label>`).join('')}
      </div><div class="pay-note">${draft.payment_method && draft.payment_method !== 'cash' ? 'Thanh toán được mô phỏng sau khi đặt hàng, không phát sinh giao dịch thật. Đơn chỉ được xác nhận sau khi mô phỏng thanh toán thành công.' : 'Bạn kiểm tra hàng rồi thanh toán khi nhận hàng.'}</div></div>
      <div class="err" id="checkout-error" role="alert"></div>
      ${user ? '<button class="btn-checkout" type="submit">Xác Nhận Đặt Hàng Ngay</button>' : '<button class="btn-checkout" type="button" data-action="login-checkout">Đăng nhập để đặt hàng</button>'}
    </form>` : '<div class="items-list empty-state"><h3>Giỏ hàng đang trống</h3><p>Hãy lựa chọn linh kiện để xây dựng bộ PC mơ ước của bạn.</p></div>');
  $('#dr').classList.add('on');
  $('[data-action=close-panels]', $('#dr')).focus();
  const form = $('#cart-checkout');
  if (!form) return;
  form.oninput = rememberDraft;
  $('[name=store_id]', form).onchange = e => run(async () => { rememberDraft(); await changeStore(e.target.value); cartView(); });
  $('[name=fulfillment]', form).onchange = e => { const address = $('[name=address]', form); address.required = e.target.value === 'delivery'; address.hidden = !address.required; rememberDraft(); };
  for (const radio of form.querySelectorAll('[name=payment_method]')) radio.onchange = () => { rememberDraft(); cartView(); };
  form.onsubmit = async e => {
    e.preventDefault();
    const submit = $('[type=submit]', form); submit.disabled = true;
    try {
      rememberDraft();
      const current = await api('/me');
      if (!current || current.role !== 'customer' || current.id !== expectedCustomerId) throw Error('Phiên khách hàng đã thay đổi. Vui lòng đăng nhập lại; giỏ hàng vẫn được giữ.');
      const result = await api('/orders', 'POST', {...draft, expected_customer_id: expectedCustomerId, store_id: store, promo_code: selectedPromo, items: Object.entries(cart).map(([id, quantity]) => ({product_id: Number(id), quantity}))});
      const prepaid=draft.payment_method!=='cash';
      cart = {}; draft = {}; selectedPromo = ''; save();
      await refresh(); cartView('Mã đơn: ' + result.code + '. Cửa hàng sẽ tiếp nhận và xử lý đơn của bạn.', result.code);
      if(prepaid)paymentSimulation(result);
    } catch (err) { $('#checkout-error', form).textContent = err.message; }
    finally { submit.disabled = false; }
  };
}
function login(after = refresh, _managerOnly = false, register = false) {
  rememberDraft(); closePanels();
  $('#shop').hidden = true; $('#acct').hidden = true; $('#auth').hidden = false;
  window.scrollTo({top: 0, behavior: 'smooth'});
  const authField = (name, title, type = 'text', extra = '') => field(name, title, '', type, extra).replace('live-field', 'fl');
  $('#auth').innerHTML = `<div class="acard"><h1>${register ? 'Đăng ký thành viên' : 'Đăng nhập tài khoản'}</h1><p class="account-description">${register ? 'Tạo tài khoản để theo dõi đơn hàng và nhận ưu đãi tích điểm.' : 'Chào mừng bạn quay lại hệ thống V0 PC Store.'}</p>
    <form id="customer-auth">${register ? authField('name', 'Họ và tên', 'text', 'autocomplete="name"') : ''}${authField('email', register ? 'Email liên hệ' : 'Email', 'email', 'autocomplete="username"')}${register ? authField('phone', 'Số điện thoại', 'tel', 'autocomplete="tel"') : ''}${authField('password', 'Mật khẩu', 'password', `minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}"`)}${register ? authField('confirm_password', 'Xác nhận lại mật khẩu', 'password', 'autocomplete="new-password"') : ''}<div class="err" role="alert"></div><button class="btn-primary auth-submit">${register ? 'Hoàn tất đăng ký' : 'Đăng nhập ngay'}</button></form>
    <p class="account-description account-switch">${register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button id="switch-auth">${register ? 'Đăng nhập tại đây' : 'Đăng ký tài khoản'}</button></p><button class="btn-secondary auth-submit" id="back-shop">Quay lại cửa hàng</button></div>`;
  $('#switch-auth').onclick = () => login(after, false, !register);
  $('#back-shop').onclick = showShop;
  $('#customer-auth').onsubmit = async e => {
    e.preventDefault();
    const form = e.currentTarget, submit = $('.auth-submit', form), b = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    try {
      if (register && b.password !== b.confirm_password) throw Error('Mật khẩu xác nhận không trùng khớp.');
      await api('/auth/' + (register ? 'register' : 'login'), 'POST', b);
      await refresh(); showShop(); await after();
    } catch (err) { $('.err', form).textContent = err.message; }
    finally { submit.disabled = false; }
  };
}
async function account(tab = 'info') {
  user = await api('/me');
  if (!user) return login(() => account(tab));
  if (tab === 'hist') {
    orderCache = await api('/orders');
    orderView = {type: 'history', query: ''};
  }
  closePanels(); $('#shop').hidden = true; $('#auth').hidden = true; $('#acct').hidden = false;
  const optionalField=(name,title,value='',type='text')=>field(name,title,value,type).replace('live-field','fl').replace(' required','');
  const passwordBody='<form id="password-profile">'+field('current_password','Mật khẩu hiện tại','','password').replace('live-field','fl')+field('new_password','Mật khẩu mới','','password','minlength="8"').replace('live-field','fl')+field('confirm_password','Xác nhận mật khẩu mới','','password').replace('live-field','fl')+'<p class="err" role="alert"></p><button class="btn-primary auth-submit">Cập nhật mật khẩu</button></form>';
  const info='<form id="profile-form">'+field('name','Họ và tên',user.name).replace('live-field','fl')+field('email','Email',user.email,'email').replace('live-field','fl')+field('phone','Số điện thoại',user.phone,'tel').replace('live-field','fl')+optionalField('address','Địa chỉ giao hàng mặc định',user.address)+optionalField('dob','Ngày sinh',user.dob||'','date')+select('gender','Giới tính',[['','Chưa cung cấp'],['male','Nam'],['female','Nữ'],['other','Khác']],user.gender)+optionalField('occupation','Nghề nghiệp',user.occupation)+'<p class="err" role="alert"></p><button class="btn-primary auth-submit">Lưu thông tin</button></form><div class="addr-box"><small>Hạng thành viên</small><span>'+esc(user.tier)+' · Chi tiêu hoàn tất: '+money(user.spend)+'</span></div>';
  const body=tab==='pw'?passwordBody:tab==='hist'?(orderCache.length?'<p class="account-description">Bạn có <b>'+orderCache.length+'</b> đơn hàng đã thực hiện.</p>'+orderCache.map(customerOrderCard).join(''):'<div class="empty-state">Bạn chưa có đơn hàng.</div>'):info;
  $('#acct').innerHTML='<div class="acard account-card"><h1>Trung tâm tài khoản</h1><p class="account-description">Xin chào, <b>'+esc(user.name)+'</b> ('+esc(user.email)+')</p><div class="tabs"><button class="chip" aria-pressed="'+(tab==='info')+'" data-action="account-info">Thông tin cá nhân</button><button class="chip" aria-pressed="'+(tab==='pw')+'" data-action="account-password">Đổi mật khẩu</button><button class="chip" aria-pressed="'+(tab==='hist')+'" data-action="orders">Lịch sử mua hàng</button></div>'+body+'<div class="account-actions"><button class="btn-secondary" data-action="shop">Quay lại mua sắm</button><button class="btn-secondary" data-action="logout">Đăng xuất</button></div></div>';
  const form=$('#profile-form')||$('#password-profile');
  if(form)form.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(form)),submit=$('button',form);submit.disabled=true;try{if(tab==='pw'){if(b.new_password!==b.confirm_password)throw Error('Mật khẩu xác nhận không trùng khớp');await api('/me/password','POST',b);toast('Đã đổi mật khẩu; các phiên khác đã đăng xuất');await account('pw');}else{await api('/me','PUT',b);await refresh();await account();toast('Đã lưu hồ sơ');}}catch(err){$('.err',form).textContent=err.message;}finally{submit.disabled=false;}};
  window.scrollTo({top: 0, behavior: 'smooth'});
}
async function orders() {
  return account('hist');
}
async function track(query = '') {
  query = String(query).trim();
  user = await api('/me');
  if (query && !user) return login(() => track(query));
  const list = query ? await api('/orders') : [];
  if (query) orderCache = list;
  const normalizePhone = value => String(value).replace(/[^+0-9]/g, '');
  const found = query ? list.filter(o => o.code.toLowerCase() === query.toLowerCase() || (/^[+0-9 ()-]{9,20}$/.test(query) && normalizePhone(o.phone) === normalizePhone(query))) : [];
  orderView = {type: 'track', query};
  closePanels();
  $('#ov').innerHTML = '<div class="modal tk" role="dialog" aria-modal="true" aria-label="Tra cứu trạng thái đơn hàng"><div class="modal-top"><h2 class="customer-tracking-title">Tra cứu trạng thái đơn hàng</h2><button class="close-btn" data-action="close-panels" aria-label="Đóng tra cứu">×</button></div><p class="customer-tracking-description">Nhập mã đơn hàng hoặc số điện thoại người nhận để kiểm tra lộ trình.</p><form id="tf"><input id="tq" aria-label="Mã đơn hoặc số điện thoại" value="' + esc(query) + '" placeholder="Mã đơn (DH123456) hoặc Số điện thoại..."><button type="submit">Kiểm tra ngay</button></form>' + (!user ? '<p class="customer-tracking-description">Đăng nhập để tra cứu đơn hàng của bạn.</p>' : '') + (query ? (found.length ? found.map(customerOrderCard).join('') : '<div class="empty-state" style="padding:30px 10px"><p>Không tìm thấy đơn hàng nào với “' + esc(query) + '” trong tài khoản của bạn. Vui lòng kiểm tra lại thông tin.</p></div>') : '') + '</div>';
  $('#ov').classList.add('on');
  $('[data-action=close-panels]', $('#ov')).focus();
  $('#tf').onsubmit = e => { e.preventDefault(); run(() => track($('#tq').value)); };
}
function requestOrder(type, id) {
  const returnView = {...orderView};
  closePanels();

  const title = type === 'cancel' ? 'Yêu cầu hủy đơn' : 'Yêu cầu trả sản phẩm';
  const explanation = type==='cancel'?'<p class="customer-tracking-description">Theo quy tắc đồ án: đơn trả trước được yêu cầu hủy trước Hoàn tất; COD chỉ được yêu cầu hủy khi chưa ghi nhận thanh toán. Cửa hàng sẽ xem xét yêu cầu.</p>':'';
  $('#ov').innerHTML = '<div class="modal tk" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="modal-top"><h2 class="customer-tracking-title">' + title + '</h2><button class="close-btn" data-action="close-panels" aria-label="Đóng yêu cầu">×</button></div>' + explanation + '<form id="customer-order-request" class="customer-order-request-form"><label class="fl">Lý do yêu cầu<input name="reason" required maxlength="255"></label><p class="err" role="alert"></p><button type="submit">' + 'Gửi yêu cầu' + '</button></form></div>';
  $('#ov').classList.add('on');
  $('[name=reason]').focus();
  $('#customer-order-request').onsubmit = async e => {
    e.preventDefault();
    const form = e.currentTarget, submit = $('[type=submit]', form);
    submit.disabled = true;
    try {
      const result = await api('/orders/' + id + '/requests', 'POST', {type, reason: new FormData(form).get('reason')});
      localStorage.setItem('v0_orders_changed',String(Date.now())+'-'+Math.random());
      toast(type === 'cancel' ? (result.status === 'cancelled' ? 'Đã hủy đơn và hoàn tồn kho.' : 'Đơn đang chờ duyệt hủy; cửa hàng sẽ xem xét yêu cầu.') : 'Đã gửi yêu cầu trả hàng; chờ cửa hàng xét duyệt');
      if (returnView.type === 'track') await track(returnView.query);
      else await orders();
    } catch (err) { $('.err', form).textContent = err.message; }
    finally { submit.disabled = false; }
  };
}
function promos() {
  closePanels();
  const conditions=p=>[p.min_age!=null?'Tuổi từ '+p.min_age:'',p.max_age!=null?'Tuổi tối đa '+p.max_age:'',p.gender?({male:'Nam',female:'Nữ',other:'Khác'})[p.gender]:'',p.occupation||'',p.channel&&p.channel!=='all'?'Chỉ '+p.channel:''].filter(Boolean).map(esc).join(' · ');
  modal('Kho Voucher Ưu Đãi', `<p class="account-description">Ưu đãi áp dụng tại ${esc(storeName())}.</p>` + (data.promotions.map(p => `<div class="ord"><div class="oh"><strong class="brand-name-tag">${esc(p.code)}</strong><strong class="stock-label">Giảm ${p.percent}%</strong></div><b>${esc(p.name)}</b><p class="account-description">Đơn từ ${money(p.min_total)} · Giảm tối đa ${money(p.max_discount)}<br>${conditions(p)}<br>Hạn dùng: ${new Date(p.ends_at).toLocaleDateString('vi-VN')}</p><button class="btn-primary" data-action="choose-promo" data-id="${esc(p.code)}">Áp dụng ngay</button></div>`).join('') || '<p>Chưa có khuyến mãi tại cửa hàng này.</p>'));
}
function paymentSimulation(order){
 closePanels();
 $('#ov').innerHTML='<div class="modal tk" role="dialog" aria-modal="true"><div class="modal-top"><h2>Thanh toán mô phỏng</h2><button class="close-btn" data-action="close-panels" aria-label="Đóng">×</button></div><p>'+esc(order.code)+' · '+money(order.total)+'</p><p class="customer-tracking-description">Dùng cho đồ án. Không nhập thông tin thẻ thật và không phát sinh giao dịch tiền thật.</p><p id="simulation-message" class="err" role="alert"></p><div class="account-actions"><button class="btn-primary" id="payment-ok">Mô phỏng thành công</button><button class="btn-secondary" id="payment-fail">Mô phỏng thất bại</button></div></div>';
 $('#ov').classList.add('on');
 for(const [id,outcome] of [['payment-ok','success'],['payment-fail','failure']])$('#'+id).onclick=()=>run(async()=>{const buttons=[...$('#ov').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await api('/orders/'+order.id+'/pay-simulate','POST',{outcome});if(outcome==='success'){localStorage.setItem('v0_orders_changed',String(Date.now()));toast('Thanh toán mô phỏng thành công');await track(order.code);}else $('#simulation-message').textContent='Thanh toán thất bại (mô phỏng). Chưa thu tiền; bạn có thể thử lại.';}finally{buttons.forEach(b=>b.disabled=false);}});
}
function filterPrice(){
 closePanels();$('#ov').innerHTML='<div class="modal tk" role="dialog" aria-modal="true"><div class="modal-top"><h2>Lọc khoảng giá</h2><button class="close-btn" data-action="close-panels">×</button></div><form id="price-filter-form" class="customer-order-request-form"><label class="fl">Giá từ<input name="min" type="number" min="0" value="'+minPrice+'"></label><label class="fl">Giá đến<input name="max" type="number" min="0" value="'+(Number.isFinite(maxPrice)?maxPrice:'')+'" placeholder="Không giới hạn"></label><p class="err"></p><button>Áp dụng</button></form></div>';$('#ov').classList.add('on');
 $('#price-filter-form').onsubmit=e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget)),low=Number(b.min||0),high=b.max===''?Infinity:Number(b.max);if(low<0||high<low){$('.err',e.currentTarget).textContent='Khoảng giá không hợp lệ';return;}minPrice=low;maxPrice=high;render();closePanels();};
}
async function action(name, id) {
  if(name==='price-filter')return filterPrice();
  if(name==='pay-simulate')return paymentSimulation(orderCache.find(o=>o.id===Number(id)));
  if (name === 'shop') return showShop();
  if (name === 'close-panels') return closePanels();
  if (name === 'brand') { brand = id; renderFilters(); render(); return; }
  if (name === 'clear-brand') { brand = ''; renderFilters(); render(); return; }
  if (name === 'detail') return detail(id);
  if (name === 'login-checkout') return login(async () => cartView());
  if (name === 'logout') { await api('/auth/logout', 'POST'); draft = {}; await refresh(); showShop(); return toast('Đã đăng xuất'); }
  if (['add', 'add-cart', 'add-detail'].includes(name)) {
    user=await api('/me');if(!user)return login(()=>action(name,id));
    const p = data.products.find(p => p.id === Number(id));
    if (!p || (cart[id] || 0) >= Math.min(p.quantity, 100)) return toast('Không thể thêm vượt tồn kho khả dụng.');
    cart[id] = (cart[id] || 0) + 1; save();
    if (name === 'add-cart') cartView();
    else { if (name === 'add-detail') closePanels(); toast('Đã thêm "' + p.name + '" vào giỏ hàng'); }
  }
  if (name === 'minus') { if (cart[id]) cart[id]--; if (!cart[id]) delete cart[id]; save(); cartView(); }
  if (name === 'remove') { delete cart[id]; save(); cartView(); }
  if (name === 'promos') return promos();
  if (name === 'remove-promo') { selectedPromo = ''; cartView(); }
  if (name === 'choose-promo' || name === 'apply-promo') {
    const code = name === 'choose-promo' ? id : $('#pc').value.trim().toUpperCase();
    if (!data.promotions.some(p => p.code === code)) return toast('Mã ưu đãi không tồn tại hoặc không áp dụng tại cửa hàng.');
    selectedPromo = code; cartView();
  }
  if (name === 'account-info') return account('info');
  if (name === 'account-password') return account('pw');
  if (name === 'orders') return orders();
  if (name === 'track') return track(id);
  if (['cancel', 'return'].includes(name)) return requestOrder(name, id);
}
function run(fn) { Promise.resolve().then(fn).catch(err => toast(err.message)); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (b) run(() => action(b.dataset.action, b.dataset.id));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanels(); });
$('#ov').onclick = e => { if (e.target === $('#ov')) closePanels(); };
$('#q').oninput = () => data && render();
$('#cb').onclick = () => data && cartView();
$('#tb').onclick = () => run(async () => { user = await api('/me'); return user ? orders() : track(); });
$('#pb').onclick = () => data && promos();
$('#ub').onclick = () => run(() => account());
$('#theme-btn').onclick = () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme; localStorage.setItem('v0theme', theme);
};
document.documentElement.dataset.theme = localStorage.getItem('v0theme') || 'dark';
window.showShop = showShop;
window.track = query => run(() => track(query));
window.promoList = () => data && promos();
for (const a of document.querySelectorAll('a[href="#!"]')) a.onclick = e => {
  e.preventDefault(); modal('Đang phát triển', `<p>${esc(a.textContent)}: chức năng đang được phát triển.</p>`);
};
for (const tag of document.querySelectorAll('.pay-tag')) {
  if (/VNPAY|MoMo/.test(tag.textContent)) {
    tag.title = 'Đang phát triển — chưa khả dụng khi đặt hàng';
    tag.setAttribute('role', 'button'); tag.tabIndex = 0;
    tag.onclick = () => modal('Đang phát triển', '<p>Phương thức này chưa khả dụng. Bạn có thể chọn COD, thẻ hoặc Internet Banking/QR mô phỏng khi đặt hàng.</p>');
    tag.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tag.click(); } };
  }
}
refresh().catch(err => { $('#g').innerHTML = `<div class="empty-state"><p>${esc(err.message)}. Vui lòng thử tải lại trang.</p></div>`; toast(err.message); });

async function reloadCustomerOrders(){
  if($('#ov').classList.contains('on')&&$('#customer-order-request'))return;
  if($('#ov').classList.contains('on')&&$('#tf'))return track(orderView.query);
  if(!$('#acct').hidden&&$('#acct [data-action="orders"][aria-pressed="true"]'))return orders();
}
window.addEventListener('focus',()=>run(reloadCustomerOrders));
window.addEventListener('storage',e=>{if(e.key==='v0_orders_changed')run(reloadCustomerOrders);});
