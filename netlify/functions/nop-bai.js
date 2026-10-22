const bai58Answers = [{"type": "mc", "answer": "b", "explain": "麦克 nói: 我有点儿饿了，想吃点儿什么。饿了 nghĩa là đói rồi."}, {"type": "mc", "answer": "c", "explain": "玛丽 nói: 我又饿又渴。又……又…… nối hai đặc điểm/trạng thái: vừa đói vừa khát."}, {"type": "mc", "answer": "a", "explain": "玛丽 trả lời: 你点吧，什么都可以。什么都可以 = món gì cũng được."}, {"type": "mc", "answer": "d", "explain": "麦克 muốn gọi hai món ngon nhất ở nhà hàng: 把你们这儿最好吃的菜给我们来两个。"}, {"type": "mc", "answer": "b", "explain": "服务员 giới thiệu 麻婆豆腐 và 糖醋鱼都不错 — đậu phụ Mapo và cá sốt chua ngọt đều khá ngon."}, {"type": "mc", "answer": "c", "explain": "山田 nói: 除了骑自行车以外，怎么去都行 — ngoài đi xe đạp ra, đi bằng cách nào cũng được."}, {"type": "mc", "answer": "a", "explain": "山田 nói nếu không mua được vé tàu thì sẽ đi máy bay: 要是买不到火车票，就坐飞机去。"}, {"type": "mc", "answer": "d", "explain": "山田 dự định đi 西安 xem 碑林和兵马俑, sau đó đến 重庆, rồi đi 苏州、杭州, cuối cùng 桂林和云南."}, {"type": "mc", "answer": "b", "explain": "从重庆坐船游览长江三峡: từ Trùng Khánh đi thuyền tham quan Tam Hiệp Trường Giang."}, {"type": "mc", "answer": "c", "explain": "“上有天堂，下有苏杭” là câu nói trong bài để khen Tô Châu và Hàng Châu rất đẹp."}, {"type": "fill", "answer": "随便", "explain": "玛丽 trả lời: 随便。你想喝什么就喝什么吧。随便 nghĩa là tùy ý, sao cũng được."}, {"type": "fill", "answer": "要是", "explain": "Mẫu điều kiện trong bài: 要是……，就……，nghĩa là nếu… thì…。"}, {"type": "fill", "answer": "除了", "explain": "Cấu trúc trong bài: 除了骑自行车以外，怎么去都行。"}, {"type": "order", "answer": "我先去西安看看碑林和兵马俑", "explain": "Trật tự câu trong bài: 我先去西安看看碑林和兵马俑。先……再……然后……最后…… dùng để kể trình tự."}, {"type": "order", "answer": "你想喝什么就喝什么吧", "explain": "“你想喝什么就喝什么吧” nghĩa là bạn muốn uống gì thì cứ uống nấy. Mẫu 什么……就……什么 biểu thị lựa chọn tương ứng."}];
const sets59 = {1: require('./data/bai59-de1.json'),2: require('./data/bai59-de2.json'),3: require('./data/bai59-de3.json'),4: require('./data/bai59-de4.json'),5: require('./data/bai59-de5.json')};
const sets46 = {1: require('./data/bai46-de1.json'),2: require('./data/bai46-de2.json'),3: require('./data/bai46-de3.json'),4: require('./data/bai46-de4.json'),5: require('./data/bai46-de5.json')};
const sets47 = {1: require('./data/bai47-de1.json'),2: require('./data/bai47-de2.json'),3: require('./data/bai47-de3.json'),4: require('./data/bai47-de4.json'),5: require('./data/bai47-de5.json')};
const sets48 = Object.fromEntries([1,2,3,4,5].map(n => [n, require('./data/bai48-de'+n+'.json')]));
const sets49 = Object.fromEntries([1,2,3,4,5].map(n => [n, require('./data/bai49-de'+n+'.json')]));
const sets50 = Object.fromEntries([1,2,3,4,5].map(n => [n, require('./data/bai50-de'+n+'.json')]));
const sets60 = {
  1: require('./data/bai60-de1.json'),
  2: require('./data/bai60-de2.json'),
  3: require('./data/bai60-de3.json'),
  4: require('./data/bai60-de4.json'),
  5: require('./data/bai60-de5.json')
};
const normalize = s => String(s).toLowerCase().replace(/[，。！？、,.!?；;：:\s]/g,'').replace(/[\u200b-\u200d\ufeff]/g,'');
const reply=(status,obj)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(obj)});
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'Chỉ hỗ trợ gửi bài.'});
 if((event.body||'').length>20000)return reply(413,{error:'Dữ liệu quá lớn.'});
 let data;try{data=JSON.parse(event.body||'{}')}catch{return reply(400,{error:'Dữ liệu không hợp lệ.'})}
 const ten=String(data.ten_hoc_sinh||'').trim(),lop=String(data.lop||'').trim();
 const lesson=data.bai_hoc,soDe=Number(data.so_de);
 const is58=lesson==='Bài 58'&&(data.so_de===undefined||data.so_de===null);
    const is46=lesson==='Bài 46'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
  const is47=lesson==='Bài 47'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
const is48=lesson==='Bài 48'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
const is49=lesson==='Bài 49'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
const is50=lesson==='Bài 50'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
  const is59=lesson==='Bài 59'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
 const is60=lesson==='Bài 60'&&Number.isInteger(soDe)&&soDe>=1&&soDe<=5;
   const questions=is46?sets46[soDe]:is47?sets47[soDe]:is48?sets48[soDe]:is49?sets49[soDe]:is50?sets50[soDe]:is58?bai58Answers:is59?sets59[soDe]:is60?sets60[soDe]:null;
 if(!ten||ten.length>80||!lop||lop.length>40||!questions||!Array.isArray(data.answers)||data.answers.length!==questions.length||data.answers.some(a=>typeof a!=='string'||a.length>500))return reply(400,{error:'Thông tin học sinh hoặc bài làm không hợp lệ.'});
 const details=questions.map((a,i)=>({correct:!!data.answers[i].trim()&&String(a.answer).split('|').some(v=>normalize(v)===normalize(data.answers[i])),answer:String(a.answer).split('|')[0],explain:a.explain}));
 const correctCount=details.filter(d=>d.correct).length,emptyCount=data.answers.filter(v=>!v.trim()).length,score=Math.round(correctCount/questions.length*100);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return reply(503,{error:'Giáo viên chưa cấu hình kết nối Supabase.'});
 try{
  const record={ten_hoc_sinh:ten,lop,bai_hoc:lesson,diem:score};
  if(is46 || is47 || is48 || is49 || is50 || is59 || is60)record.so_de=soDe;
  const res=await fetch(url.replace(/\/$/,'')+'/rest/v1/ket_qua_hoc_sinh',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(record)});
  if(!res.ok){console.error('Supabase insert error',res.status,(await res.text()).slice(0,500));return reply(502,{error:'Không ghi được điểm vào Supabase. Giáo viên cần kiểm tra cấu hình.'})}
  const saved=await res.json();return reply(200,{saved:true,score,correctCount,emptyCount,details,recordId:saved[0]?.id??'—'});
 }catch(e){console.error('Save failed',e);return reply(502,{error:'Lỗi kết nối cơ sở dữ liệu.'})}
};
