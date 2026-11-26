// שרת קטן לאפליקציית החתונה של אלון וליאת.
// הנתונים נשמרים בגיליון "data" שבקובץ הזה. קוד הכניסה לאפליקציה:
const CODE = 'CHANGE_ME';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName('data');
  if (!s) { s = ss.insertSheet('data'); s.appendRow(['path', 'json', 'updated']); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function readAll_() {
  const v = sheet_().getDataRange().getValues(), o = {};
  for (let i = 1; i < v.length; i++) { if (v[i][0]) { try { o[v[i][0]] = JSON.parse(v[i][1]); } catch (e) {} } }
  return o;
}
function findRow_(path) {
  const f = sheet_().getRange('A:A').createTextFinder(path).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}
function write_(path, data) {
  if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(path)) throw new Error('bad path');
  const row = [path, JSON.stringify(data), new Date()], r = findRow_(path);
  if (r) sheet_().getRange(r, 1, 1, 3).setValues([row]); else sheet_().appendRow(row);
}
function remove_(path) { const r = findRow_(path); if (r) sheet_().deleteRow(r); }
function pre_(e) { return e === 'henna' || e === 'shabbat' ? e + '_' : ''; }

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'load') {
    if (p.code !== CODE) return out_({ ok: false, error: 'code' });
    return out_({ ok: true, data: readAll_() });
  }
  if (p.action === 'event') { // מידע ציבורי לדף אישור ההגעה
    const d = readAll_(), w = d['settings/main'] || {};
    const s = d[p.e === 'henna' ? 'settings/henna' : p.e === 'shabbat' ? 'settings/shabbat' : 'settings/main'] || {};
    let guest = null;
    if (p.g) { const g = d[pre_(p.e) + 'guests/' + p.g]; if (g) guest = { name: g.name || '', invited: g.invited || 1, status: g.status || 'pending', coming: g.coming || 0 }; }
    return out_({ ok: true, names1: w.names1 || 'אלון', names2: w.names2 || 'ליאת', date: s.date || '', venue: s.venue || '', guest: guest });
  }
  return out_({ ok: false });
}

function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false }); }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (b.action === 'rsvp') return out_(rsvp_(b));
    if (b.code !== CODE) return out_({ ok: false, error: 'code' });
    if (b.action === 'set') { write_(b.path, b.data); return out_({ ok: true }); }
    if (b.action === 'del') { remove_(b.path); return out_({ ok: true }); }
    return out_({ ok: false });
  } finally { lock.releaseLock(); }
}

function rsvp_(b) {
  const pre = pre_(b.e), d = readAll_();
  const name = String(b.name || '').trim().slice(0, 80);
  if (!name) return { ok: false, error: 'name' };
  const status = ['yes', 'no', 'maybe'].indexOf(b.status) >= 0 ? b.status : 'yes';
  const count = Math.max(0, Math.min(30, parseInt(b.count, 10) || 0));
  const phone = String(b.phone || '').trim().slice(0, 20), note = String(b.note || '').trim().slice(0, 300);
  const norm = x => String(x || '').replace(/["'׳״]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const last9 = x => String(x || '').replace(/\D/g, '').slice(-9);
  let id = (b.g && /^[A-Za-z0-9_-]+$/.test(b.g) && d[pre + 'guests/' + b.g]) ? b.g : '';
  if (!id) {
    for (const k in d) {
      if (k.indexOf(pre + 'guests/') !== 0) continue;
      const g = d[k];
      if ((last9(phone).length === 9 && last9(g.phone) === last9(phone)) || norm(g.name) === norm(name)) { id = k.split('/')[1]; break; }
    }
  }
  const now = Date.now();
  if (id) {
    const g = d[pre + 'guests/' + id];
    g.status = status; g.coming = status === 'yes' ? (count || g.invited || 1) : 0;
    if (!g.phone && phone) g.phone = phone;
    if (note) g.note = (g.note ? g.note + ' · ' : '') + 'מהאורח: ' + note;
    g.source = 'rsvp'; g.rsvpAt = now; g.updatedAt = now;
    write_(pre + 'guests/' + id, g);
  } else {
    id = Utilities.getUuid().replace(/-/g, '').slice(0, 14);
    write_(pre + 'guests/' + id, { name: name, phone: phone, invited: count || 1, coming: status === 'yes' ? (count || 1) : 0, status: status, side: 'both', group: '', table: '', diet: '', note: 'נוסף מדף אישור ההגעה' + (note ? ': ' + note : ''), source: 'rsvp', rsvpAt: now, updatedAt: now });
  }
  return { ok: true };
}
