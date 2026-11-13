import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import mysql from 'mysql2/promise';
import 'dotenv/config';
const database='v0_store_test_'+process.pid;
const env={...process.env,DB_NAME:database,PORT:'3010'};
const base='http://127.0.0.1:3010/api';
async function request(url,method='GET',body,cookie,scope){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(scope?{'X-Session-Scope':scope}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function login(email){const r=await request('/auth/login','POST',{email,password:'Demo@12345'});assert.equal(r.status,200,JSON.stringify(r.body));return r.cookie;}
const must=async(url,method,body,cookie,status=200,scope)=>{const r=await request(url,method,body,cookie,scope);assert.equal(r.status,status,`${method} ${url}: ${JSON.stringify(r.body)}`);return r.body;};
test('Luồng MySQL: phân quyền, giữ tồn đồng thời, mua/nhận/giao, hủy/trả, kho, nhân viên, ưu đãi và báo cáo', {timeout:60000},async()=>{
let child,db;
try{
const setup=spawnSync(process.execPath,['scripts/setup-db.js'],{env,encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});let log='';child.stderr.on('data',s=>log+=s);child.stdout.on('data',s=>log+=s);
await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server kiểm thử không khởi động: '+log)),5000);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',()=>{clearTimeout(timer);reject(Error('Server kiểm thử đã dừng: '+log));});child.stdout.on('data',s=>{if(s.toString().includes('V0 TECH:')){clearTimeout(timer);resolve();}});});
let healthy=false;for(let i=0;i<60;i++){try{const r=await request('/health');if(r.status===200){healthy=true;break;}}catch{}await delay(100);}assert.ok(healthy,log);
const customer=await login('nam@example.com'),manager=await login('manager.q1@v0tech.vn'),other=await login('manager.td@v0tech.vn'),ha=await login('ha@example.com');
assert.equal((await request('/manager/data','GET',undefined,customer)).status,403);
assert.equal((await request('/orders','GET')).status,401);
assert.equal((await fetch('http://127.0.0.1:3010/.env')).status,404);
assert.equal((await fetch('http://127.0.0.1:3010/database/schema.sql')).status,404);
assert.equal((await request('/auth/login','POST',{email:'nam@example.com',password:'Wrong@12345'})).status,401);
// Same browser sends both cookies: each page must retain its own identity.
const managerSession=await login('manager.q1@v0tech.vn');
const bothCookies=customer+'; '+managerSession;
assert.equal((await request('/me','GET',undefined,bothCookies,'customer')).body.email,'nam@example.com');
assert.equal((await request('/me','GET',undefined,bothCookies,'manager')).body.email,'manager.q1@v0tech.vn');
assert.equal((await request('/me','GET',undefined,manager,'customer')).body,null);
assert.equal((await request('/orders','POST',{},bothCookies,'manager')).status,403);
assert.equal((await request('/auth/login','POST',{email:'manager.q1@v0tech.vn',password:'Demo@12345'},bothCookies,'customer')).status,403);
assert.equal((await request('/me','GET',undefined,bothCookies,'customer')).body.id,3);
assert.equal((await request('/auth/logout','POST',undefined,bothCookies,'manager')).status,200);
assert.equal((await request('/me','GET',undefined,bothCookies,'customer')).body.id,3);
assert.equal((await request('/me','GET',undefined,bothCookies,'manager')).body,null);
const catalog=await must('/catalog?store=1','GET');assert.equal(catalog.products.length,10);assert.equal(catalog.products.find(p=>p.id===5).quantity,0);
const payload=(product=3,fulfillment='pickup')=>({store_id:1,customer_name:'Kiểm thử API',phone:'0903112233',address:fulfillment==='delivery'?'123 Nguyễn Trãi, TP.HCM':'',fulfillment,payment_method:'cash',items:[{product_id:product,quantity:1}]});
assert.equal((await request('/orders','POST',payload(5),customer)).status,409);
assert.equal((await request('/orders','POST',{...payload(),items:[{product_id:3,quantity:-1}]},customer)).status,400);
const before=catalog.products.find(p=>p.id===3).quantity;
assert.equal((await request('/orders','POST',{...payload(),expected_customer_id:4},customer,'customer')).status,409);
assert.equal((await request('/catalog?store=1')).body.products.find(p=>p.id===3).quantity,before);
const order=await must('/orders','POST',{...payload(),promo_code:'WELCOME10',total:1},customer+'; '+manager,201,'customer');assert.equal(order.total,2961000);
const after=await must('/catalog?store=1','GET');assert.equal(after.products.find(p=>p.id===3).quantity,before-1);
assert.equal((await request(`/manager/orders/${order.id}`,'PATCH',{status:'confirmed'},other)).status,404);
const mine=await must('/orders','GET',undefined,ha);assert.ok(!mine.some(o=>o.id===order.id));
assert.equal((await request(`/orders/${order.id}/requests`,'POST',{type:'cancel',reason:'Kiểm thử'},ha)).status,404);
assert.equal((await request(`/manager/orders/${order.id}`,'PATCH',{status:'completed'},manager)).status,400);
await must(`/manager/orders/${order.id}`,'PATCH',{staff_id:2},manager);
await must(`/manager/orders/${order.id}`,'PATCH',{status:'confirmed'},manager);
await must(`/manager/orders/${order.id}`,'PATCH',{status:'processing'},manager);
assert.equal((await request(`/manager/orders/${order.id}`,'PATCH',{status:'shipping'},manager)).status,400);
await must(`/manager/orders/${order.id}`,'PATCH',{status:'ready'},manager);
assert.equal((await request(`/manager/orders/${order.id}`,'PATCH',{status:'completed'},manager)).status,400);
await must(`/manager/orders/${order.id}`,'PATCH',{payment_status:'paid'},manager);
await must(`/manager/orders/${order.id}`,'PATCH',{status:'completed'},manager);
const report=await must('/manager/reports','GET',undefined,manager);assert.equal(report.summary.revenue,3290000+2961000);assert.equal(report.staff.find(s=>s.id===2).commission,93765);
await must(`/orders/${order.id}/requests`,'POST',{type:'return',reason:'Trả toàn bộ đơn kiểm thử'},customer,201);
let detail=(await must('/orders','GET',undefined,manager)).find(o=>o.id===order.id);let rid=detail.requests[0].id;
assert.equal((await request(`/manager/requests/${rid}/resolve`,'POST',{decision:'approved',note:'Kiểm nhận'},other)).status,404);
await must(`/manager/requests/${rid}/resolve`,'POST',{decision:'approved',note:'Đã kiểm nhận đủ hàng và hoàn tiền thủ công'},manager);
assert.equal((await request(`/manager/requests/${rid}/resolve`,'POST',{decision:'approved',note:'Lặp lại'},manager)).status,409);
assert.equal((await must('/catalog?store=1','GET')).products.find(p=>p.id===3).quantity,before);
detail=(await must('/orders','GET',undefined,customer)).find(o=>o.id===order.id);assert.equal(detail.status,'returned');assert.equal(detail.payment_status,'refunded');assert.ok(detail.history.length>=8);
assert.equal((await must('/manager/reports','GET',undefined,manager)).summary.revenue,3290000);
const cancel=await must('/orders','POST',payload(1),customer,201);
await must(`/orders/${cancel.id}/requests`,'POST',{type:'cancel',reason:'Đổi nhu cầu'},customer,201);
let cancelDetail=(await must('/orders','GET',undefined,manager)).find(o=>o.id===cancel.id);
await must(`/manager/requests/${cancelDetail.requests[0].id}/resolve`,'POST',{decision:'approved',note:'Duyệt hủy'},manager);
assert.equal((await must('/orders','GET',undefined,customer)).find(o=>o.id===cancel.id).status,'cancelled');
const delivery=await must('/orders','POST',payload(2,'delivery'),customer,201);
await must(`/manager/orders/${delivery.id}`,'PATCH',{staff_id:2,status:'confirmed'},manager);
await must(`/manager/orders/${delivery.id}`,'PATCH',{status:'processing'},manager);
await must(`/manager/orders/${delivery.id}`,'PATCH',{status:'shipping'},manager);
await must(`/manager/orders/${delivery.id}`,'PATCH',{payment_status:'paid',status:'completed'},manager);
await must('/manager/inventory','POST',{product_id:8,quantity:1,note:'Kiểm thử tranh tồn'},manager);
const concurrency=await Promise.all([request('/orders','POST',payload(8),customer),request('/orders','POST',payload(8),ha)]);assert.deepEqual(concurrency.map(r=>r.status).sort(),[201,409]);assert.equal((await must('/catalog?store=1','GET')).products.find(p=>p.id===8).quantity,0);
await must('/manager/replenishments','POST',{product_id:5,quantity:20,note:'Bổ sung SSD'},manager,201);
await must('/manager/staff','POST',{name:'Nhân viên mới',email:'new@v0tech.vn',phone:'0901234567',position:'Bán hàng',commission_rate:2,active:true},manager);
await must('/manager/promotions','POST',{code:'TEST20',name:'Ưu đãi kiểm thử',percent:20,min_total:0,max_discount:1000000,starts_at:'2026-01-01',ends_at:'2099-12-31',active:true},manager);
assert.ok((await must('/catalog?store=1','GET')).promotions.some(p=>p.code==='TEST20'));assert.ok(!(await must('/catalog?store=2','GET')).promotions.some(p=>p.code==='TEST20'));
const md=await must('/manager/data','GET',undefined,manager);assert.ok(md.replenishments.some(r=>r.quantity===20));assert.ok(md.staff.some(s=>s.email==='new@v0tech.vn'));assert.ok(md.movements.length>=5);
assert.equal((await request('/manager/staff','POST',{id:4,name:'X',email:'x@a.vn',phone:'0901234567',position:'x',commission_rate:1},manager)).status,404);
await must('/auth/register','POST',{name:'Khách mới',email:'new@example.com',phone:'0901234567',password:'New@12345'},undefined,201);
console.log('PASS: Các luồng dữ liệu MySQL và phân quyền hoạt động; database kiểm thử được xóa sau khi chạy.');
}finally{
if(child){child.kill();await new Promise(resolve=>child.once('exit',resolve));}
db=await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||''});await db.query(`DROP DATABASE IF EXISTS \`${database}\``);await db.end();
}
});

