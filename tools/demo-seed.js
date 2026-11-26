// Builds demo/seed.json: the app's own blank template (as created on first load) + sample data.
// Usage: serve the repo on :8765, then: node tools/demo-seed.js
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('http://localhost:8765/demo/?noseed=1');await p.waitForTimeout(1500);
const S=JSON.parse(await p.evaluate(()=>localStorage.getItem('wedding-demo-v1')));await b.close();
let n=0;const id=()=>'demo'+(n++).toString(36).padStart(3,'0');const t=Date.now();
Object.assign(S.settings,{date:'2027-06-10',venue:'גן אירועים "השקמה"',budget:180000,platePrice:320,minPlates:250,venuePaid:20000,giftAvg:450});
const G=[['שרה כהן','a','משפחה',2,'yes',2,'1'],['דוד כהן','a','משפחה',2,'yes',2,'1'],['רחל לוי','b','משפחה',2,'yes',2,'2'],['משה לוי','b','משפחה',3,'maybe',0,''],
['תמר אברהם','a','חברים',2,'yes',2,'3'],['יוסי מזרחי','b','חברים',1,'yes',1,'3'],['מיכל פרץ','a','עבודה',2,'pending',0,''],['אבי ביטון','b','צבא',2,'no',0,''],
['שירה גולן','a','לימודים',1,'yes',1,'3'],['רון שמעוני','b','חברים',2,'pending',0,''],['ליאור דהן','both','שכנים',2,'yes',2,''],['הדר אזולאי','a','חברים',2,'maybe',0,'']];
S.guests={};G.forEach(([name,side,group,invited,status,coming,table],i)=>{S.guests[id()]={name,phone:'05'+(20000000+i*1234567).toString().slice(0,8),invited,coming,status,side,group,table,diet:i===4?'צמחוני':'',note:'',updatedAt:t};});
S.tables={};[['1','משפחה צד א׳',12],['2','משפחה צד ב׳',12],['3','חברים',10]].forEach(([num,name,cap])=>{S.tables[id()]={num,name,cap};});
S.venues={};[['גן אירועים "השקמה"','ראשון לציון',320,250,5,true,'גן יפה, חניה גדולה'],['אולם "הכרמל"','חיפה',290,300,4,false,'מינימום גבוה יותר']].forEach(([name,city,plate,min,rating,fav,notes])=>{S.venues[id()]={name,city,plate,min,rating,fav,notes,updatedAt:t};});
const V={'די ג׳יי':['DJ לדוגמה',7500,3000,'booked'],'צלם סטילס':['סטודיו לדוגמה',9000,2000,'booked'],'צילום וידאו ורחפן':['וידאו לדוגמה',8000,0,'quote']};
let k=0;Object.values(S.vendors).forEach(v=>{const x=V[v.cat];if(x){Object.assign(v,{name:x[0],price:x[1],paid:x[2],status:x[3]});}});
Object.values(S.vendors).forEach(v=>{if(!V[v.cat]&&k<1&&/שמלה|כלה/.test(v.cat)){Object.assign(v,{name:'בוטיק לדוגמה',price:6000,paid:1500,status:'booked'});k++;}});
Object.values(S.tasks).slice(0,4).forEach(x=>x.done=true);
S.gifts={};[['שרה ודוד כהן',1000,'צ׳ק'],['יוסי מזרחי',500,'ביט / פייבוקס']].forEach(([from,amount,kind])=>{S.gifts[id()]={from,amount,kind,note:'',thanked:false,updatedAt:t};});
fs.writeFileSync('demo/seed.json',JSON.stringify(S));console.log('seed',Object.keys(S.guests).length,'guests',Object.values(S.vendors).filter(v=>v.price).length,'priced vendors');})();
