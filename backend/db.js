import 'dotenv/config';
import mysql from 'mysql2/promise';
export const config = {host:process.env.DB_HOST || '127.0.0.1',port:Number(process.env.DB_PORT || 3306),user:process.env.DB_USER || 'root',password:process.env.DB_PASSWORD || '',database:process.env.DB_NAME || 'v0_store',decimalNumbers:true,dateStrings:true,charset:'utf8mb4'};
export const pool=mysql.createPool({...config,connectionLimit:10});
export async function tx(fn){const c=await pool.getConnection();try{await c.beginTransaction();const result=await fn(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
export async function rows(sql,args=[],db=pool){const [r]=await db.execute(sql,args);return r;}
