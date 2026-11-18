import {rows,pool} from './db.js';
import {commissionFor} from './rules.js';
export async function recognizeCommission(db,orderId){
 await rows('UPDATE orders SET completed_at=COALESCE(completed_at,NOW()) WHERE id=?',[orderId],db);
 await rows('INSERT IGNORE INTO commission_sales(order_id,store_id,staff_id,total,units,recognized_at) SELECT o.id,o.store_id,o.staff_id,o.total,SUM(i.quantity),o.completed_at FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.id=? AND o.staff_id IS NOT NULL GROUP BY o.id,o.store_id,o.staff_id,o.total,o.completed_at',[orderId],db);
}
export async function commissionReport(storeId,from,to,db=pool){
 const people=await rows('SELECT * FROM staff WHERE store_id=? ORDER BY id',[storeId],db);
 const monthly=await rows("SELECT staff_id,DATE_FORMAT(recognized_at,'%Y-%m-01') period,COUNT(*) orders_count,SUM(total) revenue,SUM(units) units FROM commission_sales WHERE store_id=? AND recognized_at>=DATE_FORMAT(?,'%Y-%m-01') AND recognized_at<DATE_ADD(LAST_DAY(?),INTERVAL 1 DAY) GROUP BY staff_id,period",[storeId,from,to],db);
 const targets=await rows('SELECT t.* FROM staff_targets t JOIN staff s ON s.id=t.staff_id WHERE s.store_id=? AND t.period>=DATE_FORMAT(?,\'%Y-%m-01\') AND t.period<=?',[storeId,from,to],db);
 const periods=new Set(monthly.map(m=>m.period));
 if(!periods.size)periods.add(from.slice(0,7)+'-01');
 const details=[];
 for(const p of people){for(const period of periods){
   const own=monthly.find(m=>m.staff_id===p.id&&m.period===period)||{orders_count:0,revenue:0,units:0};
   const storeRows=monthly.filter(m=>m.period===period);
   const target=targets.find(t=>t.staff_id===p.id&&String(t.period instanceof Date?t.period.toLocaleDateString('en-CA'):t.period).slice(0,10)===period);
   const goal=target?.target??p.monthly_target,basis=target?.kpi_basis??p.kpi_basis;
   const units=basis==='store_units'?storeRows.reduce((sum,m)=>sum+m.units,0):own.units;
   const earned=p.kind==='warehouse'?{ratio:goal?units/goal:0,base:0,factor:0,bonusRate:0,commission:0}:commissionFor({kind:p.kind,units,target:goal,personalRevenue:own.revenue,storeRevenue:storeRows.reduce((sum,m)=>sum+m.revenue,0)});
   details.push({id:p.id,name:p.name,kind:p.kind,period,target:goal,kpi_basis:basis,units,personal_units:own.units,orders_count:own.orders_count,revenue:own.revenue,...earned});
 }}
 const staff=people.map(p=>({id:p.id,name:p.name,kind:p.kind,orders_count:details.filter(d=>d.id===p.id).reduce((s,d)=>s+d.orders_count,0),revenue:details.filter(d=>d.id===p.id).reduce((s,d)=>s+d.revenue,0),commission:details.filter(d=>d.id===p.id).reduce((s,d)=>s+d.commission,0)}));
 return {staff,details};
}
