import {rows,pool} from './db.js';

// Additive, idempotent upgrades: preserve existing application data.
export async function migrate(db=pool){
  async function add(table,name,definition){
    const found=await rows('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',[table,name],db);
    if(!found.length)await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`);
  }
  const [role]=await rows("SELECT COLUMN_TYPE type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='role'",[],db);
  if(!role.type.includes("'employee'"))await db.query("ALTER TABLE users MODIFY role "+role.type.slice(0,-1)+",'employee') NOT NULL");
  const [method]=await rows("SELECT COLUMN_TYPE type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='payment_method'",[],db);
  if(!method.type.includes("'card'"))await db.query("ALTER TABLE orders MODIFY payment_method "+method.type.slice(0,-1)+",'card') NOT NULL");
  for(const [name,definition] of Object.entries({address:"VARCHAR(255) NOT NULL DEFAULT ''",dob:'DATE NULL',gender:"VARCHAR(20) NOT NULL DEFAULT ''",occupation:"VARCHAR(80) NOT NULL DEFAULT ''",staff_id:'INT NULL'}))await add('users',name,definition);
  const staffIndex=await rows("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='users_staff_unique'",[],db);
  if(!staffIndex.length)await db.query('ALTER TABLE users ADD UNIQUE KEY users_staff_unique(staff_id)');
  for(const [name,definition] of Object.entries({kind:"VARCHAR(20) NOT NULL DEFAULT 'sales'",monthly_target:'INT NOT NULL DEFAULT 10',kpi_basis:"VARCHAR(20) NOT NULL DEFAULT 'personal_units'"}))await add('staff',name,definition);
  for(const [name,definition] of Object.entries({channel:"VARCHAR(10) NOT NULL DEFAULT 'online'",completed_at:'DATETIME NULL'}))await add('orders',name,definition);
  for(const [name,definition] of Object.entries({min_age:'INT NULL',max_age:'INT NULL',gender:"VARCHAR(20) NOT NULL DEFAULT ''",occupation:"VARCHAR(80) NOT NULL DEFAULT ''",channel:"VARCHAR(10) NOT NULL DEFAULT 'all'"}))await add('promotions',name,definition);
  await db.query(`CREATE TABLE IF NOT EXISTS payment_records(id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,actor_id INT NOT NULL,method VARCHAR(30) NOT NULL,result VARCHAR(20) NOT NULL,amount DECIMAL(14,0) NOT NULL,reference VARCHAR(80) UNIQUE NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(actor_id) REFERENCES users(id))`);
  await db.query(`CREATE TABLE IF NOT EXISTS commission_sales(order_id INT PRIMARY KEY,store_id INT NOT NULL,staff_id INT NOT NULL,total DECIMAL(14,0) NOT NULL,units INT NOT NULL,recognized_at DATETIME NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(staff_id) REFERENCES staff(id),FOREIGN KEY(store_id) REFERENCES stores(id))`);
  await db.query(`CREATE TABLE IF NOT EXISTS staff_targets(staff_id INT NOT NULL,period DATE NOT NULL,target INT NOT NULL,kpi_basis VARCHAR(20) NOT NULL,PRIMARY KEY(staff_id,period),FOREIGN KEY(staff_id) REFERENCES staff(id))`);
  await rows("UPDATE orders SET completed_at=COALESCE((SELECT MIN(h.created_at) FROM order_history h WHERE h.order_id=orders.id AND h.status='completed'),created_at) WHERE status IN ('completed','returned') AND completed_at IS NULL",[],db);
  await rows("INSERT IGNORE INTO commission_sales(order_id,store_id,staff_id,total,units,recognized_at) SELECT o.id,o.store_id,o.staff_id,o.total,SUM(i.quantity),o.completed_at FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.completed_at IS NOT NULL AND o.staff_id IS NOT NULL GROUP BY o.id,o.store_id,o.staff_id,o.total,o.completed_at",[],db);
  await rows("UPDATE staff SET kind='warehouse' WHERE position LIKE '%kho%' AND kind='sales'",[],db);
}
