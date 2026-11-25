// שרת קטן להרשמות מדף הנחיתה (landing.html). נפרד לגמרי מהאפליקציה של החתונה.
// מקימים בגיליון Google חדש: Extensions → Apps Script, מדביקים, Deploy → Web app,
// Execute as: Me, Who has access: Anyone. את כתובת ה-exec מדביקים ב-landing.html (LANDING_API).
// גיליון "signups" = נרשמים. גיליון "events" = כניסות ולחיצות (לחישוב אחוז המרה לפי מקור).

function tab_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const clip_ = (v, n) => String(v || '').trim().slice(0, n);

function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false }); }
  if (b.action === 'ev') {
    tab_('events', ['time', 'event', 'source', 'visitor']).appendRow([new Date(), clip_(b.ev, 30), clip_(b.src, 60), clip_(b.vid, 20)]);
    return out_({ ok: true });
  }
  if (b.action === 'signup') {
    const name = clip_(b.name, 80), phone = clip_(b.phone, 20);
    if (!name || phone.replace(/\D/g, '').length < 9) return out_({ ok: false });
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      tab_('signups', ['time', 'name', 'phone', 'when', 'pains', 'would pay', 'source', 'visitor'])
        .appendRow([new Date(), name, "'" + phone, clip_(b.when, 40), clip_(b.pains, 200), clip_(b.pay, 40), clip_(b.src, 60), clip_(b.vid, 20)]);
    } finally { lock.releaseLock(); }
    return out_({ ok: true });
  }
  return out_({ ok: false });
}
function doGet() { return out_({ ok: true, service: 'landing-signups' }); }
