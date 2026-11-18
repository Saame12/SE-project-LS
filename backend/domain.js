import {scryptSync,randomBytes,timingSafeEqual} from 'node:crypto';
export function hash(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function verify(password,stored){const [salt,key]=stored.split(':');const actual=scryptSync(password,salt,64);return timingSafeEqual(actual,Buffer.from(key,'hex'));}
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export function check(ok,message,status=400){if(!ok)throw new HttpError(status,message);}
export function integer(value,min=1,max=99999){check(Number.isSafeInteger(Number(value))&&Number(value)>=min&&Number(value)<=max,'Số lượng không hợp lệ');return Number(value);}
export const transitions={pending:['confirmed'],confirmed:['processing'],processing:['ready','shipping'],ready:['received'],shipping:['received'],received:['completed']};
export function canTransition(from,to,fulfillment){return (transitions[from]||[]).includes(to)&&!(to==='ready'&&fulfillment!=='pickup')&&!(to==='shipping'&&fulfillment!=='delivery');}
export function tier(spend){return spend>=30000000?'Kim cương':spend>=10000000?'Vàng':'Thành viên';}
