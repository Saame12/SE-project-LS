import {randomBytes} from 'node:crypto';
import {rows,tx,pool} from './db.js';
import {hash,verify,check,integer} from './domain.js';
import {promotionEligibility,validPeriod} from './rules.js';
import {commissionReport} from './commissions.js';

export async function seedAcademic(db=pool){
 const managers=await rows("SELECT * FROM users WHERE role='manager' AND staff_id IS NULL",[],db);
 for(const u of managers){
  const result=await rows("INSERT INTO staff(store_id,name,email,phone,position,kind,monthly_target,kpi_basis,commission_rate) VALUES(?,?,?,?,'Quản lý cửa hàng','manager',50,'store_units',5)",[u.store_id,u.name,u.email,u.phone],db);
  await rows('UPDATE users SET staff_id=? WHERE id=?',[result.insertId,u.id],db);
 }
 const [guest]=await rows("SELECT id FROM users WHERE email='walkin@v0tech.local'",[],db);
 if(!guest)await rows("INSERT INTO users(email,password_hash,name,phone,role) VALUES(?,?,?,?,'customer')",['walkin@v0tech.local',hash(randomBytes(32).toString('hex')),'Khách mua trực tiếp','0000000000'],db);
 for(const [store,email] of [[1,'staff.q1@v0tech.vn'],[2,'staff.td@v0tech.vn']]){
  const [exists]=await rows('SELECT id FROM users WHERE email=?',[email],db);
  if(exists)continue;
  const [s]=await rows("SELECT * FROM staff WHERE store_id=? AND kind='sales' AND active=1 ORDER BY id LIMIT 1",[store],db);
  if(s)await rows("INSERT INTO users(email,password_hash,name,phone,role,store_id,staff_id) VALUES(?,?,?,?,'employee',?,?)",[email,hash('Demo@12345'),s.name,s.phone,store,s.id],db);
 }
}
export function registerAcademicApi({route,auth,manager,text,phone,history,orderList}){
 const employee=req=>{const u=auth(req);check(u.role==='employee','Chỉ nhân viên cửa hàng được phép',403);return u;};
 const customer=req=>{const u=auth(req);check(u.role==='customer','Chỉ khách hàng được phép',403);return u;};
 const profileInput=b=>{
  const dob=b.dob?text(b.dob,10):null;
  if(dob){const d=new Date(dob);check(/^\d{4}-\d{2}-\d{2}$/.test(dob)&&!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===dob&&dob>='1900-01-01'&&d<=new Date(),'Ngày sinh không hợp lệ');}
  const gender=b.gender||'';check(['','male','female','other'].includes(gender),'Giới tính không hợp lệ');
  return {dob,gender,occupation:typeof b.occupation==='string'?b.occupation.trim().slice(0,80):'',address:typeof b.address==='string'?b.address.trim().slice(0,255):''};
 };
 route('put','/api/me',async(req,res)=>{
  const u=customer(req),b=req.body,p=profileInput(b),email=text(b.email,160).toLowerCase();
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Email không hợp lệ');
  await rows('UPDATE users SET name=?,email=?,phone=?,address=?,dob=?,gender=?,occupation=? WHERE id=?',[text(b.name,120),email,phone(b.phone),p.address,p.dob,p.gender,p.occupation,u.id]);res.json({ok:true});
 });
 route('post','/api/me/password',async(req,res)=>{
  const u=customer(req),b=req.body,newPassword=text(b.new_password,128);check(newPassword.length>=8,'Mật khẩu tối thiểu 8 ký tự');
  await tx(async db=>{
   const [record]=await rows('SELECT password_hash FROM users WHERE id=? FOR UPDATE',[u.id],db);
   check(typeof b.current_password==='string'&&verify(b.current_password,record.password_hash),'Mật khẩu hiện tại không đúng',400);
   await rows('UPDATE users SET password_hash=? WHERE id=?',[hash(newPassword),u.id],db);
   await rows('DELETE FROM sessions WHERE user_id=? AND token<>?',[u.id,req.sessionToken],db);
  });res.json({ok:true});
 });
 route('post','/api/orders/:id/pay-simulate',async(req,res)=>{
  const u=customer(req),id=integer(req.params.id),outcome=req.body.outcome;check(['success','failure'].includes(outcome),'Kết quả mô phỏng không hợp lệ');
  const result=await tx(async db=>{
   const [o]=await rows('SELECT * FROM orders WHERE id=? AND user_id=? FOR UPDATE',[id,u.id],db);
   check(o,'Không tìm thấy đơn',404);check(o.payment_method!=='cash','COD không dùng mô phỏng trả trước');check(o.status==='pending'&&o.payment_status==='unpaid','Đơn không còn chờ thanh toán',409);
   const reference='SIM-'+randomBytes(10).toString('hex');
   await rows('INSERT INTO payment_records(order_id,actor_id,method,result,amount,reference) VALUES(?,?,?,?,?,?)',[id,u.id,o.payment_method,outcome,o.total,reference],db);
   if(outcome==='success')await rows("UPDATE orders SET payment_status='paid' WHERE id=?",[id],db);
   await history(db,id,u.id,o.status,outcome==='success'?'Thanh toán mô phỏng thành công (không thu tiền thật)':'Thanh toán mô phỏng thất bại, chưa thu tiền');
   return {ok:true,reference,payment_status:outcome==='success'?'paid':'unpaid'};
  });res.json(result);
 });
 route('post','/api/manager/staff/:id/target',async(req,res)=>{
  const u=manager(req),id=integer(req.params.id),b=req.body,period=validPeriod(b.period),target=integer(b.target,1,1000000);
  const [s]=await rows('SELECT * FROM staff WHERE id=? AND store_id=?',[id,u.store_id]);check(s,'Không tìm thấy nhân viên',404);
  const basis=b.kpi_basis||'personal_units';check(['personal_units','store_units'].includes(basis)&&(s.kind==='manager'||basis==='personal_units'),'KPI nhân viên bán hàng phải tính số sản phẩm cá nhân');
  await rows('INSERT INTO staff_targets(staff_id,period,target,kpi_basis) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE target=VALUES(target),kpi_basis=VALUES(kpi_basis)',[id,period,target,basis]);res.json({ok:true});
 });
 route('post','/api/manager/staff/:id/account',async(req,res)=>{
  const u=manager(req),id=integer(req.params.id),b=req.body;
  const [s]=await rows('SELECT * FROM staff WHERE id=? AND store_id=? AND active=1',[id,u.store_id]);check(s&&s.kind==='sales','Chỉ cấp tài khoản bán hàng cho nhân viên bán hàng đang làm việc',404);
  const existing=await rows('SELECT id FROM users WHERE staff_id=?',[id]);check(!existing.length,'Nhân viên đã có tài khoản',409);
  const email=text(b.email,160).toLowerCase(),password=text(b.password,128);check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Email không hợp lệ');check(password.length>=8,'Mật khẩu tối thiểu 8 ký tự');
  await rows("INSERT INTO users(email,password_hash,name,phone,role,store_id,staff_id) VALUES(?,?,?,?,'employee',?,?)",[email,hash(password),s.name,s.phone,u.store_id,id]);res.status(201).json({ok:true});
 });
 route('get','/api/employee/data',async(req,res)=>{
  const u=employee(req),period=new Date().toLocaleDateString('en-CA').slice(0,7)+'-01';
  const now=new Date(),end=new Date(now.getFullYear(),now.getMonth()+1,0).toLocaleDateString('en-CA');const report=await commissionReport(u.store_id,period,end);
  const [person]=await rows('SELECT * FROM staff WHERE id=? AND store_id=?',[u.staff_id,u.store_id]);
  const assigned=(await orderList({...u,role:'manager'})).filter(o=>o.staff_id===u.staff_id);
  res.json({staff:person,orders:assigned,commission:report.details.filter(s=>s.id===u.staff_id),store:(await rows('SELECT * FROM stores WHERE id=?',[u.store_id]))[0]});
 });
 route('post','/api/employee/orders',async(req,res)=>{
  const u=employee(req),b=req.body,items=b.items;
  check(Array.isArray(items)&&items.length>0&&items.length<=30,'Danh sách hàng không hợp lệ');check(['cash','card','bank_transfer'].includes(b.payment_method),'Thanh toán không khả dụng');
  const name=text(b.customer_name,120),tel=phone(b.phone),profile=profileInput(b);
  const result=await tx(async db=>{
   const [staff]=await rows("SELECT * FROM staff WHERE id=? AND store_id=? AND active=1 AND kind='sales' FOR UPDATE",[u.staff_id,u.store_id],db);check(staff,'Nhân viên không được bán hàng',403);
   const merged=new Map();for(const i of items){const id=integer(i.product_id),q=integer(i.quantity,1,100);merged.set(id,(merged.get(id)||0)+q);}
   let subtotal=0;const lines=[];
   for(const [id,q] of [...merged].sort((a,b)=>a[0]-b[0])){
    integer(q,1,100);const [p]=await rows('SELECT p.*,i.quantity FROM products p JOIN inventory i ON i.product_id=p.id WHERE p.id=? AND p.active=1 AND i.store_id=? FOR UPDATE',[id,u.store_id],db);
    check(p&&p.quantity>=q,'Không đủ tồn kho: '+(p?.name||id),409);subtotal+=p.price*q;lines.push({...p,q});
   }
   let discount=0,promo=null;
   if(b.promo_code){
    [promo]=await rows('SELECT * FROM promotions WHERE code=? AND active=1 AND (store_id IS NULL OR store_id=?) AND CURDATE() BETWEEN starts_at AND ends_at FOR UPDATE',[text(b.promo_code,40).toUpperCase(),u.store_id],db);
    check(promo&&subtotal>=promo.min_total,'Mã ưu đãi không hợp lệ hoặc chưa đạt giá trị tối thiểu');
    if(promo.min_age!==null||promo.max_age!==null||promo.gender||promo.occupation)check(b.eligibility_confirmed===true,'Nhân viên cần xác nhận đã kiểm tra giấy tờ điều kiện khuyến mãi');
    const problem=promotionEligibility(promo,profile,'offline');check(!problem,problem);discount=Math.min(Math.floor(subtotal*promo.percent/100),promo.max_discount);
   }
   const [guest]=await rows("SELECT id FROM users WHERE email='walkin@v0tech.local'",[],db);
   const code='POS-'+randomBytes(6).toString('hex').toUpperCase();
   const paid=b.payment_method==='cash'?'unpaid':'paid';
   const r=await rows("INSERT INTO orders(code,user_id,store_id,staff_id,customer_name,phone,fulfillment,payment_method,payment_status,status,subtotal,discount,total,promo_code,commission_rate,channel) VALUES(?,?,?,?,?,?,'pickup',?,?,'confirmed',?,?,?,?,5,'offline')",[code,guest.id,u.store_id,u.staff_id,name,tel,b.payment_method,paid,subtotal,discount,subtotal-discount,promo?.code||null],db);
   for(const l of lines){await rows('INSERT INTO order_items(order_id,product_id,name,quantity,price) VALUES(?,?,?,?,?)',[r.insertId,l.id,l.name,l.q,l.price],db);await rows('UPDATE inventory SET quantity=quantity-? WHERE store_id=? AND product_id=?',[l.q,u.store_id,l.id],db);await rows('INSERT INTO inventory_movements(store_id,product_id,actor_id,delta,note) VALUES(?,?,?,?,?)',[u.store_id,l.id,u.id,-l.q,'Giữ hàng bill '+code],db);}
   if(paid==='paid')await rows('INSERT INTO payment_records(order_id,actor_id,method,result,amount,reference) VALUES(?,?,?,?,?,?)',[r.insertId,u.id,b.payment_method,'success',subtotal-discount,'POS-SIM-'+randomBytes(8).toString('hex')],db);
   await history(db,r.insertId,u.id,'confirmed','Nhân viên tạo và xác nhận bill offline; thanh toán điện tử là mô phỏng');return {id:r.insertId,code,total:subtotal-discount};
  });res.status(201).json(result);
 });
 route('post','/api/employee/orders/:id/received',async(req,res)=>{
  const u=employee(req),id=integer(req.params.id);
  await tx(async db=>{const [o]=await rows('SELECT * FROM orders WHERE id=? AND store_id=? AND staff_id=? FOR UPDATE',[id,u.store_id,u.staff_id],db);check(o&&o.channel==='offline','Không tìm thấy bill được phân công',404);check(o.status==='confirmed','Bill không ở bước giao hàng',409);await rows("UPDATE orders SET status='received' WHERE id=?",[id],db);await history(db,id,u.id,'received','Nhân viên ghi nhận đã giao sản phẩm cho khách tại cửa hàng');});res.json({ok:true});
 });
}
