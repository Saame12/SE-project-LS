import {readFile} from 'node:fs/promises';
import mysql from 'mysql2/promise';
import {config} from '../backend/db.js';
import {hash} from '../backend/domain.js';
import {migrate} from '../backend/migrations.js';
import {seedAcademic} from '../backend/academic-api.js';
const dbName=config.database;
if(!/^[a-zA-Z0-9_]+$/.test(dbName))throw Error('DB_NAME không hợp lệ');
const db=await mysql.createConnection({...config,database:undefined,multipleStatements:true});
try{
 await db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 await db.query(`USE \`${dbName}\``);
 await db.query(await readFile(new URL('../database/schema.sql',import.meta.url),'utf8'));
 await migrate(db);
 const [[{n}]]=await db.query('SELECT COUNT(*) n FROM users');
 if(n){console.log('Database đã có dữ liệu; giữ nguyên dữ liệu hiện có.');}else{
 await db.beginTransaction();
 await db.query('INSERT INTO stores(name,address) VALUES (?,?),(?,?)',['V0 TECH Quận 1','123 Nguyễn Thị Minh Khai, TP.HCM','V0 TECH Thủ Đức','45 Võ Văn Ngân, TP.HCM']);
 for(const [email,name,phone,role,store] of [['manager.q1@v0tech.vn','Trần Thu Lan','0901000111','manager',1],['manager.td@v0tech.vn','Nguyễn Minh An','0901000222','manager',2],['nam@example.com','Phạm Hoàng Nam','0903112233','customer',null],['ha@example.com','Võ Thanh Hà','0987445566','customer',null]])await db.execute('INSERT INTO users(email,password_hash,name,phone,role,store_id) VALUES(?,?,?,?,?,?)',[email,hash('Demo@12345'),name,phone,role,store]);
 const products=[['CPU-I9K','Intel Core i9-13900K','CPU','Intel',13990000,'cpu','24 nhân / 32 luồng · LGA1700 · Bảo hành 36 tháng'],['MB-Z790','ASUS ROG Strix Z790-F Gaming WiFi','Mainboard','ASUS',10490000,'mainboard','DDR5 · WiFi 6E · LGA1700'],['RAM-C32','Corsair Vengeance DDR5 32GB 6000MHz','RAM','Corsair',3290000,'ram','2 x 16GB · DDR5 · 6000MHz'],['VGA-4080','MSI RTX 4080 Gaming X Trio 16GB','VGA','MSI',28900000,'vga','16GB GDDR6X · PCIe 4.0'],['SSD-KC3','Kingston KC3000 2TB NVMe','SSD','Kingston',3990000,'ssd','PCIe 4.0 · 7000MB/s · Bảo hành 60 tháng'],['PSU-850','EVGA SuperNOVA 850 G6','Nguồn','EVGA',3490000,'psu','850W · 80 Plus Gold'],['CASE-AF','AeroFlow Mid Tower RGB','Vỏ case','AeroFlow',2190000,'case','ATX · Kính cường lực · 3 quạt RGB'],['COOL-AF','AeroFlow tản nhiệt khí 6 ống đồng','Tản nhiệt','AeroFlow',890000,'cooler','LGA1700 · AM4 · AM5'],['LCD-27','LG UltraGear 27 inch 2K','Màn hình','LG',4590000,'monitor','IPS · 165Hz · HDMI / DisplayPort'],['KEY-RZ','Combo phím chuột Razer Speed','Phím & chuột','Razer',2390000,'keyboard','Phím cơ · RGB · USB']];
 for(const name of [...new Set(products.map(p=>p[2]))])await db.execute('INSERT INTO categories(name) VALUES(?)',[name]);
 for(const name of [...new Set(products.map(p=>p[3]))])await db.execute('INSERT INTO brands(name) VALUES(?)',[name]);
 for(const [sku,name,cat,brand,price,image,specs] of products){const [r]=await db.execute('INSERT INTO products(sku,name,category_id,brand_id,price,image,specs) SELECT ?,?,c.id,b.id,?,?,? FROM categories c CROSS JOIN brands b WHERE c.name=? AND b.name=?',[sku,name,price,'IMG/'+image+'.png',specs,cat,brand]);for(const store of [1,2])await db.execute('INSERT INTO inventory(store_id,product_id,quantity,minimum) VALUES(?,?,?,?)',[store,r.insertId,store===1?(r.insertId===5?0:12+r.insertId):4+r.insertId,5]);}
 for(const store of [1,2])for(const [name,email,pos,rate] of [['Lê Minh Khoa','khoa','Nhân viên kho',0],['Bùi Anh Tuấn','tuan','Nhân viên bán hàng',1.5]])await db.execute('INSERT INTO staff(store_id,name,email,phone,position,commission_rate) VALUES(?,?,?,?,?,?)',[store,name,email+store+'@v0tech.vn','0902000222',pos,rate]);
 await db.query("INSERT INTO promotions(store_id,code,name,percent,min_total,max_discount,starts_at,ends_at) VALUES (NULL,'WELCOME10','Chào thành viên mới',10,1000000,500000,CURDATE()-INTERVAL 1 DAY,CURDATE()+INTERVAL 365 DAY),(1,'Q1SALE','Ưu đãi Quận 1',15,5000000,1500000,CURDATE()-INTERVAL 1 DAY,CURDATE()+INTERVAL 90 DAY)");
 for(const [code,user,store,staff,status,product,price,days] of [['DH-SEED-001',3,1,2,'completed',3,3290000,3],['DH-SEED-002',4,1,2,'pending',1,13990000,0],['DH-SEED-003',3,2,4,'completed',9,4590000,2]]){
 const [r]=await db.execute('INSERT INTO orders(code,user_id,store_id,staff_id,customer_name,phone,fulfillment,payment_method,payment_status,status,subtotal,total,commission_rate,created_at) SELECT ?,?,?,?,name,phone,?,?,?, ?,?,?,1.5,NOW()-INTERVAL ? DAY FROM users WHERE id=?',[code,user,store,staff,'pickup','cash',status==='completed'?'paid':'unpaid',status,price,price,days,user]);
 await db.execute('INSERT INTO order_items(order_id,product_id,name,quantity,price) SELECT ?,id,name,1,price FROM products WHERE id=?',[r.insertId,product]);
 await db.execute('UPDATE inventory SET quantity=quantity-1 WHERE store_id=? AND product_id=?',[store,product]);
 await db.execute('INSERT INTO order_history(order_id,actor_id,status,note) VALUES(?,?,?,?)',[r.insertId,store,status,'Dữ liệu kiểm thử ban đầu']);
 }
 await db.commit();console.log('Đã tạo schema và dữ liệu kiểm thử lưu thật trong MySQL. Mật khẩu các tài khoản demo: Demo@12345');
 }
 await migrate(db);await seedAcademic(db);
} catch(e){await db.rollback();throw e;}finally{await db.end();process.exit();}
