// Cloudflare Pages Function /api/new-hsk3
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are Cloudflare environment secrets.
// TEACHER_EMAILS: comma-separated allowlist for teacher dashboard access.
const reply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const isInt=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const validText=(x,min,max)=>typeof x==='string'&&x.trim().length>=min&&x.trim().length<=max;
async function sb(env,path,init={}){
 const url=env.SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Chưa cấu hình Supabase');
 const r=await fetch(url.replace(/\/$/,'')+path,{...init,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...(init.headers||{})}});
 if(!r.ok)throw Error('Supabase HTTP '+r.status);return r.status===204?null:r.json();
}
export async function onRequestPost({request,env}){
 try{
  const origin=request.headers.get('Origin');if(origin!==new URL(request.url).origin)return reply({error:'Nguồn gửi không hợp lệ'},403);
  if(Number(request.headers.get('Content-Length')||0)>12000)return reply({error:'Dữ liệu quá lớn'},413);
  const x=await request.json();
  if(!validText(x.student_name,2,100)||!validText(x.class_name,1,60)||!isInt(x.lesson,1,18)||!isInt(x.correct,0,500)||!isInt(x.total,1,500)||x.correct>x.total||!isInt(x.score,0,100)||x.score!==Math.round(x.correct*100/x.total))return reply({error:'Thông tin điểm không hợp lệ'},400);
  const data={student_name:x.student_name.trim(),class_name:x.class_name.trim(),lesson_number:x.lesson,set_number:1,correct_count:x.correct,total_questions:x.total,score_percent:x.score,source:'student_client_unverified'};
  await sb(env,'/rest/v1/new_hsk3_scores',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(data)});
  return reply({ok:true,success:true});
 }catch(e){return reply({error:'Không lưu được điểm'},500)}
}
export async function onRequestGet({request,env}){
 try{
  const auth=request.headers.get('Authorization')||'';if(!/^Bearer\s+\S+$/.test(auth))return reply({error:'Chưa đăng nhập'},401);
  const url=env.SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return reply({error:'Chưa cấu hình máy chủ'},500);
  const r=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{headers:{apikey:key,Authorization:auth}});
  if(!r.ok)return reply({error:'Phiên đăng nhập không hợp lệ'},401);
  const user=await r.json();const allowed=String(env.TEACHER_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(!allowed.length||!allowed.includes(String(user.email||'').toLowerCase()))return reply({error:'Tài khoản chưa được cấp quyền giáo viên'},403);
  const scores=await sb(env,'/rest/v1/new_hsk3_scores?select=*&order=created_at.desc&limit=1000');return reply({ok:true,scores});
 }catch(e){return reply({error:'Không tải được điểm'},500)}
}
