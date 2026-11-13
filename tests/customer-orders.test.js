import test from 'node:test';
import assert from 'node:assert/strict';
import {customerOrderProgress,customerOrderCard,orderStatusLabel} from '../client.js';
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

test('Khách thấy Chờ duyệt hủy đến khi quản lý hoàn tất hủy, từ chối không gắn nhãn sai',()=>{
 const requests=[{type:'cancel',status:'pending',reason:'Đổi nhu cầu'}];
 for(const status of ['confirmed','processing'])assert.equal(orderStatusLabel({...fixture,status,requests}),'Chờ duyệt hủy');
 assert.equal(orderStatusLabel({...fixture,status:'cancelled',requests:[{type:'cancel',status:'approved'}]}),'Đã hủy');
 assert.equal(orderStatusLabel({...fixture,status:'confirmed',requests:[{type:'cancel',status:'rejected'}]}),'Đã xác nhận');
 assert.ok(customerOrderCard({...fixture,status:'confirmed',requests}).includes('Chờ duyệt hủy'));
});

test('Chờ xác nhận có Hủy đơn; đã xác nhận/chuẩn bị chỉ có Yêu cầu hủy',()=>{
 assert.ok(customerOrderCard(fixture).includes('>Hủy đơn</button>'));
 for(const status of ['confirmed','processing'])assert.ok(customerOrderCard({...fixture,status}).includes('>Yêu cầu hủy</button>'));
 for(const status of ['cancelled','returned'])assert.ok(!customerOrderCard({...fixture,status}).includes('data-action="cancel"'));
});
test('Đơn sẵn sàng nhận/đang giao chỉ hướng dẫn liên hệ cửa hàng, không có nút hủy',()=>{
 for(const status of ['ready','shipping']){
  const html=customerOrderCard({...fixture,status,store_address:'123 Nguyễn Trãi'});
  assert.ok(!html.includes('data-action="cancel"'));assert.ok(html.includes('không thể hủy trực tiếp'));assert.ok(html.includes('liên hệ'));assert.ok(html.includes('123 Nguyễn Trãi'));
 }
});

test('Chấp nhận hủy hiển thị Đang hủy, chưa phải Đã hủy và không cho gửi yêu cầu lại',()=>{
 const order={...fixture,status:'cancelling',requests:[{type:'cancel',status:'pending',reason:'Đổi nhu cầu'}],history:[{status:'cancelling',created_at:'2026-11-13T09:00:00Z'}]};
 assert.equal(orderStatusLabel(order),'Đang hủy');
 const steps=customerOrderProgress(order);assert.equal(steps.length,1);assert.equal(steps[0].text,'Cửa hàng đã chấp nhận hủy');assert.equal(steps[0].at,'2026-11-13T09:00:00Z');
 const html=customerOrderCard(order);assert.ok(!html.includes('data-action="cancel"'));assert.ok(html.includes('chờ hoàn tất'));
});
