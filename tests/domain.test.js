import test from 'node:test';
import assert from 'node:assert/strict';
import {hash,verify,canTransition,tier,integer} from '../backend/domain.js';
test('Password hash có salt và kiểm tra đúng/sai',()=>{const a=hash('Demo@12345'),b=hash('Demo@12345');assert.notEqual(a,b);assert.equal(verify('Demo@12345',a),true);assert.equal(verify('wrong',a),false);});
test('Chặn bỏ bước và nhầm luồng giao/nhận',()=>{assert.equal(canTransition('pending','completed','pickup'),false);assert.equal(canTransition('processing','shipping','pickup'),false);assert.equal(canTransition('processing','ready','delivery'),false);assert.equal(canTransition('processing','ready','pickup'),true);assert.equal(canTransition('cancelled','confirmed','pickup'),false);});
test('Hạng thành viên và số lượng đầu vào',()=>{assert.equal(tier(0),'Thành viên');assert.equal(tier(10000000),'Vàng');assert.equal(tier(30000000),'Kim cương');assert.throws(()=>integer(-1));assert.throws(()=>integer(1.5));assert.equal(integer(0,0),0);});
