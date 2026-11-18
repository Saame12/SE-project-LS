import test from 'node:test';
import assert from 'node:assert/strict';
import {customerOrderProgress,customerOrderCard,orderStatusLabel} from '../client.js';
const fixture={id:42,user_id:3,code:'DH-TEST',status:'pending',channel:'online',fulfillment:'delivery',created_at:'2026-11-18T08:00:00Z',customer_name:'Khách thử',phone:'0903112233',address:'TP.HCM',store_name:'Quận 1',payment_method:'cash',payment_status:'unpaid',total:3290000,discount:0,items:[{name:'RAM DDR5',quantity:1}],requests:[],history:[]};
test('Ba mốc cốt lõi giữ bố cục cũ nhưng không ghi nhận Received khi mới đang giao',()=>{
 for(const status of ['pending','confirmed','processing','ready','shipping'])assert.deepEqual(customerOrderProgress({...fixture,status}).map(s=>s.reached),[true,false,false]);
 assert.deepEqual(customerOrderProgress({...fixture,status:'received'}).map(s=>s.reached),[true,true,false]);
 assert.deepEqual(customerOrderProgress({...fixture,status:'completed'}).map(s=>s.reached),[true,true,true]);
});
test('Đơn nhận tại cửa hàng dùng cùng mốc Received và thời gian thực',()=>{
 const steps=customerOrderProgress({...fixture,fulfillment:'pickup',status:'received',history:[{status:'received',created_at:'2026-11-18T09:00:00Z'}]});
 assert.equal(steps[1].text,'Đã nhận hàng');assert.equal(steps[1].at,'2026-11-18T09:00:00Z');assert.equal(steps[2].reached,false);
});
test('Hủy/trả kết thúc riêng và không tạo ngày giờ giả',()=>{
 for(const status of ['cancelled','returned']){const p=customerOrderProgress({...fixture,status});assert.equal(p.length,1);assert.equal(p[0].terminal,true);assert.equal(p[0].at,null);}
});
test('Escape dữ liệu khách/sản phẩm/ghi chú',()=>{
 const unsafe='<img src=x onerror=alert(1)>',html=customerOrderCard({...fixture,customer_name:unsafe,address:unsafe,items:[{name:unsafe,quantity:1}],requests:[{type:'cancel',status:'pending',reason:unsafe,note:unsafe}]});assert.ok(!html.includes(unsafe));assert.ok(html.includes('&lt;img'));
});
test('Khách thấy Chờ duyệt, Đang hủy rồi Đã hủy đúng các bước',()=>{
 const requests=[{type:'cancel',status:'pending',reason:'Đổi nhu cầu'}];assert.equal(orderStatusLabel({...fixture,status:'confirmed',requests}),'Chờ duyệt hủy');assert.equal(orderStatusLabel({...fixture,status:'cancelling',requests}),'Đang hủy');assert.equal(orderStatusLabel({...fixture,status:'cancelled'}),'Đã hủy');
 assert.ok(!customerOrderCard({...fixture,status:'cancelling',requests}).includes('data-action="cancel"'));
});
test('Đơn COD chưa thu tiền vẫn yêu cầu hủy khi đang giao, đã thu tiền thì không',()=>{
 assert.ok(customerOrderCard({...fixture,status:'shipping'}).includes('data-action="cancel"'));
 assert.ok(!customerOrderCard({...fixture,status:'received',payment_status:'paid'}).includes('data-action="cancel"'));
 assert.ok(customerOrderCard({...fixture,payment_method:'card'}).includes('data-action="pay-simulate"'));
});
