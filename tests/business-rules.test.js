import test from 'node:test';
import assert from 'node:assert/strict';
import {canCancelOrder,commissionFor,promotionEligibility,ageOn,validPeriod} from '../backend/rules.js';
import {customerCanCancel} from '../client.js';
test('BR-43/44: trả trước hủy trước Finished; COD chỉ khi chưa thu tiền, frontend/backend đồng nhất',()=>{
 for(const method of ['cash','card','bank_transfer'])for(const state of ['pending','confirmed','processing','ready','shipping','received','completed','cancelled','returned','cancelling'])for(const paid of ['unpaid','paid']){
  const o={channel:'online',status:state,payment_method:method,payment_status:paid};
  const expected=!['completed','cancelled','returned','cancelling'].includes(state)&&(method!=='cash'||paid==='unpaid');
  assert.equal(canCancelOrder(o),expected);assert.equal(customerCanCancel(o),expected);
 }
 assert.equal(canCancelOrder({channel:'offline',status:'confirmed',payment_method:'cash',payment_status:'unpaid'}),false);
});
test('BR-37/38: nhân viên dưới 80%, 80–99%, từ 100% KPI nhận 0/50/100% cơ sở 5%',()=>{
 assert.equal(commissionFor({units:79,target:100,personalRevenue:10000000}).commission,0);
 assert.equal(commissionFor({units:80,target:100,personalRevenue:10000000}).commission,250000);
 assert.equal(commissionFor({units:99,target:100,personalRevenue:10000000}).commission,250000);
 assert.equal(commissionFor({units:100,target:100,personalRevenue:10000000}).commission,500000);
});
test('BR-40/42: quản lý đúng ba nhánh thay thế, không cộng dồn thưởng',()=>{
 const base={kind:'manager',target:100,personalRevenue:10000000,storeRevenue:100000000};
 assert.equal(commissionFor({...base,units:79}).commission,375000);
 assert.equal(commissionFor({...base,units:80}).commission,1250000);
 assert.equal(commissionFor({...base,units:100}).commission,2500000);
});
test('BR-31/32: điều kiện tuổi, giới tính, nghề nghiệp và kênh bán',()=>{
 const now=new Date('2026-11-18T12:00:00+07:00'),p={min_age:18,max_age:25,gender:'female',occupation:'Sinh viên',channel:'online'};
 assert.equal(ageOn('2008-11-18',now),18);assert.equal(ageOn('2008-11-19',now),17);
 assert.equal(promotionEligibility(p,{dob:'2008-11-18',gender:'female',occupation:'sinh viên'},'online',now),'');
 assert.ok(promotionEligibility(p,{gender:'female',occupation:'Sinh viên'},'online',now));
 assert.ok(promotionEligibility(p,{dob:'2008-11-19',gender:'female',occupation:'Sinh viên'},'online',now));
 assert.ok(promotionEligibility(p,{dob:'2005-01-01',gender:'male',occupation:'Sinh viên'},'online',now));
 assert.ok(promotionEligibility(p,{dob:'2005-01-01',gender:'female',occupation:'Sinh viên'},'offline',now));
 assert.throws(()=>validPeriod('2026-11-02'));assert.equal(validPeriod('2026-11-01'),'2026-11-01');
});
