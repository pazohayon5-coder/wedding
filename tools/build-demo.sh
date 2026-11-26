#!/bin/bash
# בונה את גרסת ההדגמה (demo/) עם נתונים לדוגמה, נשמרת רק במכשיר של מי שפותח.
# שימוש: tools/build-demo.sh   (seed.json נבנה ע"י tools/demo-seed.js)
set -e
cd "$(dirname "$0")/.."
tools/new-couple.sh demo נועה איתי ""
python3 - <<'PY'
import json
p='demo/index.html'; s=open(p,encoding='utf-8').read()
seed=open('demo/seed.json',encoding='utf-8').read()
inj=("<script>try{if(!/noseed/.test(location.search)&&!localStorage.getItem('wedding-demo-v1'))"
     "localStorage.setItem('wedding-demo-v1',JSON.stringify(Object.assign("+seed+",{})));}catch(e){}</script></head>")
s=s.replace('</head>',inj,1)
old="<b>נשמר רק במכשיר הזה.</b> כדי שנועה, איתי ומי שעוזר יראו את אותם נתונים מכל מכשיר, צריך להיכנס לאפליקציה כשמחוברים לחשבון Claude שקיבל הרשאה."
new="<b>גרסת הדגמה.</b> כל הנתונים כאן לדוגמה בלבד. אפשר לשנות, להוסיף ולמחוק הכול, והשינויים נשמרים רק במכשיר שלך."
assert old in s, 'banner not found'
s=s.replace(old,new)
open(p,'w',encoding='utf-8').write(s)
PY
rm -f backend/Code-demo.gs
echo "demo built"
