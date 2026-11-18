import {check} from './domain.js';
export function canCancelOrder(o){
  if(o.channel==='offline'||!['pending','confirmed','processing','ready','shipping','received'].includes(o.status))return false;
  return o.payment_method!=='cash'||o.payment_status==='unpaid';
}
export function ageOn(dob,now=new Date()){
 if(!dob)return null;
 const d=new Date(dob);if(Number.isNaN(d.getTime()))return null;
 return now.getFullYear()-d.getFullYear()-(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate())?1:0);
}
export function promotionEligibility(p,user,channel='online',now=new Date()){
 if(p.channel&&p.channel!=='all'&&p.channel!==channel)return 'Khuyến mãi không áp dụng cho kênh bán này';
 const age=ageOn(user.dob,now);
 if((p.min_age!==null&&p.min_age!==undefined)||(p.max_age!==null&&p.max_age!==undefined)){
  if(age===null)return 'Cần cập nhật ngày sinh trong hồ sơ để dùng mã này';
  if(p.min_age!==null&&p.min_age!==undefined&&age<p.min_age)return 'Chưa đủ tuổi áp dụng mã';
  if(p.max_age!==null&&p.max_age!==undefined&&age>p.max_age)return 'Vượt độ tuổi áp dụng mã';
 }
 if(p.gender&&p.gender!==user.gender)return 'Giới tính trong hồ sơ không đáp ứng điều kiện mã';
 if(p.occupation&&p.occupation.toLocaleLowerCase('vi-VN')!==(user.occupation||'').trim().toLocaleLowerCase('vi-VN'))return 'Nghề nghiệp trong hồ sơ không đáp ứng điều kiện mã';
 return '';
}
export function commissionFor({kind='sales',units=0,target=0,personalRevenue=0,storeRevenue=0}){
 const ratio=target>0?units/target:0;
 const factor=kind==='manager'?(ratio<.8?.75:ratio<1?.5:1):(ratio<.8?0:ratio<1?.5:1);
 const bonusRate=kind==='manager'?(ratio<.8?0:ratio<1?.01:.02):0;
 const base=Math.round(personalRevenue*.05),commission=Math.round(base*factor)+Math.round(storeRevenue*bonusRate);
 return {ratio,base,factor,bonusRate,commission};
}
export function validPeriod(period){check(/^\d{4}-(0[1-9]|1[0-2])-01$/.test(period),'Kỳ KPI phải là ngày đầu tháng YYYY-MM-01');return period;}
