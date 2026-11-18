import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import mysql from 'mysql2/promise';
import 'dotenv/config';
const database='v0_store_test_'+process.pid,env={...process.env,DB_NAME:database,PORT:'3010'},base='http://127.0.0.1:3010/api';
async function request(url,method='GET',body,cookie,scope){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(scope?{'X-Session-Scope':scope}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const must=async(url,method='GET',body,cookie,status=200,scope)=>{const r=await request(url,method,body,cookie,scope);assert.equal(r.status,status,method+' '+url+': '+JSON.stringify(r.body));return r.body;};
async function login(email,password='Demo@12345',scope){const r=await request('/auth/login','POST',{email,password},undefined,scope);assert.equal(r.status,200,JSON.stringify(r.body));return r.cookie;}
test('Phạm vi chính: MySQL, quyền cửa hàng, online/offline, thanh toán, hủy/trả, KPI, hồ sơ và ưu đãi',{timeout:90000},async()=>{
 let child,db;
 try{
  const setup=spawnSync(process.execPath,['scripts/setup-db.js'],{env,encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
  child=spawn(process.execPath,['server.js'],{env,stdio:['ignore','pipe','pipe']});let log='';child.stderr.on('data',s=>log+=s);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server không khởi động: '+log)),10000);child.once('error',reject);child.once('exit',()=>{clearTimeout(timer);reject(Error(log));});child.stdout.on('data',s=>{if(s.toString().includes('V0 TECH:')){clearTimeout(timer);resolve();}});});
  const c=await login('nam@example.com'),h=await login('ha@example.com'),m=await login('manager.q1@v0tech.vn'),other=await login('manager.td@v0tech.vn'),employee=await login('staff.q1@v0tech.vn'),employeeOther=await login('staff.td@v0tech.vn');
  assert.equal((await request('/manager/data','GET',undefined,c)).status,403);assert.equal((await request('/orders')).status,401);assert.equal((await fetch('http://127.0.0.1:3010/.env')).status,404);
  const jar=c+'; '+m+'; '+employee;
  assert.equal((await must('/me','GET',undefined,jar,200,'customer')).role,'customer');assert.equal((await must('/me','GET',undefined,jar,200,'manager')).role,'manager');assert.equal((await must('/me','GET',undefined,jar,200,'employee')).role,'employee');
  assert.equal((await request('/manager/inventory','POST',{product_id:3,quantity:999,note:'Không có quyền'},employee)).status,403);
  const payload=(p=3,method='cash',fulfillment='pickup')=>({store_id:1,customer_name:'Khách kiểm thử',phone:'0903112233',address:'123 Nguyễn Trãi',fulfillment,payment_method:method,items:[{product_id:p,quantity:1}]});
  const get=async(id,cookie=c)=>(await must('/orders','GET',undefined,cookie)).find(o=>o.id===id);
  const step=async(id,status)=>must('/manager/orders/'+id,'PATCH',{status},m);
  const assign=async id=>must('/manager/orders/'+id,'PATCH',{staff_id:2},m);
  const received=async(id,fulfillment='pickup')=>{await step(id,'confirmed');await step(id,'processing');await step(id,fulfillment==='pickup'?'ready':'shipping');await step(id,'received');};
  // Profile and eligibility use authenticated customer information, not checkout spoofing.
  await must('/me','PUT',{name:'Phạm Hoàng Nam',email:'nam@example.com',phone:'0903112233',address:'Q1',dob:'2004-01-01',gender:'male',occupation:'Sinh viên'},c);
  assert.equal((await must('/me','GET',undefined,c)).occupation,'Sinh viên');
  await must('/manager/promotions','POST',{code:'STUDENT',name:'Sinh viên',percent:10,min_total:0,max_discount:500000,starts_at:'2026-01-01',ends_at:'2099-12-31',min_age:18,max_age:30,gender:'male',occupation:'Sinh viên',channel:'all',active:true},m);
  assert.equal((await request('/orders','POST',{...payload(),promo_code:'STUDENT',dob:'2004-01-01',gender:'male',occupation:'Sinh viên'},h)).status,400);
  assert.equal((await request('/orders','POST',payload(5),c)).status,409);
  const prepaid=await must('/orders','POST',{...payload(3,'card'),promo_code:'STUDENT',total:1},c,201);assert.equal(prepaid.total,2961000);
  assert.equal((await get(prepaid.id,h)),undefined);
  assert.equal((await request('/manager/orders/'+prepaid.id,'PATCH',{staff_id:2,status:'confirmed'},other)).status,404);
  await assign(prepaid.id);
  assert.equal((await request('/manager/orders/'+prepaid.id,'PATCH',{status:'confirmed'},m)).status,409);
  await must('/orders/'+prepaid.id+'/pay-simulate','POST',{outcome:'failure'},c);assert.equal((await get(prepaid.id)).payment_status,'unpaid');
  await must('/orders/'+prepaid.id+'/pay-simulate','POST',{outcome:'success'},c);assert.equal((await get(prepaid.id)).payment_status,'paid');
  assert.equal((await request('/orders/'+prepaid.id+'/pay-simulate','POST',{outcome:'success'},c)).status,409);
  await received(prepaid.id);
  await step(prepaid.id,'completed');assert.equal((await get(prepaid.id)).status,'completed');
  // Set a monthly target to expose the 5% award. Recognition is not removed by returns.
  const period=new Date().toLocaleDateString('en-CA').slice(0,7)+'-01';
  await must('/manager/staff/2/target','POST',{period,target:1,kpi_basis:'personal_units'},m);
  const beforeReturn=await must('/manager/reports','GET',undefined,m),earned=beforeReturn.staff.find(s=>s.id===2).commission;
  assert.ok(earned>0);assert.equal(beforeReturn.staff.find(s=>s.id===2).revenue,3290000+2961000);
  await must('/orders/'+prepaid.id+'/requests','POST',{type:'return',reason:'Trả hàng kiểm thử'},c,201);
  let o=await get(prepaid.id);await must('/manager/requests/'+o.requests[0].id+'/resolve','POST',{decision:'approved',note:'Đã nhận hàng và xử lý hoàn tiền mô phỏng'},m);
  const afterReturn=await must('/manager/reports','GET',undefined,m);assert.equal(afterReturn.staff.find(s=>s.id===2).commission,earned);assert.equal(afterReturn.summary.revenue,3290000);
  // COD: Received is separate from payment and Finished.
  const cod=await must('/orders','POST',payload(1,'cash','delivery'),c,201);await assign(cod.id);
  assert.equal((await request('/manager/orders/'+cod.id,'PATCH',{payment_status:'paid'},m)).status,409);
  await received(cod.id,'delivery');assert.equal((await get(cod.id)).payment_status,'unpaid');
  assert.equal((await request('/manager/orders/'+cod.id,'PATCH',{status:'completed'},m)).status,400);
  await must('/manager/orders/'+cod.id,'PATCH',{payment_status:'paid'},m);
  assert.equal((await request('/orders/'+cod.id+'/requests','POST',{type:'cancel',reason:'COD đã thu tiền'},c)).status,409);
  await step(cod.id,'completed');
  // Prepaid may request cancellation while shipping; COD may request while unpaid.
  for(const method of ['cash','bank_transfer']){
   const cancel=await must('/orders','POST',payload(10,method,'delivery'),c,201);await assign(cancel.id);
   if(method!=='cash')await must('/orders/'+cancel.id+'/pay-simulate','POST',{outcome:'success'},c);
   await step(cancel.id,'confirmed');await step(cancel.id,'processing');await step(cancel.id,'shipping');
   await must('/orders/'+cancel.id+'/requests','POST',{type:'cancel',reason:'Hủy trước Finished theo BR-43/44'},c,201);
   o=await get(cancel.id);assert.equal(o.status,'shipping');
   assert.equal((await request('/manager/requests/'+o.requests[0].id+'/resolve','POST',{decision:'approved',note:'Bỏ qua chấp nhận'},m)).status,409);
   await must('/manager/orders/'+cancel.id+'/accept-cancel','POST',{},m);
   assert.equal((await request('/manager/orders/'+cancel.id,'PATCH',{status:'received'},m)).status,409);
   await must('/manager/requests/'+o.requests[0].id+'/resolve','POST',{decision:'approved',note:'Hoàn tất hủy'},m);
   assert.equal((await get(cancel.id)).status,'cancelled');
   assert.equal((await request('/manager/requests/'+o.requests[0].id+'/resolve','POST',{decision:'approved',note:'Lặp'},m)).status,409);
  }
  // Employee creates/owns offline bill; another store/employee cannot advance it.
  const offline={customer_name:'Khách tại quầy',phone:'0901234567',payment_method:'cash',items:[{product_id:3,quantity:1}]};
  assert.equal((await request('/employee/orders','POST',offline,c)).status,403);
  assert.equal((await request('/employee/orders','POST',{...offline,promo_code:'STUDENT',dob:'2004-01-01',gender:'male',occupation:'Sinh viên'},employee)).status,400);
  const bill=await must('/employee/orders','POST',{...offline,promo_code:'STUDENT',dob:'2004-01-01',gender:'male',occupation:'Sinh viên',eligibility_confirmed:true},employee,201);
  assert.ok(bill.code.startsWith('POS-'));assert.equal((await get(bill.id,m)).channel,'offline');assert.equal((await get(bill.id,m)).staff_id,2);
  assert.equal((await request('/employee/orders/'+bill.id+'/received','POST',{},employeeOther)).status,404);
  await must('/employee/orders/'+bill.id+'/received','POST',{},employee);await must('/manager/orders/'+bill.id,'PATCH',{payment_status:'paid',status:'completed'},m);
  assert.ok((await must('/employee/data','GET',undefined,employee)).commission.some(d=>d.commission>0));
  assert.equal((await get(bill.id,c)),undefined);
  // Missing HQ processing is intentionally represented by an awaiting request.
  await must('/manager/replenishments','POST',{product_id:5,quantity:20,note:'Bổ sung SSD'},m,201);assert.ok((await must('/manager/data','GET',undefined,m)).replenishments.some(r=>r.status==='pending'));
  // Do not oversell the last available item.
  await must('/manager/inventory','POST',{product_id:8,quantity:1,note:'Kiểm thử tranh tồn'},m);
  const concurrent=await Promise.all([request('/orders','POST',payload(8),c),request('/orders','POST',payload(8),h)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
  assert.equal((await must('/catalog?store=1')).products.find(p=>p.id===8).quantity,0);
  // Inactive employee accounts immediately lose access.
  const staff=(await must('/manager/data','GET',undefined,m)).staff.find(p=>p.id===2);
  await must('/manager/staff','POST',{...staff,active:false},m);assert.equal((await request('/employee/data','GET',undefined,employee)).status,401);
  // Re-running upgrades/seed on an existing database must preserve real workflow data.
  const beforeUpgrade=(await must('/orders','GET',undefined,m)).length;
  const reseed=spawnSync(process.execPath,['scripts/setup-db.js'],{env,encoding:'utf8'});assert.equal(reseed.status,0,reseed.stderr);
  assert.equal((await must('/orders','GET',undefined,m)).length,beforeUpgrade);
  assert.equal((await request('/employee/data','GET',undefined,employee)).status,401);
  // Password changes revoke other sessions without exposing hashes.
  await must('/me/password','POST',{current_password:'Demo@12345',new_password:'Changed@12345'},c);
  const newSession=await login('nam@example.com','Changed@12345');assert.equal((await must('/me','GET',undefined,newSession)).email,'nam@example.com');
  console.log('PASS: nghiệp vụ chính theo hai tài liệu, không triển khai các phân hệ mở rộng.');
 }finally{
  if(child&&child.exitCode===null){child.kill();await new Promise(resolve=>child.once('exit',resolve));}
  db=await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||''});await db.query('DROP DATABASE IF EXISTS `'+database+'`');await db.end();
 }
});
