import test from 'node:test';
import assert from 'node:assert/strict';
import {customerOrderProgress,customerOrderCard} from '../client.js';
const fixture = {id:42,code:'DH-TEST',status:'pending',fulfillment:'delivery',created_at:'2026-11-13T08:00:00Z',customer_name:'Khách thử',phone:'0903112233',address:'TP.HCM',store_name:'Quận 1',payment_method:'cash',payment_status:'unpaid',total:3290000,discount:0,items:[{name:'RAM DDR5',quantity:1}],requests:[],history:[]};
test('Lộ trình ba bước phản ánh đúng các trạng thái thật của đơn giao hàng',()=>{
  for(const status of ['pending','confirmed','processing'])assert.deepEqual(customerOrderProgress({...fixture,status}).map(s=>s.reached),[true,false,false]);
  assert.deepEqual(customerOrderProgress({...fixture,status:'shipping'}).map(s=>s.reached),[true,true,false]);
  assert.deepEqual(customerOrderProgress({...fixture,status:'completed'}).map(s=>s.reached),[true,true,true]);
});
test('Đơn nhận tại cửa hàng dùng mốc nhận hàng, không báo đang vận chuyển',()=>{
  const steps=customerOrderProgress({...fixture,fulfillment:'pickup',status:'ready',history:[{status:'ready',created_at:'2026-11-13T09:00:00Z'}]});
  assert.equal(steps[1].text,'Sẵn sàng nhận hàng');assert.equal(steps[1].at,'2026-11-13T09:00:00Z');assert.equal(steps[2].reached,false);
});
test('Đơn hủy/trả hiển thị kết thúc và không tự tạo thời điểm chưa có trong lịch sử',()=>{
  for(const status of ['cancelled','returned']){const steps=customerOrderProgress({...fixture,status});assert.equal(steps.length,1);assert.equal(steps[0].terminal,true);assert.equal(steps[0].at,null);}
  const steps=customerOrderProgress({...fixture,status:'completed'});assert.equal(steps[1].at,null);assert.equal(steps[2].at,null);
});
test('Dữ liệu tên, địa chỉ, mặt hàng và ghi chú được escape trước khi hiển thị',()=>{
  const unsafe='<img src=x onerror=alert(1)>';
  const html=customerOrderCard({...fixture,customer_name:unsafe,address:unsafe,items:[{name:unsafe,quantity:1}],requests:[{type:'cancel',status:'pending',reason:unsafe,note:unsafe}],history:[{status:'pending',created_at:fixture.created_at,actor:unsafe,note:unsafe}]});
  assert.ok(!html.includes(unsafe));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('Chờ duyệt'));
});
