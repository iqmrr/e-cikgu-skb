'use strict';
/* =========================================================
   e-Cikgu SKB — Sistem Pengurusan Guru
   Sekolah Kebangsaan Bangsar • Ilmu Bintang Hidup
   Dibina untuk Cikgu Azah Athirah
   ========================================================= */

const LOGO = 'assets/logo.png';
const APP_ID = 'ecikgu-skb';

/* ---------- Pembantu am ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoDate(new Date());
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoDate(d); };
const daysUntil = iso => Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000);
const byName = (a, b) => a.name.localeCompare(b.name);
const clone = o => JSON.parse(JSON.stringify(o));

let S = null; // semua data (disimpan dalam IndexedDB)
const L = (ms, en) => (S && S.settings.lang === 'en' ? en : ms);
const lg = () => (S && S.settings.lang === 'en' ? 'en' : 'ms');

const MONTHS = {
  ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MON_S = {
  ms: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const DAYS = {
  ms: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

function fmtDate(iso, long = false) {
  if (!iso) return '—';
  const d = parseISO(iso);
  const s = `${d.getDate()} ${(long ? MONTHS : MON_S)[lg()][d.getMonth()]} ${d.getFullYear()}`;
  return long ? `${DAYS[lg()][d.getDay()]}, ${s}` : s;
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? L('pg', 'AM') : L('ptg', 'PM')}`;
}
function relDay(iso) {
  const d = daysUntil(iso);
  if (d === 0) return L('Hari ini', 'Today');
  if (d === 1) return L('Esok', 'Tomorrow');
  if (d === -1) return L('Semalam', 'Yesterday');
  return d > 1 ? L(`${d} hari lagi`, `In ${d} days`) : L(`${-d} hari lepas`, `${-d} days ago`);
}
const monthLabel = ym => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[lg()][m - 1]} ${y}`; };

/* ---------- Pemalar ---------- */
const ST = {
  H: { ms: 'Hadir', en: 'Present', icon: '✅' },
  TH: { ms: 'Tidak Hadir', en: 'Absent', icon: '❌' },
  L: { ms: 'Lewat', en: 'Late', icon: '⏰' },
  B: { ms: 'Bersebab', en: 'Excused', icon: '📝' },
};
const stLabel = k => L(ST[k].ms, ST[k].en);

const LEVELS = {
  C: { ms: 'Cemerlang', en: 'Excellent', icon: '⭐' },
  B: { ms: 'Baik', en: 'Good', icon: '👍' },
  P: { ms: 'Perlu Bimbingan', en: 'Needs Guidance', icon: '⚠️' },
};

const MCAT = {
  mesyuarat: { ms: 'Mesyuarat', en: 'Meeting', icon: '🤝', c: 'purple' },
  kursus: { ms: 'Kursus', en: 'Course', icon: '🎓', c: 'blue' },
  bengkel: { ms: 'Bengkel', en: 'Workshop', icon: '🛠️', c: 'amber' },
  taklimat: { ms: 'Taklimat', en: 'Briefing', icon: '📢', c: 'pink' },
  ldp: { ms: 'LDP', en: 'In-Service Training', icon: '📘', c: 'green' },
  lain: { ms: 'Lain-lain', en: 'Others', icon: '📌', c: 'gray' },
};
const mcat = k => MCAT[k] || MCAT.lain;
const mcatLabel = k => L(mcat(k).ms, mcat(k).en);

const AWARDS = [
  { k: 'bintang', icon: '⭐', ms: 'Bintang Kelas', en: 'Class Star', pts: 10 },
  { k: 'contoh', icon: '🏆', ms: 'Murid Contoh', en: 'Model Student', pts: 15 },
  { k: 'kemajuan', icon: '🚀', ms: 'Kemajuan Terbaik', en: 'Most Improved', pts: 10 },
  { k: 'baca', icon: '📚', ms: 'Rajin Membaca', en: 'Avid Reader', pts: 5 },
  { k: 'kreatif', icon: '🎨', ms: 'Kreatif', en: 'Creative', pts: 5 },
  { k: 'sahsiah', icon: '🤝', ms: 'Sahsiah Terpuji', en: 'Good Conduct', pts: 5 },
  { k: 'bantu', icon: '💜', ms: 'Suka Membantu', en: 'Helpful', pts: 5 },
];
const awardType = k => AWARDS.find(a => a.k === k) || AWARDS[0];

const AVATARS = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐰', '🐻', '🐱', '🐶', '🦄', '🐸', '🐧', '🐹', '🐵', '🦋', '🐢', '🐬', '🦉', '🐙', '🐳', '🌻', '🌈', '⚽', '🎈'];
const COLORS = ['#9333ea', '#7c3aed', '#c026d3', '#db2777', '#e11d48', '#2563eb', '#0891b2', '#059669', '#d97706'];

/* ---------- Akses data ---------- */
const cls = id => S.classes.find(c => c.id === id);
const stu = id => S.students.find(s => s.id === id);
const studentsOf = cid => S.students.filter(s => s.classId === cid).sort(byName);
const clsName = id => cls(id)?.name ?? L('(Kelas dipadam)', '(Deleted class)');

function studentAtt(sid, monthPrefix) {
  const c = { H: 0, L: 0, TH: 0, B: 0 };
  for (const [k, rec] of Object.entries(S.attendance)) {
    if (monthPrefix && !k.split('|')[1].startsWith(monthPrefix)) continue;
    const v = rec[sid];
    if (v) c[v]++;
  }
  c.total = c.H + c.L + c.TH + c.B;
  c.pct = c.total ? Math.round((c.H + c.L) / c.total * 100) : null;
  return c;
}
function overallPct(classId) {
  const ids = new Set(S.students.map(s => s.id));
  let p = 0, t = 0;
  for (const [k, rec] of Object.entries(S.attendance)) {
    if (classId && k.split('|')[0] !== classId) continue;
    for (const [sid, v] of Object.entries(rec)) {
      if (!ids.has(sid)) continue;
      t++;
      if (v === 'H' || v === 'L') p++;
    }
  }
  return t ? Math.round(p / t * 100) : null;
}
function pctStatus(p) {
  if (p == null) return { t: '—', c: 'gray' };
  if (p >= 90) return { t: L('Cemerlang', 'Excellent'), c: 'green' };
  if (p >= 75) return { t: L('Baik', 'Good'), c: 'blue' };
  return { t: L('Perlu Perhatian', 'Needs Attention'), c: 'red' };
}
function hwStats(h) {
  const list = studentsOf(h.classId);
  return { done: list.filter(s => h.records[s.id]?.done).length, total: list.length };
}
function grade(mark, max = 100) {
  if (mark === '' || mark == null || isNaN(mark)) return null;
  const p = mark / max * 100;
  return p >= 80 ? 'A' : p >= 65 ? 'B' : p >= 50 ? 'C' : p >= 40 ? 'D' : 'E';
}
function examStats(e) {
  const vals = studentsOf(e.classId).map(s => e.marks[s.id]).filter(v => v !== '' && v != null).map(Number);
  if (!vals.length) return null;
  const dist = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  vals.forEach(v => dist[grade(v, e.max)]++);
  return {
    n: vals.length,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
    max: Math.max(...vals), min: Math.min(...vals),
    pass: Math.round(vals.filter(v => v / e.max * 100 >= 40).length / vals.length * 100),
    dist,
  };
}
const sortMeet = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const upcomingMeetings = () => S.meetings.filter(m => daysUntil(m.date) >= 0).sort(sortMeet);
const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
const minToTime = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const reliefMins = r => Math.max(0, toMin(r.end) - toMin(r.start));
const sortRelief = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);
function fmtDur(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60), m = mins % 60;
  return [h ? `${h} ${L('jam', 'hr')}` : '', m ? `${m} ${L('minit', 'min')}` : ''].filter(Boolean).join(' ');
}
const awardPoints = sid =>S.awards.filter(a => a.sid === sid).reduce((t, a) => t + Number(a.pts || 0), 0);

function nextStudentId() {
  const prefix = `${S.settings.schoolShort}-${new Date().getFullYear()}-`;
  let max = 0;
  S.students.forEach(s => { if (s.studentId?.startsWith(prefix)) max = Math.max(max, Number(s.studentId.slice(prefix.length)) || 0); });
  return prefix + String(max + 1).padStart(3, '0');
}

function reminders() {
  const out = [];
  upcomingMeetings().filter(m => daysUntil(m.date) <= 7).forEach(m => out.push({
    icon: mcat(m.category).icon, title: m.title, sub: `${relDay(m.date)} • ${fmtTime(m.time)}${m.place ? ' • ' + m.place : ''}`,
    act: 'viewMeeting', id: m.id, urgent: daysUntil(m.date) <= 1,
  }));
  S.homework.forEach(h => {
    const du = daysUntil(h.due);
    const { done, total } = hwStats(h);
    if (du >= 0 && du <= 1 && done < total) out.push({
      icon: '📚', title: h.title, sub: `${clsName(h.classId)} • ${relDay(h.due)} • ${total - done} ${L('belum hantar', 'pending')}`,
      act: 'openHw', id: h.id, urgent: du === 0,
    });
  });
  return out;
}

/* ---------- Data asal / contoh ---------- */
function emptyState() {
  return {
    app: APP_ID, version: 1,
    settings: {
      lang: 'ms', teacherName: 'Azah Athirah', nickname: 'Azah',
      schoolName: 'Sekolah Kebangsaan Bangsar', schoolShort: 'SKB', motto: 'Ilmu Bintang Hidup',
      address: 'Bangsar, 59100 Kuala Lumpur', schoolCode: '', lastBackup: null,
    },
    classes: [], students: [], attendance: {}, homework: [], exams: [], timetable: [], awards: [], meetings: [], reliefs: [],
  };
}
function normalize(s) {
  const d = emptyState();
  const out = Object.assign(d, s || {});
  out.settings = Object.assign(emptyState().settings, (s && s.settings) || {});
  return out;
}

function samplePhoto(text, c1, c2) {
  const c = document.createElement('canvas');
  c.width = 960; c.height = 640;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 960, 640);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.fillStyle = g; x.fillRect(0, 0, 960, 640);
  x.fillStyle = 'rgba(255,255,255,.08)';
  [[820, 120, 180], [140, 560, 220], [520, 330, 90]].forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = '90px sans-serif'; x.fillText('📷', 480, 300);
  x.font = 'bold 44px sans-serif'; x.fillText(text, 480, 390);
  x.font = '26px sans-serif'; x.globalAlpha = .8; x.fillText('Contoh Bukti Gambar', 480, 440);
  return c.toDataURL('image/jpeg', .8);
}

async function seedState() {
  const s = emptyState();
  const T = todayISO();
  const yr = new Date().getFullYear();
  s.classes = [
    { id: uid(), name: '4 Cerdik', subject: 'Bahasa Melayu', color: '#9333ea' },
    { id: uid(), name: '5 Bestari', subject: 'Sains', color: '#db2777' },
    { id: uid(), name: '6 Dinamik', subject: 'Matematik', color: '#2563eb' },
  ];
  const roster = [
    [['Aisyah Humaira', 'P', 'Puan Rohana Ismail'], ['Muhammad Danish', 'L', 'Encik Kamarul Ariffin'], ['Nur Iman Sofea', 'P', 'Puan Zarina Yusof'], ['Lim Wei Jie', 'L', 'Mr. Lim Chee Keong'], ['Ahmad Haikal', 'L', 'Encik Rosli Ahmad'], ['Priya a/p Rajan', 'P', 'Mr. Rajan Subramaniam']],
    [['Nur Alya Batrisya', 'P', 'Puan Salmah Hassan'], ['Adam Mikhail', 'L', 'Encik Faizal Rahman'], ['Tan Mei Ling', 'P', 'Mdm. Wong Siew Lan'], ['Muhammad Aqil', 'L', 'Encik Zulkifli Omar'], ['Siti Hajar', 'P', 'Puan Noraini Abdullah'], ['Arjun a/l Kumar', 'L', 'Mr. Kumar Pillai']],
    [['Ariana Qistina', 'P', 'Puan Hasnah Ali'], ['Harith Iskandar', 'L', 'Encik Iskandar Shah'], ['Wong Jia Hui', 'P', 'Mr. Wong Kok Wai'], ['Nur Damia', 'P', 'Puan Faridah Said'], ['Irfan Hakimi', 'L', 'Encik Hakim Yahya'], ['Kavitha a/p Mohan', 'P', 'Mr. Mohan Das']],
  ];
  let n = 0;
  roster.forEach((list, ci) => list.forEach(([name, gender, parent]) => {
    n++;
    s.students.push({
      id: uid(), studentId: `SKB-${yr}-${String(n).padStart(3, '0')}`, name, gender, classId: s.classes[ci].id,
      parent, phone: `01${(n % 8) + 2}-${300 + n * 17} ${4000 + n * 137}`, avatar: AVATARS[(n * 5) % AVATARS.length], notes: '', remark: '',
    });
  }));

  // Kehadiran 12 hari persekolahan lepas
  let r = 7;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const days = [];
  for (let d = addDays(T, -1); days.length < 12; d = addDays(d, -1)) {
    const wd = parseISO(d).getDay();
    if (wd !== 0 && wd !== 6) days.push(d);
  }
  for (const c of s.classes) for (const day of days) {
    const rec = {};
    s.students.filter(x => x.classId === c.id).forEach(st => {
      const weak = st.name === 'Ahmad Haikal';
      const x = rnd();
      rec[st.id] = x < (weak ? .55 : .86) ? 'H' : x < (weak ? .65 : .93) ? 'L' : (weak || x < .97) ? 'TH' : 'B';
    });
    s.attendance[`${c.id}|${day}`] = rec;
  }

  const [c1, c2, c3] = s.classes;
  const recs = (cid, p) => {
    const o = {};
    s.students.filter(x => x.classId === cid).forEach(st => {
      const done = rnd() < p;
      o[st.id] = { done, level: done ? ['C', 'B', 'B', 'C'][Math.floor(rnd() * 4)] : '', note: '' };
    });
    return o;
  };
  s.homework = [
    { id: uid(), classId: c1.id, title: 'Karangan: Hari Sukan Sekolah', desc: 'Tulis karangan sekurang-kurangnya 120 patah perkataan dalam buku latihan.', assigned: addDays(T, -4), due: addDays(T, 2), link: '', records: recs(c1.id, .5) },
    { id: uid(), classId: c2.id, title: 'Eksperimen Tumbesaran Kacang Hijau', desc: 'Catat pemerhatian selama 5 hari dan lukis graf ketinggian anak benih.', assigned: addDays(T, -9), due: addDays(T, -2), link: '', records: recs(c2.id, .75) },
    { id: uid(), classId: c3.id, title: 'Latihan Pecahan & Perpuluhan (m/s 45–46)', desc: 'Selesaikan semua soalan dalam buku aktiviti.', assigned: addDays(T, -1), due: addDays(T, 4), link: '', records: {} },
  ];

  const marks = cid => Object.fromEntries(s.students.filter(x => x.classId === cid).map(st => [st.id, Math.round(36 + rnd() * 62)]));
  s.exams = [
    { id: uid(), classId: c3.id, title: 'Ujian Bulanan Oktober', date: addDays(T, -8), max: 100, marks: marks(c3.id) },
    { id: uid(), classId: c1.id, title: 'Pentaksiran Pertengahan Tahun (PPT)', date: `${yr}-06-12`, max: 100, marks: marks(c1.id) },
  ];

  const tt = (day, start, end, c, room) => ({ id: uid(), day, start, end, classId: c.id, subject: c.subject, room: room || `Kelas ${c.name}` });
  s.timetable = [
    tt(1, '07:45', '08:45', c1), tt(1, '10:15', '11:15', c3),
    tt(2, '08:45', '09:45', c2, 'Makmal Sains'), tt(2, '11:15', '12:15', c1),
    tt(3, '07:45', '08:45', c3), tt(3, '09:45', '10:45', c2, 'Makmal Sains'),
    tt(4, '08:15', '09:15', c1), tt(4, '10:45', '11:45', c3), tt(4, '11:45', '12:45', c2, 'Makmal Sains'),
    tt(5, '07:45', '08:45', c2), tt(5, '09:15', '10:15', c1),
  ];

  const pick = name => s.students.find(x => x.name === name).id;
  s.awards = [
    { id: uid(), sid: pick('Aisyah Humaira'), type: 'bintang', pts: 10, date: addDays(T, -3), note: 'Karangan terbaik minggu ini' },
    { id: uid(), sid: pick('Wong Jia Hui'), type: 'contoh', pts: 15, date: addDays(T, -7), note: '' },
    { id: uid(), sid: pick('Adam Mikhail'), type: 'bantu', pts: 5, date: addDays(T, -2), note: 'Bantu susun makmal sains' },
    { id: uid(), sid: pick('Irfan Hakimi'), type: 'kemajuan', pts: 10, date: addDays(T, -8), note: 'Markah naik 20%' },
  ];

  const ph1 = uid(), ph2 = uid();
  await DB.put('photos', ph1, samplePhoto('Kursus PBD', '#7c3aed', '#c026d3'));
  await DB.put('photos', ph2, samplePhoto('Sesi Perkongsian', '#4c1d95', '#2563eb'));
  s.meetings = [
    { id: uid(), date: addDays(T, 2), time: '14:30', end: '16:30', title: 'Mesyuarat Panitia Bahasa Melayu Kali 3', category: 'mesyuarat', place: 'Bilik Mesyuarat SKB', hours: '', notes: 'Bawa fail panitia, analisis keputusan PPT dan cadangan program intervensi.', photos: [] },
    { id: uid(), date: addDays(T, 9), time: '08:30', end: '13:00', title: 'Bengkel Pembinaan Item Pentaksiran', category: 'bengkel', place: 'Makmal Komputer SKB', hours: '4', notes: '', photos: [] },
    { id: uid(), date: addDays(T, -6), time: '08:00', end: '17:00', title: `Kursus Pentaksiran Bilik Darjah (PBD) ${yr}`, category: 'kursus', place: 'PPD Bangsar Pudu', hours: '8', notes: '• Cara menentukan Tahap Penguasaan (TP) 1–6\n• Contoh eviden PBD untuk setiap TP\n• Kemas kini dalam sistem sebelum hujung bulan', photos: [ph1, ph2] },
    { id: uid(), date: addDays(T, -15), time: '14:00', end: '16:00', title: 'Mesyuarat Guru Kali 4', category: 'mesyuarat', place: 'Dewan SKB', hours: '', notes: 'Persediaan Hari Anugerah dan jadual peperiksaan akhir tahun.', photos: [] },
  ];

  const schoolDay = d => { while ([0, 6].includes(parseISO(d).getDay())) d = addDays(d, -1); return d; };
  s.reliefs = [
    { id: uid(), date: schoolDay(addDays(T, -1)), kelas: '3 Arif', start: '09:00', end: '10:00', subject: 'Matematik', replacing: 'Cikgu Rosmah (Kursus)', notes: 'Murid buat latihan buku aktiviti m/s 30.' },
    { id: uid(), date: schoolDay(addDays(T, -5)), kelas: '2 Bestari', start: '11:30', end: '12:00', subject: 'Pendidikan Moral', replacing: 'Cikgu Lee (Cuti Sakit)', notes: '' },
    { id: uid(), date: schoolDay(addDays(T, -9)), kelas: '6 Dinamik', start: '07:45', end: '08:45', subject: 'Sains', replacing: 'Cikgu Ahmad (Mesyuarat)', notes: '' },
  ];
  return s;
}

/* ---------- Simpan ---------- */
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; DB.put('state', 'main', S).catch(() => toast(L('Gagal menyimpan data!', 'Failed to save data!'), 'err')); }, 200);
}
async function persistNow() {
  clearTimeout(saveTimer); saveTimer = null;
  try { await DB.put('state', 'main', S); return true; }
  catch { toast(L('Gagal menyimpan data! Ruang storan mungkin penuh.', 'Failed to save! Storage may be full.'), 'err'); return false; }
}

const photoCache = new Map();
async function getPhoto(id) {
  if (photoCache.has(id)) return photoCache.get(id);
  const v = await DB.get('photos', id);
  if (v) photoCache.set(id, v);
  return v;
}
async function hydratePhotos(root) {
  for (const img of $$('img[data-photo]', root)) {
    const id = img.dataset.photo;
    img.removeAttribute('data-photo');
    const src = await getPhoto(id);
    if (src) img.src = src;
  }
}

function compressImage(file, max = 1600, q = .82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

/* ---------- UI state ---------- */
const UI = {
  view: 'dashboard', bellOpen: false, modal: null, draft: null,
  attClass: null, attDate: todayISO(), attMode: 'daily', attMonth: todayISO().slice(0, 7), attDraft: null,
  hwClass: 'all', exClass: 'all', stuClass: 'all', stuSearch: '', awClass: 'all',
  meetFilter: 'upcoming', meetCat: 'all', meetSearch: '',
  relMonth: todayISO().slice(0, 7), rRelMonth: '',
  rTab: 'attendance', rClass: null, rMonth: '', rStudent: null, rExam: null, rYear: String(new Date().getFullYear()), rCat: 'all', rPhotos: false,
};

/* ---------- Komponen kecil ---------- */
const avatar = (s, cls = '') => `<div class="av ${cls}">${s?.avatar || '🙂'}</div>`;
const pill = (text, c) => `<span class="pill pill-${c}">${text}</span>`;
const classOptions = (sel, withAll) => (withAll ? `<option value="all">${L('Semua Kelas', 'All Classes')}</option>` : '') +
  S.classes.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)} – ${esc(c.subject)}</option>`).join('');
const pageHead = (title, sub, actions = '') => `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div><div class="page-actions">${actions}</div></div>`;
const empty = (icon, title, sub, btn = '') => `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${sub}</p>${btn}</div>`;
const field = (label, input, cls = '') => `<label class="field ${cls}"><span>${label}</span>${input}</label>`;
const inp = (bind, val, attrs = '') => `<input class="input" id="f-${bind}" data-bind="${bind}" value="${esc(val ?? '')}" ${attrs}>`;
const noClasses = () => empty('🏫', L('Belum ada kelas', 'No classes yet'), L('Tambah kelas dahulu untuk mula guna bahagian ini.', 'Add a class first to use this section.'), `<a class="btn btn-primary" href="#classes">＋ ${L('Tambah Kelas', 'Add Class')}</a>`);
function ensureClass(key, allowAll) {
  if (allowAll && UI[key] === 'all') return 'all';
  if (!UI[key] || !cls(UI[key])) UI[key] = allowAll ? 'all' : S.classes[0]?.id ?? null;
  return UI[key];
}

/* ---------- Kerangka ---------- */
const NAV = [
  ['dashboard', '🏠', 'Papan Pemuka', 'Dashboard'],
  ['attendance', '📋', 'Kehadiran', 'Attendance'],
  ['homework', '📚', 'Kerja Rumah', 'Homework'],
  ['exams', '📝', 'Peperiksaan', 'Exams'],
  ['timetable', '🗓️', 'Jadual', 'Timetable'],
  ['relief', '🔄', 'Relief', 'Relief'],
  ['students', '👧', 'Murid', 'Students'],
  ['classes', '🏫', 'Kelas', 'Classes'],
  ['awards', '🏆', 'Anugerah', 'Awards'],
  ['meetings', '🤝', 'Mesyuarat & Kursus', 'Meetings & Courses'],
  ['reports', '📊', 'Laporan', 'Reports'],
];

function topbar() {
  const en = lg() === 'en';
  return `<div class="topbar"><div class="topbar-in">
    <div class="lang-switch"><button class="${en ? '' : 'on'}" data-act="setLang" data-v="ms">BM · Bahasa Melayu</button><button class="${en ? 'on' : ''}" data-act="setLang" data-v="en">EN · English</button></div>
    <span class="tb-sep"></span><span class="tb-item">👩🏻‍🏫 ${L('Guru', 'Teacher')}</span><span class="tb-sep"></span>
    <button class="tb-btn" data-act="backup">⬇️ ${L('Salinan', 'Backup')}</button>
    <button class="tb-btn" data-act="restore">⬆️ ${L('Pulih', 'Restore')}</button>
    <button class="tb-btn" data-act="settings">⚙️ ${L('Tetapan', 'Settings')}</button>
  </div></div>`;
}
function appbar() {
  const st = S.settings, n = reminders().length;
  return `<header class="appbar"><div class="appbar-in">
    <a class="brand" href="#dashboard"><img src="${LOGO}" alt="Logo"><div style="min-width:0">
      <div class="brand-title">e-Cikgu ${esc(st.schoolShort)} <span class="badge-brand">PRO</span></div>
      <div class="brand-sub">${esc(st.schoolName)} • ${esc(st.motto)}</div></div></a>
    <div class="appbar-right">
      <div class="bell-wrap"><button class="icon-btn" data-act="toggleBell" title="${L('Peringatan', 'Reminders')}">🔔${n ? `<span class="dot">${n}</span>` : ''}</button>${UI.bellOpen ? bellMenu() : ''}</div>
      <div class="profile" data-act="settings"><div class="avatar">👩🏻‍🏫</div><div><b>Cikgu ${esc(st.nickname)}</b><small>${L('Portal Guru', 'Teacher Portal')}</small></div></div>
    </div></div></header>`;
}
function bellMenu() {
  const items = reminders();
  return `<div class="bell-menu"><h4>🔔 ${L('Peringatan 7 hari akan datang', 'Reminders — next 7 days')}</h4>
    ${items.length ? items.map(i => `<button class="bell-item ${i.urgent ? 'urgent' : ''}" data-act="${i.act}" data-id="${i.id}"><div class="bi-icon">${i.icon}</div><div><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></div></button>`).join('')
      : `<div class="bell-empty">🎉 ${L('Tiada peringatan buat masa ini', 'Nothing to remind you of')}</div>`}</div>`;
}
function navbar() {
  const up = upcomingMeetings().filter(m => daysUntil(m.date) <= 7).length;
  return `<nav class="nav"><div class="nav-in">${NAV.map(([k, i, ms, en]) =>
    `<a href="#${k}" class="nav-item ${UI.view === k ? 'active' : ''}"><span>${i}</span>${L(ms, en)}${k === 'meetings' && up ? `<em>${up}</em>` : ''}</a>`).join('')}</div></nav>`;
}
const footer = () => `<footer class="footer">© ${new Date().getFullYear()} e-Cikgu ${esc(S.settings.schoolShort)} • ${L('Dibina khas untuk', 'Built for')} <b>Cikgu ${esc(S.settings.teacherName)}</b> 💜 • ${L('Semua data disimpan dalam peranti ini', 'All data is stored on this device')}${DB.isFallback ? ' (localStorage)' : ''}</footer>`;

function render() {
  const ae = document.activeElement;
  const fid = ae && ae.id && $('#app').contains(ae) ? ae.id : null;
  const pos = fid && 'selectionStart' in ae ? ae.selectionStart : null;
  document.documentElement.lang = lg();
  $('#app').innerHTML = topbar() + appbar() + navbar() + `<main class="container">${VIEWS[UI.view]()}</main>` + footer();
  if (fid) {
    const el = document.getElementById(fid);
    if (el) { el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch { /* jenis input tak sokong */ } }
  }
  hydratePhotos($('#app'));
}

/* ---------- Modal / confirm / toast ---------- */
function openModal(fn, size = '') { UI.modal = { fn, size }; drawModal(); document.body.classList.add('no-scroll'); }
function drawModal() {
  if (!UI.modal) return;
  const root = $('#modal-root');
  const scroll = $('.dialog-body', root)?.scrollTop || 0;
  const ae = document.activeElement;
  const fid = ae && ae.id && root.contains(ae) ? ae.id : null;
  const m = UI.modal.fn();
  root.innerHTML = `<div class="backdrop" data-act="closeModal" data-self="1"><div class="dialog ${UI.modal.size}">
    <div class="dialog-head"><div><h3>${m.title}</h3>${m.sub ? `<p>${m.sub}</p>` : ''}</div>${m.head || ''}<button class="x-btn" data-act="closeModal">✕</button></div>
    <div class="dialog-body">${m.body}</div>${m.footer ? `<div class="dialog-foot">${m.footer}</div>` : ''}</div></div>`;
  $('.dialog-body', root).scrollTop = scroll;
  if (fid) document.getElementById(fid)?.focus();
  hydratePhotos(root);
}
function closeModal() { UI.modal = null; UI.draft = null; $('#modal-root').innerHTML = ''; document.body.classList.remove('no-scroll'); }

function ask(msg, { ok = L('Ya, teruskan', 'Yes, continue'), cancel = L('Batal', 'Cancel'), danger = false, title = L('Pengesahan', 'Confirm') } = {}) {
  return new Promise(res => {
    UI.askRes = res;
    $('#confirm-root').innerHTML = `<div class="backdrop" data-act="askNo" data-self="1"><div class="dialog confirm">
      <div class="confirm-icon">${danger ? '⚠️' : '💜'}</div><h3>${title}</h3><p>${msg}</p>
      <div class="dialog-actions"><button class="btn btn-ghost" data-act="askNo">${cancel}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="askYes">${ok}</button></div></div></div>`;
  });
}
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = msg;
  $('#toast-root').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
}
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function downloadCSV(name, rows) {
  const csv = '﻿' + rows.map(r => r.map(v => {
    v = String(v ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\r\n');
  download(name, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}
const safeName = s => String(s).replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').toLowerCase();

/* =========================================================
   VIEWS
   ========================================================= */
const VIEWS = {};

/* ---------- Papan Pemuka ---------- */
function greet() {
  const h = new Date().getHours();
  if (h < 12) return L('Selamat Pagi', 'Good Morning');
  if (h < 14) return L('Selamat Tengah Hari', 'Good Afternoon');
  if (h < 19) return L('Selamat Petang', 'Good Afternoon');
  return L('Selamat Malam', 'Good Evening');
}
function attentionList() {
  const out = [];
  S.students.forEach(s => {
    const reasons = [];
    const a = studentAtt(s.id);
    if (a.total >= 3 && a.pct < 80) reasons.push(L(`Kehadiran ${a.pct}%`, `Attendance ${a.pct}%`));
    const overdue = S.homework.filter(h => h.classId === s.classId && daysUntil(h.due) < 0 && !h.records[s.id]?.done).length;
    if (overdue) reasons.push(L(`${overdue} kerja rumah tertunggak`, `${overdue} overdue homework`));
    if (reasons.length) out.push({ s, reasons, weight: (a.pct ?? 100) - overdue * 10 });
  });
  return out.sort((a, b) => a.weight - b.weight);
}
function backupReminder() {
  const lb = S.settings.lastBackup;
  const days = lb ? -daysUntil(lb.slice(0, 10)) : null;
  if (days !== null && days < 7) return '';
  return `<div class="alert alert-amber"><span class="al-icon">💾</span><div><b>${lb ? L(`Salinan terakhir ${days} hari lepas`, `Last backup was ${days} days ago`) : L('Data belum pernah disalin (backup)', 'Your data has never been backed up')}</b>
    <small>${L('Simpan fail salinan dalam Google Drive / pendrive supaya data selamat jika browser dikosongkan.', 'Keep a backup file in Google Drive / a USB drive in case the browser data is cleared.')}</small></div>
    <button class="btn btn-sm btn-white" data-act="backup">⬇️ ${L('Salin Sekarang', 'Back Up Now')}</button></div>`;
}

VIEWS.dashboard = () => {
  const st = S.settings, pct = overallPct();
  const up = upcomingMeetings();
  const soon = up.filter(m => daysUntil(m.date) <= 3);
  const activeHw = S.homework.filter(h => daysUntil(h.due) >= 0);
  const pendingHw = S.homework.filter(h => { const x = hwStats(h); return x.done < x.total; }).length;
  const wd = new Date().getDay();
  const todaySlots = S.timetable.filter(t => t.day === wd).sort((a, b) => a.start.localeCompare(b.start));
  const todayRel = S.reliefs.filter(r => r.date === todayISO()).sort(sortRelief);
  const att = attentionList();
  const nowHM = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
  const qc = (n, icon, color, title, desc, link, href, badge) =>
    `<a class="quick-card qc-${color}" href="#${href}"><div class="qc-icon">${icon}</div><div><h3>${n}. ${title}${badge ? `<span class="qc-badge">${badge}</span>` : ''}</h3><p>${desc}</p><span class="qc-link">${link} →</span></div></a>`;

  return `
  <section class="hero">
    <img class="hero-logo" src="${LOGO}" alt="">
    <div class="hero-text">
      <div class="hero-chips"><span class="chip-gold">${esc(st.schoolName.toUpperCase())} (${esc(st.schoolShort)})</span><span class="hero-motto">• ${esc(st.motto.toUpperCase().split(' ').join(' • '))}</span></div>
      <h1>${greet()}, Cikgu ${esc(st.nickname)} 👋</h1>
      <p>${fmtDate(todayISO(), true)} • ${L(`Anda menguruskan ${S.classes.length} buah kelas dengan ${S.students.length} orang murid berdaftar.`, `You manage ${S.classes.length} classes with ${S.students.length} registered students.`)}</p>
    </div>
    <div class="hero-stat"><small>${L('PERATUS KEHADIRAN KESELURUHAN', 'OVERALL ATTENDANCE')}</small><b>${pct == null ? '—' : pct + '%'}</b></div>
  </section>

  ${soon.map(m => `<div class="alert alert-purple"><span class="al-icon">${mcat(m.category).icon}</span><div><b>${relDay(m.date)}: ${esc(m.title)}</b><small>${fmtDate(m.date, true)} • ${fmtTime(m.time)}${m.place ? ' • 📍 ' + esc(m.place) : ''}</small></div><button class="btn btn-sm btn-white" data-act="viewMeeting" data-id="${m.id}">${L('Lihat', 'View')}</button></div>`).join('')}
  ${backupReminder()}

  <div class="stat-row">
    <div class="stat"><div class="stat-icon" style="background:#f3e8ff">👧</div><div><b>${S.students.length}</b><small>${L('Murid Berdaftar', 'Students')}</small></div></div>
    <div class="stat"><div class="stat-icon" style="background:#fce7f3">🏫</div><div><b>${S.classes.length}</b><small>${L('Kelas Diajar', 'Classes')}</small></div></div>
    <div class="stat"><div class="stat-icon" style="background:#dbeafe">📚</div><div><b>${activeHw.length}</b><small>${L('Kerja Rumah Aktif', 'Active Homework')}</small></div></div>
    <div class="stat"><div class="stat-icon" style="background:#dcfce7">🤝</div><div><b>${up.length}</b><small>${L('Mesyuarat Akan Datang', 'Upcoming Meetings')}</small></div></div>
  </div>

  <h2 class="section-title">${L('Apakah tindakan yang ingin anda lakukan?', 'What would you like to do?')}</h2>
  <div class="quick-grid">
    ${qc(1, '📋', 'green', L('Ambil Kehadiran', 'Take Attendance'), L('Tanda Hadir, Tidak Hadir, Lewat atau Bersebab dengan 1-klik.', 'Mark Present, Absent, Late or Excused in one click.'), L('Buka Buku Kehadiran', 'Open Register'), 'attendance')}
    ${qc(2, '📚', 'blue', L('Semak Kerja Rumah', 'Check Homework'), L('Semak status penghantaran, beri tahap pencapaian & ulasan.', 'Track submissions, give levels & comments.'), L('Semak Tugasan Murid', 'Check Assignments'), 'homework', pendingHw || '')}
    ${qc(3, '👧', 'purple', L('Maklumat Murid', 'Student Info'), L('Profil murid, nombor telefon ibu bapa dan catatan guru.', 'Student profiles, parent contacts and notes.'), L(`Lihat Senarai Murid (${S.students.length})`, `View Students (${S.students.length})`), 'students')}
    ${qc(4, '🖨️', 'orange', L('Cetak Laporan', 'Print Reports'), L('Penyata kehadiran, kad pelaporan murid & rekod kursus.', 'Attendance statements, report cards & course records.'), L('Buka Laporan & Cetak', 'Open Reports'), 'reports')}
    ${qc(5, '🤝', 'pink', L('Mesyuarat & Kursus', 'Meetings & Courses'), L('Rekod tarikh, masa, tajuk, catatan & bukti gambar.', 'Log date, time, title, notes & photo evidence.'), L('Buka Rekod Mesyuarat', 'Open Meeting Log'), 'meetings', up.length || '')}
    ${qc(6, '📝', 'teal', L('Markah Peperiksaan', 'Exam Marks'), L('Masukkan markah, gred dikira secara automatik.', 'Enter marks, grades are calculated automatically.'), L('Buka Peperiksaan', 'Open Exams'), 'exams')}
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><h3>🗓️ ${L('Kelas Hari Ini', "Today's Classes")} <span class="pill pill-purple">${DAYS[lg()][wd]}</span></h3><a href="#timetable">${L('Jadual penuh', 'Full timetable')} →</a></div>
      ${todaySlots.length ? todaySlots.map(t => { const c = cls(t.classId); const now = t.start <= nowHM && nowHM < t.end; return `<div class="list-row"><div class="time-badge">${fmtTime(t.start)}</div><div class="lr-main"><b>${esc(c?.name || '—')} · ${esc(t.subject)}</b><small>${fmtTime(t.start)} – ${fmtTime(t.end)}${t.room ? ' • ' + esc(t.room) : ''}</small></div>${now ? pill('● ' + L('Sedang berlangsung', 'Now'), 'green') : ''}</div>`; }).join('')
      : todayRel.length ? '' : `<div class="empty-sm">☕ ${L('Tiada kelas dijadualkan hari ini.', 'No classes scheduled today.')}</div>`}
      ${todayRel.map(r => `<div class="list-row" style="cursor:pointer" data-act="editRelief" data-id="${r.id}"><div class="time-badge" style="background:var(--amber-bg);color:var(--amber)">${fmtTime(r.start)}</div><div class="lr-main"><b>${esc(r.kelas)}${r.subject ? ' · ' + esc(r.subject) : ''}</b><small>${fmtTime(r.start)} – ${fmtTime(r.end)} • ${fmtDur(reliefMins(r))}${r.replacing ? ' • ' + esc(r.replacing) : ''}</small></div>${pill('🔄 Relief', 'amber')}</div>`).join('')}
      <div style="margin-top:10px"><button class="btn btn-sm btn-soft" data-act="addRelief">🔄 ${L('Rekod Relief', 'Log a Relief')}</button></div>
    </div>
    <div class="card">
      <div class="card-title"><h3>🤝 ${L('Mesyuarat & Kursus Akan Datang', 'Upcoming Meetings & Courses')}</h3><a href="#meetings">${L('Lihat semua', 'View all')} →</a></div>
      ${up.slice(0, 4).map(m => { const d = parseISO(m.date); return `<div class="list-row" style="cursor:pointer" data-act="viewMeeting" data-id="${m.id}"><div class="mini-date"><b>${d.getDate()}</b><small>${MON_S[lg()][d.getMonth()]}</small></div><div class="lr-main"><b>${esc(m.title)}</b><small>${mcat(m.category).icon} ${mcatLabel(m.category)} • ${fmtTime(m.time)}${m.place ? ' • ' + esc(m.place) : ''}</small></div>${pill(relDay(m.date), daysUntil(m.date) <= 3 ? 'red' : 'purple')}</div>`; }).join('')
      || `<div class="empty-sm">📭 ${L('Tiada mesyuarat akan datang.', 'No upcoming meetings.')}<br><br><button class="btn btn-sm btn-soft" data-act="addMeeting">＋ ${L('Tambah Rekod', 'Add Record')}</button></div>`}
    </div>
  </div>

  <div class="card" style="margin-top:18px">
    <div class="card-title"><h3>⚠️ ${L('Perlu Perhatian Guru', 'Needs Your Attention')}</h3><span class="muted" style="font-size:12.5px">${L('Murid kerap tidak hadir atau mempunyai tugasan tertunggak', 'Frequent absences or overdue homework')}</span></div>
    ${att.length ? att.slice(0, 8).map(({ s, reasons }) => `<div class="list-row" style="cursor:pointer" data-act="viewStudent" data-id="${s.id}">${avatar(s)}<div class="lr-main"><b>${esc(s.name)}</b><small>${esc(clsName(s.classId))} • ${esc(s.studentId)}</small></div><div class="chips">${reasons.map(r => pill(r, 'red')).join('')}</div></div>`).join('')
      : `<div class="empty-sm">🌟 ${L('Bagus! Semua murid dalam keadaan baik.', 'Great! All students are on track.')}</div>`}
  </div>`;
};

/* ---------- Kehadiran ---------- */
const attKey = () => `${UI.attClass}|${UI.attDate}`;
function ensureDraft() {
  const k = attKey();
  if (!UI.attDraft || UI.attDraft.key !== k) UI.attDraft = { key: k, data: { ...(S.attendance[k] || {}) }, dirty: false };
  return UI.attDraft;
}

VIEWS.attendance = () => {
  if (!S.classes.length) return pageHead(L('Kehadiran Harian', 'Daily Attendance'), '') + noClasses();
  ensureClass('attClass');
  const toggle = `<div class="seg-toggle"><button class="${UI.attMode === 'daily' ? 'on' : ''}" data-act="setUI" data-k="attMode" data-v="daily">${L('Pengambilan Harian', 'Daily Register')}</button><button class="${UI.attMode === 'monthly' ? 'on' : ''}" data-act="setUI" data-k="attMode" data-v="monthly">${L('Jadual Bulanan', 'Monthly View')}</button></div>`;
  return pageHead(L(`Daftar Kehadiran Harian ${S.settings.schoolShort}`, `${S.settings.schoolShort} Daily Attendance`), L('Pilih kelas dan tarikh, kemudian klik Hadir, Tidak Hadir, Lewat atau Bersebab bagi setiap murid.', 'Choose a class and date, then mark each student.'), toggle)
    + (UI.attMode === 'daily' ? attDaily() : attMonthly());
};

function attDaily() {
  const d = ensureDraft();
  const list = studentsOf(UI.attClass);
  const cnt = { H: 0, TH: 0, L: 0, B: 0 };
  list.forEach(s => { const v = d.data[s.id]; if (v) cnt[v]++; });
  const unmarked = list.length - cnt.H - cnt.TH - cnt.L - cnt.B;
  const saved = !!S.attendance[d.key];
  const wd = parseISO(UI.attDate).getDay();
  return `
  <div class="card"><div class="controls">
    ${field(`1. ${L('Pilih Kelas', 'Select Class')}`, `<select class="input" data-ui="attClass">${classOptions(UI.attClass)}</select>`)}
    ${field(`2. ${L('Pilih Tarikh', 'Select Date')}`, `<input type="date" class="input" data-ui="attDate" value="${UI.attDate}" max="${addDays(todayISO(), 30)}">`)}
    <div class="spacer"></div>
    <button class="btn btn-green" data-act="markAll" ${list.length ? '' : 'disabled'}>⚡ ${L('Tanda Semua Hadir', 'Mark All Present')}</button>
  </div>
  ${wd === 0 || wd === 6 ? `<p class="hint">⚠️ ${L(`Tarikh dipilih ialah hari ${DAYS.ms[wd]} (hujung minggu).`, `Selected date is a ${DAYS.en[wd]} (weekend).`)}</p>` : ''}
  </div>

  <div class="att-stats">
    ${['H', 'TH', 'L', 'B'].map(k => `<div class="att-stat as-${k.toLowerCase()}"><small>${ST[k].icon} ${stLabel(k)}</small><b>${cnt[k]}</b></div>`).join('')}
  </div>
  <div class="saved-flag">${saved ? pill('✓ ' + L('Rekod tarikh ini telah disimpan', 'Record for this date is saved'), 'green') : pill('○ ' + L('Belum direkod', 'Not recorded yet'), 'gray')}${d.dirty ? pill('● ' + L('Ada perubahan belum disimpan', 'Unsaved changes'), 'amber') : ''}<span class="muted">${fmtDate(UI.attDate, true)}</span></div>

  ${list.length ? list.map(s => { const v = d.data[s.id]; return `<div class="att-row ${v ? 'st-' + v : ''}">
      ${avatar(s)}<div class="who"><b>${esc(s.name)}</b><code>ID: ${esc(s.studentId)}</code></div>
      <div class="att-btns">${['H', 'TH', 'L', 'B'].map(k => `<button class="ab ab-${k} ${v === k ? 'on' : ''}" data-act="mark" data-sid="${s.id}" data-v="${k}">${ST[k].icon} ${stLabel(k)}</button>`).join('')}</div>
    </div>`; }).join('')
    : empty('👧', L('Tiada murid dalam kelas ini', 'No students in this class'), L('Tambah murid atau import dari Excel.', 'Add students or import from Excel.'), `<a class="btn btn-primary" href="#students">＋ ${L('Tambah Murid', 'Add Students')}</a>`)}

  ${list.length ? `<div class="save-bar"><div><small>${L('Sedia untuk merekod kehadiran?', 'Ready to save attendance?')}</small>
    <b>${cnt.H} ${stLabel('H')} • ${cnt.TH} ${stLabel('TH')} • ${cnt.L} ${stLabel('L')} • ${cnt.B} ${stLabel('B')}</b>${unmarked ? ` <b class="dirty">• ${unmarked} ${L('belum ditanda', 'unmarked')}</b>` : ''}</div>
    <button class="btn btn-green" data-act="saveAtt">💾 ${L('Simpan Rekod Kehadiran', 'Save Attendance')}</button></div>` : ''}`;
}

function attMonthly() {
  const ym = UI.attMonth;
  const [y, m] = ym.split('-').map(Number);
  const nd = new Date(y, m, 0).getDate();
  const list = studentsOf(UI.attClass);
  const days = Array.from({ length: nd }, (_, i) => `${ym}-${pad(i + 1)}`);
  const T = todayISO();
  const head = days.map(d => { const wd = parseISO(d).getDay(); return `<th class="${wd === 0 || wd === 6 ? 'we' : ''} ${d === T ? 'today-col' : ''}"><button data-act="gotoDay" data-d="${d}" title="${fmtDate(d, true)}">${Number(d.slice(8))}<small>${DAYS[lg()][wd].slice(0, 2)}</small></button></th>`; }).join('');
  const rows = list.map(s => {
    const c = { H: 0, L: 0, TH: 0, B: 0 };
    const cells = days.map(d => {
      const v = S.attendance[`${UI.attClass}|${d}`]?.[s.id];
      if (v) c[v]++;
      const wd = parseISO(d).getDay();
      return `<td class="${wd === 0 || wd === 6 ? 'we' : ''}">${v ? `<span class="cell c-${v}" title="${stLabel(v)}">${v === 'TH' ? 'T' : v}</span>` : ''}</td>`;
    }).join('');
    const tot = c.H + c.L + c.TH + c.B;
    const pct = tot ? Math.round((c.H + c.L) / tot * 100) : null;
    return `<tr><td class="sticky">${esc(s.name)}</td>${cells}<td class="tot" style="color:var(--green)">${c.H}</td><td class="tot" style="color:var(--amber)">${c.L}</td><td class="tot" style="color:var(--red)">${c.TH}</td><td class="tot" style="color:var(--blue)">${c.B}</td><td class="tot">${pct == null ? '—' : pct + '%'}</td></tr>`;
  }).join('');
  return `<div class="card"><div class="controls" style="margin-bottom:16px">
      ${field(L('Kelas', 'Class'), `<select class="input" data-ui="attClass">${classOptions(UI.attClass)}</select>`)}
      ${field(L('Bulan', 'Month'), `<input type="month" class="input" data-ui="attMonth" value="${ym}">`)}
    </div>
    ${list.length ? `<div class="month-wrap"><table class="month-table"><thead><tr><th class="sticky">${L('Nama Murid', 'Student')}</th>${head}<th>H</th><th>L</th><th>T</th><th>B</th><th>%</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="legend"><span><span class="cell c-H">H</span> ${stLabel('H')}</span><span><span class="cell c-L">L</span> ${stLabel('L')}</span><span><span class="cell c-TH">T</span> ${stLabel('TH')}</span><span><span class="cell c-B">B</span> ${stLabel('B')}</span><span class="muted">💡 ${L('Klik tarikh untuk kemas kini kehadiran hari tersebut.', 'Click a date to edit that day.')}</span></div>`
    : `<div class="empty-sm">${L('Tiada murid dalam kelas ini.', 'No students in this class.')}</div>`}</div>`;
}

/* ---------- Kerja Rumah ---------- */
VIEWS.homework = () => {
  const add = `<button class="btn btn-primary" data-act="addHw">＋ ${L('Tugasan Baru', 'New Assignment')}</button>`;
  const head = pageHead(L('Pengurusan Kerja Rumah', 'Homework Management'), L('Berikan tugasan kepada kelas dan pantau murid yang telah menghantar.', 'Assign work to classes and track who has submitted.'), S.classes.length ? add : '');
  if (!S.classes.length) return head + noClasses();
  const f = ensureClass('hwClass', true);
  const list = S.homework.filter(h => f === 'all' || h.classId === f).sort((a, b) => b.assigned.localeCompare(a.assigned));
  const chips = `<div class="chips" style="margin-bottom:18px"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="setUI" data-k="hwClass" data-v="all">${L('Semua Kelas', 'All Classes')}</button>${S.classes.map(c => `<button class="chip ${f === c.id ? 'on' : ''}" data-act="setUI" data-k="hwClass" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
  if (!list.length) return head + chips + empty('📚', L('Belum ada tugasan', 'No assignments yet'), L('Cipta tugasan pertama untuk kelas anda.', 'Create your first assignment.'), add);
  return head + chips + `<div class="grid-cards">${list.map(h => {
    const c = cls(h.classId), { done, total } = hwStats(h), pc = total ? Math.round(done / total * 100) : 0, du = daysUntil(h.due);
    const badge = du < 0 ? (done < total ? pill(L(`Tamat tempoh ${-du} hari lepas`, `Overdue by ${-du}d`), 'red') : pill(L('Selesai', 'Completed'), 'green')) : du === 0 ? pill(L('Hantar hari ini', 'Due today'), 'amber') : pill(L(`${du} hari lagi`, `${du} days left`), 'green');
    return `<div class="item-card" style="--c:${c?.color || '#9333ea'}">
      <div class="ic-top">${pill(esc(c?.name || '—') + ' · ' + esc(c?.subject || ''), 'purple')}${badge}</div>
      <h3>${esc(h.title)}</h3>${h.desc ? `<p class="desc">${esc(h.desc)}</p>` : ''}
      <div class="ic-dates"><span>📅 ${L('Diberi', 'Given')}: ${fmtDate(h.assigned)}</span><span>⏰ ${L('Hantar', 'Due')}: ${fmtDate(h.due)}</span></div>
      ${h.link ? `<a class="link" href="${esc(h.link)}" target="_blank" rel="noopener">🔗 ${L('Buka lampiran / pautan', 'Open attachment / link')}</a>` : ''}
      <div class="prog-label"><span>✅ ${done}/${total} ${L('Telah Dihantar', 'Submitted')}</span><span>${pc}%</span></div>
      <div class="progress ${pc === 100 ? 'full' : ''}"><i style="width:${pc}%"></i></div>
      <div class="ic-actions"><button class="btn btn-sm btn-primary" data-act="openHw" data-id="${h.id}">📋 ${L('Semak Tugasan', 'Check Submissions')}</button><button class="btn btn-sm btn-ghost btn-icon" data-act="editHw" data-id="${h.id}" title="Edit">✏️</button><button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delHw" data-id="${h.id}" title="${L('Padam', 'Delete')}">🗑️</button></div>
    </div>`;
  }).join('')}</div>`;
};

function hwFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? L('Kemas Kini Tugasan', 'Edit Assignment') : L('Tugasan Baru', 'New Assignment'),
    body: `<div class="form-grid">
      ${field(L('Kelas', 'Class') + ' *', `<select class="input" data-bind="classId">${classOptions(d.classId)}</select>`, 'full')}
      ${field(L('Tajuk Tugasan', 'Title') + ' *', inp('title', d.title, `placeholder="${L('cth: Bab 4 — Latihan Pecahan', 'e.g. Chapter 4 — Fractions')}"`), 'full')}
      ${field(L('Penerangan', 'Description'), `<textarea class="input" id="f-desc" data-bind="desc" rows="3">${esc(d.desc)}</textarea>`, 'full')}
      ${field(L('Tarikh Diberi', 'Date Given'), inp('assigned', d.assigned, 'type="date"'))}
      ${field(L('Tarikh Hantar', 'Due Date') + ' *', inp('due', d.due, 'type="date"'))}
      ${field(L('Pautan Lampiran (pilihan)', 'Attachment Link (optional)'), inp('link', d.link, 'placeholder="https://classroom.google.com/…"'), 'full')}
    </div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveHw">💾 ${L('Simpan', 'Save')}</button>`,
  };
}
function hwRecordModal() {
  const h = S.homework.find(x => x.id === UI.hwDraft.id);
  const r = UI.hwDraft.records;
  const list = studentsOf(h.classId);
  const done = list.filter(s => r[s.id]?.done).length;
  return {
    title: esc(h.title),
    sub: `${esc(clsName(h.classId))} • ${L('Tarikh hantar', 'Due')}: ${fmtDate(h.due)} • <b>${done}/${list.length}</b> ${L('telah dihantar', 'submitted')}`,
    head: list.length ? `<button class="btn btn-sm btn-soft-green" data-act="hwAllDone">⚡ ${L('Tanda Semua Telah Dihantar', 'Mark All Submitted')}</button>` : '',
    body: list.length ? list.map(s => {
      const x = r[s.id] || {};
      return `<div class="hw-row ${x.done ? 'done' : x.done === false ? 'notdone' : ''}">
        <div class="hw-top">${avatar(s)}<div class="who"><b>${esc(s.name)}</b><code>ID: ${esc(s.studentId)}</code></div>
          <div class="seg"><button class="seg-btn ok ${x.done ? 'on' : ''}" data-act="hwDone" data-sid="${s.id}" data-v="1">✅ ${L('Telah Dihantar', 'Submitted')}</button><button class="seg-btn no ${x.done === false ? 'on' : ''}" data-act="hwDone" data-sid="${s.id}" data-v="0">❌ ${L('Belum Dihantar', 'Not Yet')}</button></div></div>
        <div class="hw-bottom"><span class="lbl">${L('Tahap Pencapaian', 'Achievement')}:</span>
          ${Object.entries(LEVELS).map(([k, v]) => `<button class="lvl lvl-${k} ${x.level === k ? 'on' : ''}" data-act="hwLevel" data-sid="${s.id}" data-v="${k}">${v.icon} ${L(v.ms, v.en)}</button>`).join('')}
          <input class="input note" id="note-${s.id}" placeholder="${L('Ulasan guru…', 'Teacher comment…')}" value="${esc(x.note || '')}" data-inp="hwNote" data-sid="${s.id}"></div>
      </div>`;
    }).join('') : `<div class="empty-sm">${L('Tiada murid dalam kelas ini.', 'No students in this class.')}</div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="hwSave">💾 ${L('Simpan & Tutup', 'Save & Close')}</button>`,
  };
}

/* ---------- Peperiksaan ---------- */
VIEWS.exams = () => {
  const add = `<button class="btn btn-primary" data-act="addExam">＋ ${L('Peperiksaan Baru', 'New Exam')}</button>`;
  const head = pageHead(L('Peperiksaan & Pentaksiran', 'Exams & Assessments'), L('Masukkan markah murid — gred, purata dan kedudukan dikira secara automatik.', 'Enter marks — grades, averages and rankings are calculated automatically.'), S.classes.length ? add : '');
  if (!S.classes.length) return head + noClasses();
  const f = ensureClass('exClass', true);
  const list = S.exams.filter(e => f === 'all' || e.classId === f).sort((a, b) => b.date.localeCompare(a.date));
  const chips = `<div class="chips" style="margin-bottom:18px"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="setUI" data-k="exClass" data-v="all">${L('Semua Kelas', 'All Classes')}</button>${S.classes.map(c => `<button class="chip ${f === c.id ? 'on' : ''}" data-act="setUI" data-k="exClass" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
  if (!list.length) return head + chips + empty('📝', L('Belum ada peperiksaan', 'No exams yet'), L('Cipta peperiksaan atau ujian untuk mula masukkan markah.', 'Create an exam to start entering marks.'), add);
  return head + chips + `<div class="grid-cards">${list.map(e => {
    const c = cls(e.classId), st = examStats(e), total = studentsOf(e.classId).length;
    const maxD = st ? Math.max(...Object.values(st.dist), 1) : 1;
    return `<div class="item-card" style="--c:${c?.color || '#9333ea'}">
      <div class="ic-top">${pill(esc(c?.name || '—') + ' · ' + esc(c?.subject || ''), 'purple')}${pill(`${st?.n || 0}/${total} ${L('markah', 'marked')}`, st && st.n === total ? 'green' : 'amber')}</div>
      <h3>${esc(e.title)}</h3>
      <div class="ic-dates"><span>📅 ${fmtDate(e.date)}</span><span>🎯 ${L('Markah penuh', 'Full marks')}: ${e.max}</span></div>
      ${st ? `<div class="ex-stats"><div><b>${st.avg}</b><small>${L('Purata', 'Average')}</small></div><div><b>${st.max}</b><small>${L('Tertinggi', 'Highest')}</small></div><div><b>${st.min}</b><small>${L('Terendah', 'Lowest')}</small></div><div><b>${st.pass}%</b><small>${L('Lulus', 'Pass')}</small></div></div>
      <div class="gdist">${Object.entries(st.dist).map(([g, n]) => `<div><small>${n}</small><i class="g-${g}" style="height:${Math.max(6, n / maxD * 100)}%"></i><small>${g}</small></div>`).join('')}</div>` : `<p class="muted" style="font-size:13px">${L('Belum ada markah dimasukkan.', 'No marks entered yet.')}</p>`}
      <div class="ic-actions"><button class="btn btn-sm btn-primary" data-act="openMarks" data-id="${e.id}">✍️ ${L('Masukkan Markah', 'Enter Marks')}</button><button class="btn btn-sm btn-ghost btn-icon" data-act="editExam" data-id="${e.id}">✏️</button><button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delExam" data-id="${e.id}">🗑️</button></div>
    </div>`;
  }).join('')}</div>`;
};
function examFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? L('Kemas Kini Peperiksaan', 'Edit Exam') : L('Peperiksaan Baru', 'New Exam'),
    body: `<div class="form-grid">
      ${field(L('Kelas', 'Class') + ' *', `<select class="input" data-bind="classId">${classOptions(d.classId)}</select>`, 'full')}
      ${field(L('Nama Peperiksaan / Ujian', 'Exam Name') + ' *', inp('title', d.title, `placeholder="${L('cth: Ujian Bulanan Oktober', 'e.g. October Monthly Test')}"`), 'full')}
      ${field(L('Tarikh', 'Date'), inp('date', d.date, 'type="date"'))}
      ${field(L('Markah Penuh', 'Full Marks'), inp('max', d.max, 'type="number" min="1"'))}
    </div><p class="hint">📊 ${L('Gred: A (80–100) • B (65–79) • C (50–64) • D (40–49) • E (0–39)', 'Grades: A (80–100) • B (65–79) • C (50–64) • D (40–49) • E (0–39)')}</p>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveExam">💾 ${L('Simpan', 'Save')}</button>`,
  };
}
function marksModal() {
  const e = S.exams.find(x => x.id === UI.examDraft.id);
  const m = UI.examDraft.marks;
  const list = studentsOf(e.classId);
  return {
    title: `✍️ ${esc(e.title)}`,
    sub: `${esc(clsName(e.classId))} • ${fmtDate(e.date)} • ${L('Markah penuh', 'Full marks')}: ${e.max}`,
    body: list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${L('Nama Murid', 'Student')}</th><th class="num">${L('Markah', 'Mark')}</th><th class="num">${L('Gred', 'Grade')}</th></tr></thead><tbody>
      ${list.map((s, i) => { const g = grade(m[s.id], e.max); return `<tr><td>${i + 1}</td><td><div style="display:flex;gap:10px;align-items:center">${avatar(s)}<div class="who"><b>${esc(s.name)}</b><code>${esc(s.studentId)}</code></div></div></td>
        <td class="num"><input type="number" class="input mark" id="mk-${s.id}" min="0" max="${e.max}" step="0.5" value="${m[s.id] ?? ''}" data-inp="markInp" data-sid="${s.id}" placeholder="—"></td>
        <td class="num"><span class="grade g-${g || ''}" id="g-${s.id}">${g || '—'}</span></td></tr>`; }).join('')}
      </tbody></table></div><p class="hint">💡 ${L('Tekan Tab untuk ke murid seterusnya. Biarkan kosong jika murid tidak menduduki.', 'Press Tab to move to the next student. Leave blank if absent.')}</p>`
      : `<div class="empty-sm">${L('Tiada murid dalam kelas ini.', 'No students in this class.')}</div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveMarks">💾 ${L('Simpan Markah', 'Save Marks')}</button>`,
  };
}

/* ---------- Jadual ---------- */
VIEWS.timetable = () => {
  const today = new Date().getDay();
  const head = pageHead(L('Jadual Waktu Mengajar', 'Teaching Timetable'), L('Klik pada slot untuk ubah, atau tambah slot baru bagi setiap hari.', 'Click a slot to edit it, or add new slots for each day.'), S.classes.length ? `<button class="btn btn-primary" data-act="addSlot" data-day="${today >= 1 && today <= 5 ? today : 1}">＋ ${L('Tambah Slot', 'Add Slot')}</button>` : '');
  if (!S.classes.length) return head + noClasses();
  return head + `<div class="tt-grid">${[1, 2, 3, 4, 5].map(d => {
    const slots = S.timetable.filter(t => t.day === d).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="tt-col ${d === today ? 'today' : ''}"><div class="tt-day">${DAYS[lg()][d]}${d === today ? `<span>${L('Hari ini', 'Today')}</span>` : ''}</div>
      ${slots.map(t => { const c = cls(t.classId); return `<button class="tt-slot" style="--c:${c?.color || '#7c3aed'}" data-act="editSlot" data-id="${t.id}"><b>${fmtTime(t.start)} – ${fmtTime(t.end)}</b><span>${esc(c?.name || '—')}</span><small>${esc(t.subject)}${t.room ? ' • ' + esc(t.room) : ''}</small></button>`; }).join('') || `<div class="tt-empty">${L('Tiada kelas', 'No classes')}</div>`}
      <button class="tt-add" data-act="addSlot" data-day="${d}">＋ ${L('Tambah', 'Add')}</button></div>`;
  }).join('')}</div>`;
};
function slotFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? L('Kemas Kini Slot', 'Edit Slot') : L('Tambah Slot Jadual', 'Add Timetable Slot'),
    body: `<div class="form-grid">
      ${field(L('Hari', 'Day'), `<select class="input" data-bind="day">${[1, 2, 3, 4, 5, 6, 0].map(i => `<option value="${i}" ${Number(d.day) === i ? 'selected' : ''}>${DAYS[lg()][i]}</option>`).join('')}</select>`)}
      ${field(L('Kelas', 'Class'), `<select class="input" data-bind="classId">${classOptions(d.classId)}</select>`)}
      ${field(L('Masa Mula', 'Start'), inp('start', d.start, 'type="time"'))}
      ${field(L('Masa Tamat', 'End'), inp('end', d.end, 'type="time"'))}
      ${field(L('Subjek', 'Subject'), inp('subject', d.subject))}
      ${field(L('Bilik / Lokasi', 'Room'), inp('room', d.room))}
    </div>`,
    footer: `${d.id ? `<button class="btn btn-danger-ghost left" data-act="delSlot" data-id="${d.id}">🗑️ ${L('Padam', 'Delete')}</button>` : ''}<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveSlot">💾 ${L('Simpan', 'Save')}</button>`,
  };
}

/* ---------- Relief ---------- */
VIEWS.relief = () => {
  const add = `<button class="btn btn-primary" data-act="addRelief">＋ ${L('Tambah Relief', 'Add Relief')}</button>`;
  const yr = String(new Date().getFullYear()), mo = todayISO().slice(0, 7), ym = UI.relMonth;
  const sum = list => ({ n: list.length, m: list.reduce((t, r) => t + reliefMins(r), 0) });
  const sM = sum(S.reliefs.filter(r => r.date.startsWith(mo))), sY = sum(S.reliefs.filter(r => r.date.startsWith(yr)));
  const list = S.reliefs.filter(r => !ym || r.date.startsWith(ym)).sort(sortRelief).reverse();
  const total = sum(list);
  return pageHead(L('Senarai Relief', 'Relief Log'), L('Rekod setiap kelas relief — tarikh, hari, kelas, masa dan tempoh dikira automatik.', 'Log every relief class — date, day, class, time and duration calculated automatically.'), add)
  + `<div class="meet-stats">
      <div class="stat"><div class="stat-icon" style="background:#fef3c7">🔄</div><div><b>${sM.n}</b><small>${L('Relief Bulan Ini', 'Reliefs This Month')}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#f3e8ff">⏱️</div><div><b class="sm">${fmtDur(sM.m)}</b><small>${L('Masa Bulan Ini', 'Time This Month')}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#dbeafe">📆</div><div><b>${sY.n}</b><small>${L(`Relief Tahun ${yr}`, `Reliefs in ${yr}`)}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#dcfce7">🕒</div><div><b class="sm">${fmtDur(sY.m)}</b><small>${L('Masa Tahun Ini', 'Time This Year')}</small></div></div>
    </div>
    <div class="toolbar">${field(L('Bulan', 'Month'), `<input type="month" class="input" data-ui="relMonth" value="${ym}">`)}
      <button class="btn btn-sm ${ym ? 'btn-ghost' : 'btn-soft'}" style="align-self:flex-end;margin-bottom:4px" data-act="setUI" data-k="relMonth" data-v="">${L('Tunjuk Semua', 'Show All')}</button></div>`
  + (list.length ? `<div class="rl-cards">${list.map(r => { const d = parseISO(r.date); return `<div class="rl-card">
      <div class="mini-date" style="background:linear-gradient(160deg,#fbbf24,#d97706)"><b>${d.getDate()}</b><small>${MON_S[lg()][d.getMonth()]}</small></div>
      <div class="lr-main"><b>${esc(r.kelas)}${r.subject ? ` · <span class="muted">${esc(r.subject)}</span>` : ''}</b>
        <small>${DAYS[lg()][d.getDay()]} • ${fmtTime(r.start)} – ${fmtTime(r.end)}</small>
        <div class="m-tags" style="margin-top:6px">${pill('⏱️ ' + fmtDur(reliefMins(r)), 'amber')}${r.replacing ? pill('👤 ' + esc(r.replacing), 'gray') : ''}</div>
        ${r.notes ? `<small style="display:block;margin-top:4px">${esc(r.notes)}</small>` : ''}</div>
      <div class="rl-act"><button class="btn btn-sm btn-ghost btn-icon" data-act="editRelief" data-id="${r.id}">✏️</button><button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delRelief" data-id="${r.id}">🗑️</button></div></div>`; }).join('')}
      <p class="hint">${L('Jumlah', 'Total')}: <b>${total.n} ${L('relief', 'reliefs')}</b> • <b>${fmtDur(total.m)}</b></p></div>
    <div class="card rl-table" style="padding:12px"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${L('Tarikh', 'Date')}</th><th>${L('Hari', 'Day')}</th><th>${L('Kelas', 'Class')}</th><th>${L('Masa', 'Time')}</th><th>${L('Tempoh', 'Duration')}</th><th>${L('Ganti Guru', 'Covering For')}</th><th></th></tr></thead>
      <tbody>${list.map((r, i) => `<tr><td>${i + 1}</td><td style="white-space:nowrap"><b>${fmtDate(r.date)}</b></td><td>${DAYS[lg()][parseISO(r.date).getDay()]}</td>
        <td><b>${esc(r.kelas)}</b>${r.subject ? `<br><small class="muted">${esc(r.subject)}</small>` : ''}</td>
        <td style="white-space:nowrap">${fmtTime(r.start)} – ${fmtTime(r.end)}</td><td>${pill('⏱️ ' + fmtDur(reliefMins(r)), 'amber')}</td>
        <td>${esc(r.replacing || '—')}${r.notes ? `<br><small class="muted">${esc(r.notes)}</small>` : ''}</td>
        <td style="white-space:nowrap"><button class="btn btn-sm btn-ghost btn-icon" data-act="editRelief" data-id="${r.id}" title="Edit">✏️</button> <button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delRelief" data-id="${r.id}" title="${L('Padam', 'Delete')}">🗑️</button></td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint" style="padding:4px 8px">${L('Jumlah', 'Total')}: <b>${total.n} ${L('relief', 'reliefs')}</b> • <b>${fmtDur(total.m)}</b>${ym ? ` (${monthLabel(ym)})` : ''}</p></div>`
    : empty('🔄', L('Tiada relief direkod', 'No reliefs recorded'), ym ? L(`Tiada relief untuk ${monthLabel(ym)}.`, `No reliefs in ${monthLabel(ym)}.`) : L('Tambah rekod relief pertama.', 'Add your first relief record.'), add));
};
function reliefFormModal() {
  const d = UI.draft;
  const quick = [[30, L('30 minit', '30 min')], [60, L('1 jam', '1 hr')], [90, L('1 jam 30 minit', '1 hr 30 min')]];
  return {
    title: d.id ? `✏️ ${L('Kemas Kini Relief', 'Edit Relief')}` : `🔄 ${L('Tambah Relief', 'Add Relief')}`,
    body: `<div class="form-grid">
      ${field(`📅 ${L('Tarikh', 'Date')} *`, inp('date', d.date, 'type="date"'))}
      ${field(`🗓️ ${L('Hari', 'Day')}`, `<div class="input" id="relief-day" style="background:var(--p50);font-weight:700">${d.date ? DAYS[lg()][parseISO(d.date).getDay()] : '—'}</div>`)}
      ${field(`🏫 ${L('Kelas', 'Class')} *`, inp('kelas', d.kelas, `list="relief-classes" placeholder="${L('cth: 3 Arif', 'e.g. 3 Arif')}"`) + `<datalist id="relief-classes">${S.classes.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>`)}
      ${field(`📘 ${L('Subjek', 'Subject')}`, inp('subject', d.subject, `placeholder="${L('cth: Matematik', 'e.g. Maths')}"`))}
      ${field(`🕑 ${L('Masa Mula', 'Start Time')} *`, inp('start', d.start, 'type="time"'))}
      ${field(`🕔 ${L('Masa Tamat', 'End Time')} *`, inp('end', d.end, 'type="time"'))}
      <div class="field full"><span>⏱️ ${L('Berapa Masa', 'Duration')}</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="input" id="relief-dur" style="background:var(--amber-bg);border-color:var(--amber-line);color:var(--amber);font-weight:800;width:auto;min-width:150px">${fmtDur(reliefMins(d))}</div>
        <span class="muted" style="font-size:12.5px">${L('Pantas', 'Quick')}:</span>${quick.map(([m, t]) => `<button class="chip" data-act="reliefDur" data-m="${m}">${t}</button>`).join('')}</div></div>
      ${field(`👤 ${L('Ganti Guru', 'Covering For')}`, inp('replacing', d.replacing, `placeholder="${L('cth: Cikgu Rosmah (Kursus)', 'e.g. Mr. Lee (Sick leave)')}"`), 'full')}
      ${field(`🗒️ ${L('Catatan', 'Notes')}`, `<textarea class="input" id="f-notes" data-bind="notes" rows="3" placeholder="${L('cth: Murid buat latihan m/s 30', 'e.g. Students did exercise p.30')}">${esc(d.notes)}</textarea>`, 'full')}
    </div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveRelief">💾 ${L('Simpan', 'Save')}</button>`,
  };
}
function updateReliefLive() {
  const d = UI.draft, day = $('#relief-day'), dur = $('#relief-dur');
  if (day) day.textContent = d.date ? DAYS[lg()][parseISO(d.date).getDay()] : '—';
  if (dur) dur.textContent = d.end && d.start && d.end <= d.start ? L('⚠️ Masa tamat sebelum mula', '⚠️ End before start') : fmtDur(reliefMins(d));
}

/* ---------- Murid ---------- */
VIEWS.students = () => {
  const actions = S.classes.length ? `<button class="btn btn-ghost" data-act="openImport">📥 ${L('Import dari Excel', 'Import from Excel')}</button><button class="btn btn-primary" data-act="addStudent">＋ ${L('Murid Baru', 'New Student')}</button>` : '';
  const head = pageHead(L('Maklumat Murid', 'Students'), L('Profil murid, nombor telefon ibu bapa dan catatan guru.', 'Student profiles, parent contacts and teacher notes.'), actions);
  if (!S.classes.length) return head + noClasses();
  const f = ensureClass('stuClass', true);
  const q = UI.stuSearch.trim().toLowerCase();
  const list = S.students.filter(s => (f === 'all' || s.classId === f) && (!q || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || (s.parent || '').toLowerCase().includes(q))).sort(byName);
  return head + `<div class="toolbar"><div class="search"><input class="input" id="stu-search" data-ui="stuSearch" value="${esc(UI.stuSearch)}" placeholder="${L('Cari nama, ID atau nama ibu bapa…', 'Search name, ID or parent…')}"></div>
    <select class="input" data-ui="stuClass">${classOptions(f, true)}</select><span class="muted" style="font-size:13px">${list.length} ${L('murid', 'students')}</span></div>`
    + (list.length ? `<div class="grid-cards">${list.map(s => {
      const a = studentAtt(s.id), ps = pctStatus(a.pct);
      return `<button class="stu-card" data-act="viewStudent" data-id="${s.id}">${avatar(s, 'av-lg')}<div class="who"><b>${esc(s.name)}</b><small><code>${esc(s.studentId)}</code></small><small>🏫 ${esc(clsName(s.classId))}${s.phone ? ` • 📞 ${esc(s.phone)}` : ''}</small>
        <div class="meta">${pill(`📋 ${a.pct == null ? '—' : a.pct + '%'}`, ps.c)}${awardPoints(s.id) ? pill(`🏆 ${awardPoints(s.id)} ${L('mata', 'pts')}`, 'amber') : ''}</div></div></button>`;
    }).join('')}</div>` : empty('🔍', L('Tiada murid dijumpai', 'No students found'), q ? L('Cuba carian lain.', 'Try another search.') : L('Tambah murid baru atau import dari Excel.', 'Add a student or import from Excel.')));
};
function studentFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? L('Kemas Kini Murid', 'Edit Student') : L('Murid Baru', 'New Student'),
    body: `<div class="form-grid">
      ${field(L('Nama Penuh', 'Full Name') + ' *', inp('name', d.name), 'full')}
      ${field(L('Kelas', 'Class') + ' *', `<select class="input" data-bind="classId">${classOptions(d.classId)}</select>`)}
      ${field(L('No. ID Murid', 'Student ID'), inp('studentId', d.studentId))}
      ${field(L('Jantina', 'Gender'), `<select class="input" data-bind="gender"><option value="">—</option><option value="L" ${d.gender === 'L' ? 'selected' : ''}>${L('Lelaki', 'Male')}</option><option value="P" ${d.gender === 'P' ? 'selected' : ''}>${L('Perempuan', 'Female')}</option></select>`)}
      ${field(L('Nama Ibu Bapa / Penjaga', 'Parent / Guardian'), inp('parent', d.parent))}
      ${field(L('No. Telefon Ibu Bapa', 'Parent Phone'), inp('phone', d.phone, 'type="tel" placeholder="012-345 6789"'), 'full')}
      ${field(L('Catatan Guru', 'Teacher Notes'), `<textarea class="input" id="f-notes" data-bind="notes" rows="3" placeholder="${L('cth: alahan makanan, perlu duduk depan…', 'e.g. allergies, sits in front…')}">${esc(d.notes)}</textarea>`, 'full')}
    </div>
    <div class="form-section"><h4>${L('Pilih Avatar', 'Choose Avatar')}</h4><div class="emoji-pick">${AVATARS.map(a => `<button class="${d.avatar === a ? 'on' : ''}" data-act="pickDraft" data-k="avatar" data-v="${a}">${a}</button>`).join('')}</div></div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveStudent">💾 ${L('Simpan', 'Save')}</button>`,
  };
}
function studentProfileModal() {
  const s = stu(UI.profileId);
  if (!s) return { title: '—', body: '' };
  const a = studentAtt(s.id), ps = pctStatus(a.pct);
  const hws = S.homework.filter(h => h.classId === s.classId);
  const hwDone = hws.filter(h => h.records[s.id]?.done).length;
  const exams = S.exams.filter(e => e.marks[s.id] !== undefined && e.marks[s.id] !== '').sort((x, y) => y.date.localeCompare(x.date));
  const aw = S.awards.filter(x => x.sid === s.id).sort((x, y) => y.date.localeCompare(x.date));
  const wa = s.phone ? s.phone.replace(/\D/g, '').replace(/^0/, '60') : '';
  return {
    title: L('Profil Murid', 'Student Profile'),
    body: `<div class="profile-head">${avatar(s, 'av-lg')}<div><h2>${esc(s.name)}</h2><p class="muted"><code>${esc(s.studentId)}</code> • ${esc(clsName(s.classId))}${s.gender ? ` • ${s.gender === 'L' ? L('Lelaki', 'Male') : L('Perempuan', 'Female')}` : ''}</p></div></div>
      <div class="info-grid">
        <div class="info"><small>${L('Ibu Bapa / Penjaga', 'Parent / Guardian')}</small><b>${esc(s.parent || '—')}</b></div>
        <div class="info"><small>${L('No. Telefon', 'Phone')}</small><b>${s.phone ? `<a class="link" href="tel:${esc(s.phone)}">${esc(s.phone)}</a> &nbsp;·&nbsp; <a class="link" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : '—'}</b></div>
      </div>
      <div class="rs-summary" style="margin-top:14px">
        <div><b>${a.pct == null ? '—' : a.pct + '%'}</b><small>${L('Kehadiran', 'Attendance')}</small></div>
        <div><b>${a.TH}</b><small>${L('Hari Tidak Hadir', 'Days Absent')}</small></div>
        <div><b>${hwDone}/${hws.length}</b><small>${L('Kerja Rumah', 'Homework')}</small></div>
        <div><b>${awardPoints(s.id)}</b><small>${L('Mata Anugerah', 'Award Points')}</small></div>
      </div>
      <p>${pill(ps.t, ps.c)} &nbsp; <span class="muted" style="font-size:13px">${stLabel('H')} ${a.H} • ${stLabel('L')} ${a.L} • ${stLabel('TH')} ${a.TH} • ${stLabel('B')} ${a.B}</span></p>
      ${exams.length ? `<h4 class="rs-sub">📝 ${L('Keputusan Peperiksaan', 'Exam Results')}</h4>${exams.map(e => { const g = grade(e.marks[s.id], e.max); return `<div class="list-row"><div class="lr-main"><b>${esc(e.title)}</b><small>${fmtDate(e.date)}</small></div><b>${e.marks[s.id]}/${e.max}</b><span class="grade g-${g}">${g}</span></div>`; }).join('')}` : ''}
      ${aw.length ? `<h4 class="rs-sub">🏆 ${L('Anugerah', 'Awards')}</h4>${aw.map(x => { const t = awardType(x.type); return `<div class="list-row"><span style="font-size:22px">${t.icon}</span><div class="lr-main"><b>${L(t.ms, t.en)}</b><small>${fmtDate(x.date)}${x.note ? ' • ' + esc(x.note) : ''}</small></div><span class="pts">+${x.pts}</span></div>`; }).join('')}` : ''}
      ${s.notes ? `<h4 class="rs-sub">🗒️ ${L('Catatan Guru', 'Teacher Notes')}</h4><div class="detail-notes">${esc(s.notes)}</div>` : ''}`,
    footer: `<button class="btn btn-danger-ghost left" data-act="delStudent" data-id="${s.id}">🗑️ ${L('Padam', 'Delete')}</button><button class="btn btn-ghost" data-act="reportCard" data-id="${s.id}">🖨️ ${L('Kad Laporan', 'Report Card')}</button><button class="btn btn-primary" data-act="editStudent" data-id="${s.id}">✏️ ${L('Edit', 'Edit')}</button>`,
  };
}

/* Import murid dari Excel / CSV */
function splitCSVLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',' || ch === ';') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function parseImport(text) {
  const rows = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    .map(l => (l.includes('\t') ? l.split('\t') : splitCSVLine(l)).map(c => c.trim()));
  if (rows.length && /^(nama|name|bil|no\.?)$/i.test((rows[0][0] || '').replace(/\s+murid$/i, ''))) rows.shift(); // baris tajuk
  return rows
    .map(r => (r.length > 1 && /^\d+\.?$/.test(r[0]) ? r.slice(1) : r)) // buang lajur "Bil" jika ada
    .filter(r => r[0])
    .map(r => ({ name: r[0], parent: r[1] || '', phone: r[2] || '' }));
}
function importModal() {
  const d = UI.draft;
  const rows = parseImport(d.text);
  return {
    title: `📥 ${L('Import Murid dari Excel', 'Import Students from Excel')}`,
    sub: L('Salin (copy) lajur dari Excel dan tampal (paste) di bawah, atau muat naik fail .xlsx / .csv.', 'Copy columns from Excel and paste below, or upload a .xlsx / .csv file.'),
    body: `<div class="form-grid">
      ${field(L('Masukkan ke Kelas', 'Into Class'), `<select class="input" data-bind="classId">${classOptions(d.classId)}</select>`)}
      <label class="field"><span>${L('Muat Naik Fail', 'Upload File')}</span><input type="file" class="input" accept=".xlsx,.xls,.csv,.txt" data-file="importFile"></label>
    </div>
    <div class="alert alert-purple" style="margin:14px 0"><span class="al-icon">💡</span><div><b>${L('Susunan lajur', 'Column order')}: ${L('Nama Murid', 'Student Name')} | ${L('Nama Ibu Bapa', 'Parent Name')} | ${L('No. Telefon', 'Phone')}</b><small>${L('Hanya lajur Nama wajib. Baris tajuk akan diabaikan secara automatik.', 'Only the Name column is required. Header rows are skipped automatically.')}</small></div><button class="btn btn-sm btn-white" data-act="importTemplate">⬇️ ${L('Templat', 'Template')}</button></div>
    ${field(L('Tampal Data di Sini', 'Paste Data Here'), `<textarea class="input" id="imp-text" rows="8" data-inp="importText" placeholder="Aisyah Humaira&#9;Puan Rohana&#9;012-3456789\nMuhammad Danish&#9;Encik Kamarul&#9;013-2223344">${esc(d.text)}</textarea>`)}
    <div id="imp-preview" style="margin-top:14px">${importPreview(rows)}</div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="doImport">📥 ${L('Import Murid', 'Import Students')}</button>`,
  };
}
function importPreview(rows) {
  if (!rows.length) return `<p class="hint">${L('Pratonton akan dipaparkan di sini.', 'Preview appears here.')}</p>`;
  return `<h4 class="rs-sub" style="margin-top:0">👀 ${L('Pratonton', 'Preview')} — ${rows.length} ${L('murid', 'students')}</h4><div class="table-wrap" style="max-height:220px;overflow:auto"><table class="table"><thead><tr><th>#</th><th>${L('Nama', 'Name')}</th><th>${L('Ibu Bapa', 'Parent')}</th><th>${L('Telefon', 'Phone')}</th></tr></thead><tbody>${rows.slice(0, 50).map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.parent)}</td><td>${esc(r.phone)}</td></tr>`).join('')}</tbody></table></div>`;
}
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}

/* ---------- Kelas ---------- */
VIEWS.classes = () => {
  const add = `<button class="btn btn-primary" data-act="addClass">＋ ${L('Kelas Baru', 'New Class')}</button>`;
  const head = pageHead(L('Kelas & Subjek', 'Classes & Subjects'), L('Tambah, ubah atau padam kelas dan subjek yang Cikgu ajar.', 'Add, edit or remove the classes and subjects you teach.'), add);
  if (!S.classes.length) return head + empty('🏫', L('Belum ada kelas', 'No classes yet'), L('Mula dengan menambah kelas pertama.', 'Start by adding your first class.'), add);
  return head + `<div class="grid-cards">${S.classes.map(c => {
    const n = studentsOf(c.id).length, p = overallPct(c.id), hw = S.homework.filter(h => h.classId === c.id).length;
    return `<div class="class-card" style="--c:${c.color}"><div class="class-band"><h3>${esc(c.name)}</h3><p>${esc(c.subject)}</p><span class="big">🏫</span></div>
      <div class="class-body"><div class="class-nums"><div><b>${n}</b><small>${L('Murid', 'Students')}</small></div><div><b>${p == null ? '—' : p + '%'}</b><small>${L('Kehadiran', 'Attendance')}</small></div><div><b>${hw}</b><small>${L('Tugasan', 'Assignments')}</small></div></div>
      <div class="ic-actions"><button class="btn btn-sm btn-soft" data-act="classStudents" data-id="${c.id}">👧 ${L('Lihat Murid', 'View Students')}</button><button class="btn btn-sm btn-ghost btn-icon" data-act="editClass" data-id="${c.id}">✏️</button><button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delClass" data-id="${c.id}">🗑️</button></div></div></div>`;
  }).join('')}</div>`;
};
function classFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? L('Kemas Kini Kelas', 'Edit Class') : L('Kelas Baru', 'New Class'),
    body: `<div class="form-grid">
      ${field(L('Nama Kelas', 'Class Name') + ' *', inp('name', d.name, `placeholder="${L('cth: 4 Cerdik', 'e.g. 4 Cerdik')}"`))}
      ${field(L('Subjek', 'Subject') + ' *', inp('subject', d.subject, `placeholder="${L('cth: Bahasa Melayu', 'e.g. Science')}"`))}
    </div>
    <div class="form-section"><h4>${L('Warna Kelas', 'Class Colour')}</h4><div class="swatches">${COLORS.map(c => `<button class="swatch ${d.color === c ? 'on' : ''}" style="background:${c}" data-act="pickDraft" data-k="color" data-v="${c}"></button>`).join('')}</div></div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveClass">💾 ${L('Simpan', 'Save')}</button>`,
  };
}

/* ---------- Anugerah ---------- */
VIEWS.awards = () => {
  const add = `<button class="btn btn-primary" data-act="addAward">🏆 ${L('Beri Anugerah', 'Give Award')}</button>`;
  const head = pageHead(L('Anugerah & Mata Merit', 'Awards & Merit Points'), L('Hargai usaha murid — beri anugerah dan lihat carta kedudukan.', 'Recognise effort — give awards and see the leaderboard.'), S.students.length ? add : '');
  if (!S.students.length) return head + empty('🏆', L('Belum ada murid', 'No students yet'), L('Tambah murid dahulu.', 'Add students first.'), `<a class="btn btn-primary" href="#students">${L('Ke Senarai Murid', 'Go to Students')}</a>`);
  const f = ensureClass('awClass', true);
  const ranked = S.students.filter(s => f === 'all' || s.classId === f).map(s => ({ s, p: awardPoints(s.id) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
  const recent = S.awards.filter(a => { const s = stu(a.sid); return s && (f === 'all' || s.classId === f); }).sort((a, b) => b.date.localeCompare(a.date));
  return head + `<div class="chips" style="margin-bottom:18px"><button class="chip ${f === 'all' ? 'on' : ''}" data-act="setUI" data-k="awClass" data-v="all">${L('Semua Kelas', 'All Classes')}</button>${S.classes.map(c => `<button class="chip ${f === c.id ? 'on' : ''}" data-act="setUI" data-k="awClass" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>
  <div class="grid-2" style="margin-top:0">
    <div class="card"><div class="card-title"><h3>🥇 ${L('Carta Kedudukan', 'Leaderboard')}</h3></div>
      ${ranked.length ? ranked.slice(0, 10).map((x, i) => `<div class="lb-row"><div class="rank rank-${i + 1}">${i + 1}</div>${avatar(x.s)}<div class="lr-main" style="flex:1"><b>${esc(x.s.name)}</b><br><small class="muted">${esc(clsName(x.s.classId))}</small></div><span class="pts">${x.p} ${L('mata', 'pts')}</span></div>`).join('') : `<div class="empty-sm">${L('Belum ada anugerah.', 'No awards yet.')}</div>`}
    </div>
    <div class="card"><div class="card-title"><h3>🎉 ${L('Anugerah Terkini', 'Recent Awards')}</h3></div>
      ${recent.length ? recent.slice(0, 12).map(a => { const s = stu(a.sid), t = awardType(a.type); return `<div class="list-row"><span style="font-size:24px">${t.icon}</span><div class="lr-main"><b>${esc(s.name)} — ${L(t.ms, t.en)}</b><small>${fmtDate(a.date)}${a.note ? ' • ' + esc(a.note) : ''}</small></div><span class="pts">+${a.pts}</span><button class="btn btn-sm btn-danger-ghost btn-icon" data-act="delAward" data-id="${a.id}">🗑️</button></div>`; }).join('') : `<div class="empty-sm">${L('Belum ada anugerah.', 'No awards yet.')}</div>`}
    </div>
  </div>`;
};
function awardFormModal() {
  const d = UI.draft;
  const list = studentsOf(d.classId);
  if (!list.find(s => s.id === d.sid)) d.sid = list[0]?.id || '';
  return {
    title: `🏆 ${L('Beri Anugerah', 'Give an Award')}`,
    body: `<div class="form-grid">
      ${field(L('Kelas', 'Class'), `<select class="input" data-bind="classId" data-redraw="1">${classOptions(d.classId)}</select>`)}
      ${field(L('Murid', 'Student'), `<select class="input" data-bind="sid">${list.map(s => `<option value="${s.id}" ${s.id === d.sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`)}
    </div>
    <div class="form-section"><h4>${L('Jenis Anugerah', 'Award Type')}</h4><div class="award-types">${AWARDS.map(a => `<button class="award-type ${d.type === a.k ? 'on' : ''}" data-act="pickAward" data-v="${a.k}">${a.icon} ${L(a.ms, a.en)}<small>+${a.pts} ${L('mata', 'pts')}</small></button>`).join('')}</div></div>
    <div class="form-grid" style="margin-top:14px">
      ${field(L('Mata', 'Points'), inp('pts', d.pts, 'type="number" min="0"'))}
      ${field(L('Tarikh', 'Date'), inp('date', d.date, 'type="date"'))}
      ${field(L('Catatan', 'Note'), inp('note', d.note, `placeholder="${L('cth: Karangan terbaik minggu ini', 'e.g. Best essay this week')}"`), 'full')}
    </div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveAward">🏆 ${L('Beri Anugerah', 'Give Award')}</button>`,
  };
}

/* ---------- Mesyuarat & Kursus ---------- */
VIEWS.meetings = () => {
  const yr = String(new Date().getFullYear());
  const thisYear = S.meetings.filter(m => m.date.startsWith(yr));
  const hours = thisYear.filter(m => daysUntil(m.date) <= 0).reduce((t, m) => t + (Number(m.hours) || 0), 0);
  const photos = S.meetings.reduce((t, m) => t + m.photos.length, 0);
  const q = UI.meetSearch.trim().toLowerCase();
  let list = S.meetings.filter(m => (UI.meetCat === 'all' || m.category === UI.meetCat)
    && (!q || (m.title + ' ' + m.notes + ' ' + m.place).toLowerCase().includes(q))
    && (UI.meetFilter === 'all' || (UI.meetFilter === 'upcoming' ? daysUntil(m.date) >= 0 : daysUntil(m.date) < 0)));
  list = list.sort(sortMeet);
  if (UI.meetFilter !== 'upcoming') list.reverse();
  const groups = [];
  list.forEach(m => { const k = m.date.slice(0, 7); let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, items: [] }); g.items.push(m); });
  const tab = (k, t) => `<button class="${UI.meetFilter === k ? 'on' : ''}" data-act="setUI" data-k="meetFilter" data-v="${k}">${t}</button>`;
  const upcomingN = upcomingMeetings().length;
  return pageHead(L('Mesyuarat & Kursus', 'Meetings & Courses'), L('Rekod setiap mesyuarat, kursus, bengkel dan taklimat beserta catatan & bukti gambar.', 'Log every meeting, course, workshop and briefing with notes & photo evidence.'), `<button class="btn btn-primary" data-act="addMeeting">＋ ${L('Tambah Rekod', 'Add Record')}</button>`)
  + `<div class="meet-stats">
      <div class="stat"><div class="stat-icon" style="background:#f3e8ff">📅</div><div><b>${upcomingN}</b><small>${L('Akan Datang', 'Upcoming')}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#dbeafe">🗂️</div><div><b>${thisYear.length}</b><small>${L(`Rekod Tahun ${yr}`, `Records in ${yr}`)}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#dcfce7">🕒</div><div><b>${hours}</b><small>${L('Jam Kursus Tahun Ini', 'Course Hours This Year')}</small></div></div>
      <div class="stat"><div class="stat-icon" style="background:#fce7f3">📷</div><div><b>${photos}</b><small>${L('Bukti Gambar', 'Photos')}</small></div></div>
    </div>
    <div class="toolbar"><div class="seg-toggle">${tab('upcoming', `⏳ ${L('Akan Datang', 'Upcoming')}`)}${tab('past', `✓ ${L('Selesai', 'Past')}`)}${tab('all', L('Semua', 'All'))}</div>
      <select class="input" data-ui="meetCat" style="flex:0 0 auto"><option value="all">${L('Semua Kategori', 'All Categories')}</option>${Object.entries(MCAT).map(([k, v]) => `<option value="${k}" ${UI.meetCat === k ? 'selected' : ''}>${v.icon} ${L(v.ms, v.en)}</option>`).join('')}</select>
      <div class="search"><input class="input" id="meet-search" data-ui="meetSearch" value="${esc(UI.meetSearch)}" placeholder="${L('Cari tajuk, tempat atau catatan…', 'Search title, venue or notes…')}"></div></div>`
  + (groups.length ? groups.map(g => `<div class="month-label">${monthLabel(g.k)}</div>${g.items.map(meetCard).join('')}`).join('')
    : empty('🤝', UI.meetFilter === 'upcoming' ? L('Tiada mesyuarat akan datang', 'No upcoming meetings') : L('Tiada rekod dijumpai', 'No records found'), L('Tambah rekod mesyuarat atau kursus baru.', 'Add a new meeting or course record.'), `<button class="btn btn-primary" data-act="addMeeting">＋ ${L('Tambah Rekod', 'Add Record')}</button>`));
};
function meetCard(m) {
  const d = parseISO(m.date), du = daysUntil(m.date), c = mcat(m.category);
  return `<article class="m-card ${du < 0 ? 'past' : ''}">
    <div class="m-date cat-${c.c}"><small>${DAYS[lg()][d.getDay()].slice(0, 3)}</small><b>${d.getDate()}</b><span>${MON_S[lg()][d.getMonth()]} ${d.getFullYear()}</span></div>
    <div class="m-body">
      <div class="m-tags">${pill(c.icon + ' ' + mcatLabel(m.category), c.c)}${du >= 0 ? pill('⏳ ' + relDay(m.date), du <= 3 ? 'red' : 'purple') : pill('✓ ' + L('Selesai', 'Done'), 'green')}${Number(m.hours) ? pill(`🕒 ${m.hours} ${L('jam', 'hrs')}`, 'gray') : ''}${m.photos.length ? pill(`📷 ${m.photos.length}`, 'gray') : ''}</div>
      <h3>${esc(m.title)}</h3>
      <div class="m-meta">🕑 ${fmtTime(m.time)}${m.end ? ' – ' + fmtTime(m.end) : ''}${m.place ? ` &nbsp;•&nbsp; 📍 ${esc(m.place)}` : ''}</div>
      ${m.notes ? `<p class="m-notes">${esc(m.notes)}</p>` : ''}
      ${m.photos.length ? `<div class="m-photos">${m.photos.slice(0, 4).map((p, i) => `<button class="m-ph" data-act="lightbox" data-mid="${m.id}" data-i="${i}"><img data-photo="${p}" alt="">${i === 3 && m.photos.length > 4 ? `<span>+${m.photos.length - 4}</span>` : ''}</button>`).join('')}</div>` : ''}
    </div>
    <div class="m-actions"><button class="btn btn-sm btn-soft" data-act="viewMeeting" data-id="${m.id}">👁️ ${L('Lihat', 'View')}</button><button class="btn btn-sm btn-ghost" data-act="editMeeting" data-id="${m.id}">✏️ ${L('Edit', 'Edit')}</button><button class="btn btn-sm btn-danger-ghost" data-act="delMeeting" data-id="${m.id}">🗑️ ${L('Padam', 'Delete')}</button></div>
  </article>`;
}
function meetingFormModal() {
  const d = UI.draft;
  return {
    title: d.id ? `✏️ ${L('Kemas Kini Rekod', 'Edit Record')}` : `🤝 ${L('Tambah Mesyuarat / Kursus', 'Add Meeting / Course')}`,
    body: `<div class="form-grid">
      ${field(`📅 ${L('Tarikh', 'Date')} *`, inp('date', d.date, 'type="date"'))}
      ${field(`🏷️ ${L('Kategori', 'Category')}`, `<select class="input" data-bind="category">${Object.entries(MCAT).map(([k, v]) => `<option value="${k}" ${d.category === k ? 'selected' : ''}>${v.icon} ${L(v.ms, v.en)}</option>`).join('')}</select>`)}
      ${field(`🕑 ${L('Masa Mula', 'Start Time')} *`, inp('time', d.time, 'type="time"'))}
      ${field(`🕔 ${L('Masa Tamat', 'End Time')}`, inp('end', d.end, 'type="time"'))}
      ${field(`📌 ${L('Tajuk', 'Title')} *`, inp('title', d.title, `placeholder="${L('cth: Mesyuarat Panitia Bahasa Melayu Kali 3', 'e.g. Malay Language Panel Meeting #3')}"`), 'full')}
      ${field(`📍 ${L('Tempat / Penganjur', 'Venue / Organiser')}`, inp('place', d.place, `placeholder="${L('cth: Bilik Mesyuarat SKB', 'e.g. SKB Meeting Room')}"`))}
      ${field(`🕒 ${L('Jam Kredit Kursus', 'Course Credit Hours')}`, inp('hours', d.hours, 'type="number" min="0" step="0.5" placeholder="0"'))}
      ${field(`🗒️ ${L('Catatan', 'Notes')}`, `<textarea class="input" id="f-notes" data-bind="notes" rows="5" placeholder="${L('Perkara dibincang, tindakan susulan, apa yang dipelajari…', 'Discussion points, action items, key learnings…')}">${esc(d.notes)}</textarea>`, 'full')}
    </div>
    <div class="form-section"><h4>📷 ${L('Bukti Gambar', 'Photo Evidence')} (${d.photos.length})</h4>
      <div class="photo-grid">${d.photos.map((p, i) => `<div class="ph"><img ${p.src ? `src="${p.src}"` : `data-photo="${p.id}"`} alt=""><button class="ph-x" data-act="rmPhoto" data-i="${i}" title="${L('Buang', 'Remove')}">✕</button></div>`).join('')}
        <label class="ph-add"><input type="file" accept="image/*" multiple data-file="addPhotos" hidden><span>＋</span><small>${L('Tambah Gambar', 'Add Photos')}</small></label></div>
      <p class="hint">${L('Boleh pilih banyak gambar sekaligus. Gambar dikecilkan secara automatik untuk jimat ruang.', 'You can select multiple photos. They are compressed automatically to save space.')}</p></div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveMeeting">💾 ${L('Simpan Rekod', 'Save Record')}</button>`,
  };
}
function meetingDetailModal() {
  const m = S.meetings.find(x => x.id === UI.meetId);
  if (!m) return { title: '—', body: '' };
  const c = mcat(m.category), du = daysUntil(m.date);
  return {
    title: esc(m.title),
    sub: `${c.icon} ${mcatLabel(m.category)} • ${du >= 0 ? relDay(m.date) : L('Selesai', 'Completed')}`,
    body: `<div class="info-grid">
        <div class="info"><small>📅 ${L('Tarikh', 'Date')}</small><b>${fmtDate(m.date, true)}</b></div>
        <div class="info"><small>🕑 ${L('Masa', 'Time')}</small><b>${fmtTime(m.time)}${m.end ? ' – ' + fmtTime(m.end) : ''}</b></div>
        <div class="info"><small>📍 ${L('Tempat / Penganjur', 'Venue / Organiser')}</small><b>${esc(m.place || '—')}</b></div>
        <div class="info"><small>🕒 ${L('Jam Kredit', 'Credit Hours')}</small><b>${Number(m.hours) ? m.hours + ' ' + L('jam', 'hours') : '—'}</b></div>
      </div>
      <h4 class="rs-sub">🗒️ ${L('Catatan', 'Notes')}</h4>
      <div class="detail-notes">${m.notes ? esc(m.notes) : `<span class="muted">${L('Tiada catatan.', 'No notes.')}</span>`}</div>
      <h4 class="rs-sub">📷 ${L('Bukti Gambar', 'Photo Evidence')} (${m.photos.length})</h4>
      ${m.photos.length ? `<div class="gallery">${m.photos.map((p, i) => `<button data-act="lightbox" data-mid="${m.id}" data-i="${i}"><img data-photo="${p}" alt=""></button>`).join('')}</div>` : `<div class="empty-sm">${L('Tiada gambar dimuat naik.', 'No photos uploaded.')}</div>`}`,
    footer: `<button class="btn btn-danger-ghost left" data-act="delMeeting" data-id="${m.id}">🗑️ ${L('Padam', 'Delete')}</button><button class="btn btn-ghost" data-act="closeModal">${L('Tutup', 'Close')}</button><button class="btn btn-primary" data-act="editMeeting" data-id="${m.id}">✏️ ${L('Edit', 'Edit')}</button>`,
  };
}
async function drawLightbox() {
  const { ids, i } = UI.lb;
  const src = await getPhoto(ids[i]);
  $('#lightbox-root').innerHTML = `<div class="lightbox" data-act="lbClose" data-self="1"><img src="${src || ''}" alt="">
    <a class="lb-dl" href="${src || '#'}" download="bukti-gambar-${i + 1}.jpg" title="${L('Muat turun', 'Download')}">⬇</a><button class="lb-x" data-act="lbClose">✕</button>
    ${ids.length > 1 ? `<button class="lb-prev" data-act="lbNav" data-d="-1">‹</button><button class="lb-next" data-act="lbNav" data-d="1">›</button><div class="lb-count">${i + 1} / ${ids.length}</div>` : ''}</div>`;
}

/* ---------- Laporan ---------- */
const REPORTS = {
  attendance() {
    const cid = ensureClass('rClass'), ym = UI.rMonth, c = cls(cid);
    const rows = studentsOf(cid).map(s => { const a = studentAtt(s.id, ym || null); return { s, a, st: pctStatus(a.pct) }; });
    const tot = rows.reduce((t, r) => ({ H: t.H + r.a.H, L: t.L + r.a.L, TH: t.TH + r.a.TH, B: t.B + r.a.B }), { H: 0, L: 0, TH: 0, B: 0 });
    const all = tot.H + tot.L + tot.TH + tot.B;
    return {
      filters: `${field(L('Kelas', 'Class'), `<select class="input" data-ui="rClass">${classOptions(cid)}</select>`)}
        ${field(L('Bulan (kosong = keseluruhan)', 'Month (blank = all)'), `<input type="month" class="input" data-ui="rMonth" value="${ym}">`)}
        ${ym ? `<button class="btn btn-ghost btn-sm" style="margin-bottom:4px" data-act="setUI" data-k="rMonth" data-v="">✕ ${L('Keseluruhan', 'All time')}</button>` : ''}`,
      tag: `${c.name} – ${c.subject}`,
      title: `${L('Penyata Kehadiran Murid', 'Student Attendance Statement')} — ${ym ? monthLabel(ym) : L('Keseluruhan', 'Overall')}`,
      html: `<div class="rs-summary"><div><b>${rows.length}</b><small>${L('Bilangan Murid', 'Students')}</small></div><div><b>${all ? Math.round((tot.H + tot.L) / all * 100) + '%' : '—'}</b><small>${L('Purata Kehadiran', 'Avg Attendance')}</small></div><div><b>${tot.TH}</b><small>${L('Jumlah Tidak Hadir', 'Total Absences')}</small></div><div><b>${tot.L}</b><small>${L('Jumlah Lewat', 'Total Late')}</small></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${L('Nama Murid', 'Student')}</th><th>${L('No. ID', 'ID')}</th><th class="num">${stLabel('H')}</th><th class="num">${stLabel('L')}</th><th class="num">${stLabel('TH')}</th><th class="num">${stLabel('B')}</th><th class="num">${L('Peratus', 'Rate')}</th><th>${L('Status', 'Status')}</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.s.name)}</b></td><td><code>${esc(r.s.studentId)}</code></td><td class="num">${r.a.H}</td><td class="num">${r.a.L}</td><td class="num">${r.a.TH}</td><td class="num">${r.a.B}</td><td class="num"><b>${r.a.pct == null ? '—' : r.a.pct + '%'}</b></td><td>${pill(r.st.t, r.st.c)}</td></tr>`).join('')}</tbody></table></div>`,
      csv: [[L('Bil', 'No'), L('Nama Murid', 'Student'), L('No. ID', 'ID'), stLabel('H'), stLabel('L'), stLabel('TH'), stLabel('B'), '%', L('Status', 'Status')], ...rows.map((r, i) => [i + 1, r.s.name, r.s.studentId, r.a.H, r.a.L, r.a.TH, r.a.B, r.a.pct ?? '', r.st.t])],
      file: `kehadiran-${safeName(c.name)}-${ym || 'keseluruhan'}.csv`,
    };
  },
  homework() {
    const cid = ensureClass('rClass'), c = cls(cid);
    const hws = S.homework.filter(h => h.classId === cid).sort((a, b) => a.due.localeCompare(b.due));
    const rows = [];
    studentsOf(cid).forEach(s => hws.forEach(h => { if (!h.records[s.id]?.done) rows.push({ s, h, du: daysUntil(h.due) }); }));
    return {
      filters: field(L('Kelas', 'Class'), `<select class="input" data-ui="rClass">${classOptions(cid)}</select>`),
      tag: `${c.name} – ${c.subject}`,
      title: L('Audit Kerja Rumah Tertunggak', 'Outstanding Homework Audit'),
      html: `<div class="rs-summary"><div><b>${hws.length}</b><small>${L('Jumlah Tugasan', 'Assignments')}</small></div><div><b>${rows.length}</b><small>${L('Belum Dihantar', 'Not Submitted')}</small></div><div><b>${rows.filter(r => r.du < 0).length}</b><small>${L('Lewat Tarikh', 'Overdue')}</small></div><div><b>${new Set(rows.map(r => r.s.id)).size}</b><small>${L('Murid Terlibat', 'Students')}</small></div></div>
        ${rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>${L('Nama Murid', 'Student')}</th><th>${L('Tugasan', 'Assignment')}</th><th>${L('Tarikh Hantar', 'Due')}</th><th>${L('Status', 'Status')}</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.s.name)}</b></td><td>${esc(r.h.title)}</td><td>${fmtDate(r.h.due)}</td><td>${r.du < 0 ? pill(L(`Lewat ${-r.du} hari`, `${-r.du}d overdue`), 'red') : pill(L('Belum tamat tempoh', 'Not due yet'), 'amber')}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty-sm">🎉 ${L('Tiada kerja rumah tertunggak!', 'No outstanding homework!')}</div>`}`,
      csv: [[L('Bil', 'No'), L('Nama Murid', 'Student'), L('No. ID', 'ID'), L('Tugasan', 'Assignment'), L('Tarikh Hantar', 'Due'), L('Status', 'Status')], ...rows.map((r, i) => [i + 1, r.s.name, r.s.studentId, r.h.title, r.h.due, r.du < 0 ? L(`Lewat ${-r.du} hari`, `${-r.du}d overdue`) : L('Belum tamat tempoh', 'Not due yet')])],
      file: `kerja-rumah-tertunggak-${safeName(c.name)}.csv`,
    };
  },
  card() {
    const cid = ensureClass('rClass'), c = cls(cid), list = studentsOf(cid);
    if (!list.find(s => s.id === UI.rStudent)) UI.rStudent = list[0]?.id || null;
    const s = stu(UI.rStudent);
    const filters = `${field(L('Kelas', 'Class'), `<select class="input" data-ui="rClass">${classOptions(cid)}</select>`)}
      ${field(L('Murid', 'Student'), `<select class="input" data-ui="rStudent">${list.map(x => `<option value="${x.id}" ${x.id === UI.rStudent ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`)}
      ${s ? field(L('Ulasan Guru (dicetak dalam kad)', 'Teacher Remark (printed)'), `<textarea class="input" id="remark-${s.id}" rows="2" data-inp="remark" data-sid="${s.id}" style="min-width:300px;min-height:44px">${esc(s.remark || '')}</textarea>`, 'grow') : ''}`;
    if (!s) return { filters, tag: c.name, title: L('Kad Pelaporan Murid', 'Student Report Card'), html: `<div class="empty-sm">${L('Tiada murid.', 'No students.')}</div>`, csv: [], file: 'kad.csv' };
    const a = studentAtt(s.id), ps = pctStatus(a.pct);
    const hws = S.homework.filter(h => h.classId === s.classId).sort((x, y) => x.due.localeCompare(y.due));
    const exams = S.exams.filter(e => e.classId === s.classId).sort((x, y) => x.date.localeCompare(y.date));
    const aw = S.awards.filter(x => x.sid === s.id);
    return {
      filters, tag: `${c.name} – ${c.subject}`,
      title: L('Kad Pelaporan Kemajuan Murid', 'Student Progress Report Card'),
      html: `<div class="profile-head">${avatar(s, 'av-lg')}<div><h2>${esc(s.name)}</h2><p class="muted"><code>${esc(s.studentId)}</code> • ${esc(c.name)} • ${L('Ibu Bapa', 'Parent')}: ${esc(s.parent || '—')}</p></div></div>
        <div class="rs-summary"><div><b>${a.pct == null ? '—' : a.pct + '%'}</b><small>${L('Kehadiran', 'Attendance')}</small></div><div><b>${a.TH}</b><small>${L('Tidak Hadir', 'Absent')}</small></div><div><b>${hws.filter(h => h.records[s.id]?.done).length}/${hws.length}</b><small>${L('Kerja Rumah Dihantar', 'Homework Submitted')}</small></div><div><b>${awardPoints(s.id)}</b><small>${L('Mata Anugerah', 'Award Points')}</small></div></div>
        <p>${L('Status Kehadiran', 'Attendance Status')}: ${pill(ps.t, ps.c)}</p>
        <h4 class="rs-sub">📝 ${L('Keputusan Peperiksaan', 'Exam Results')}</h4>
        ${exams.length ? `<table class="table"><thead><tr><th>${L('Peperiksaan', 'Exam')}</th><th>${L('Tarikh', 'Date')}</th><th class="num">${L('Markah', 'Mark')}</th><th class="num">${L('Gred', 'Grade')}</th></tr></thead><tbody>${exams.map(e => { const v = e.marks[s.id]; const g = grade(v, e.max); return `<tr><td>${esc(e.title)}</td><td>${fmtDate(e.date)}</td><td class="num">${v === undefined || v === '' ? '—' : `${v}/${e.max}`}</td><td class="num"><span class="grade g-${g || ''}">${g || '—'}</span></td></tr>`; }).join('')}</tbody></table>` : `<p class="muted">—</p>`}
        <h4 class="rs-sub">📚 ${L('Kerja Rumah', 'Homework')}</h4>
        ${hws.length ? `<table class="table"><thead><tr><th>${L('Tugasan', 'Assignment')}</th><th>${L('Status', 'Status')}</th><th>${L('Tahap', 'Level')}</th><th>${L('Ulasan', 'Comment')}</th></tr></thead><tbody>${hws.map(h => { const r = h.records[s.id] || {}; return `<tr><td>${esc(h.title)}</td><td>${r.done ? pill('✓ ' + L('Dihantar', 'Submitted'), 'green') : pill(L('Belum', 'Pending'), 'red')}</td><td>${r.level ? LEVELS[r.level].icon + ' ' + L(LEVELS[r.level].ms, LEVELS[r.level].en) : '—'}</td><td>${esc(r.note || '')}</td></tr>`; }).join('')}</tbody></table>` : `<p class="muted">—</p>`}
        ${aw.length ? `<h4 class="rs-sub">🏆 ${L('Anugerah', 'Awards')}</h4><p>${aw.map(x => { const t = awardType(x.type); return pill(`${t.icon} ${L(t.ms, t.en)}`, 'purple'); }).join(' ')}</p>` : ''}
        <h4 class="rs-sub">💬 ${L('Ulasan Guru', 'Teacher Remark')}</h4><div class="rs-remark">${esc(s.remark || '')}</div>`,
      csv: [[L('Perkara', 'Item'), L('Nilai', 'Value')], [L('Nama', 'Name'), s.name], ['ID', s.studentId], [L('Kelas', 'Class'), c.name], [L('Kehadiran', 'Attendance'), (a.pct ?? '') + '%'], ...exams.map(e => [e.title, e.marks[s.id] ?? '']), [L('Ulasan Guru', 'Remark'), s.remark || '']],
      file: `kad-laporan-${safeName(s.name)}.csv`,
    };
  },
  exam() {
    if (!S.exams.length) return { filters: '', tag: '—', title: L('Keputusan Peperiksaan', 'Exam Results'), html: `<div class="empty-sm">${L('Belum ada peperiksaan.', 'No exams yet.')}</div>`, csv: [], file: 'peperiksaan.csv' };
    const exams = [...S.exams].sort((a, b) => b.date.localeCompare(a.date));
    if (!S.exams.find(e => e.id === UI.rExam)) UI.rExam = exams[0].id;
    const e = S.exams.find(x => x.id === UI.rExam), c = cls(e.classId), st = examStats(e);
    const rows = studentsOf(e.classId).map(s => ({ s, m: e.marks[s.id] })).sort((a, b) => (b.m === '' || b.m == null ? -1 : b.m) - (a.m === '' || a.m == null ? -1 : a.m));
    return {
      filters: field(L('Peperiksaan', 'Exam'), `<select class="input" data-ui="rExam">${exams.map(x => `<option value="${x.id}" ${x.id === e.id ? 'selected' : ''}>${esc(x.title)} — ${esc(clsName(x.classId))}</option>`).join('')}</select>`),
      tag: `${c?.name || ''} – ${c?.subject || ''}`,
      title: `${L('Keputusan', 'Results')}: ${esc(e.title)}`,
      html: `<div class="rs-summary"><div><b>${st?.avg ?? '—'}</b><small>${L('Purata', 'Average')}</small></div><div><b>${st?.max ?? '—'}</b><small>${L('Tertinggi', 'Highest')}</small></div><div><b>${st?.min ?? '—'}</b><small>${L('Terendah', 'Lowest')}</small></div><div><b>${st ? st.pass + '%' : '—'}</b><small>${L('Peratus Lulus', 'Pass Rate')}</small></div></div>
        <table class="table"><thead><tr><th>${L('Kedudukan', 'Rank')}</th><th>${L('Nama Murid', 'Student')}</th><th>${L('No. ID', 'ID')}</th><th class="num">${L('Markah', 'Mark')}</th><th class="num">${L('Gred', 'Grade')}</th></tr></thead>
        <tbody>${rows.map((r, i) => { const g = grade(r.m, e.max); const has = r.m !== '' && r.m != null; return `<tr><td class="num">${has ? i + 1 : '—'}</td><td><b>${esc(r.s.name)}</b></td><td><code>${esc(r.s.studentId)}</code></td><td class="num">${has ? `${r.m}/${e.max}` : L('TH', 'Absent')}</td><td class="num"><span class="grade g-${g || ''}">${g || '—'}</span></td></tr>`; }).join('')}</tbody></table>
        ${st ? `<p class="hint">${L('Taburan gred', 'Grade distribution')}: ${Object.entries(st.dist).map(([g, n]) => `<b>${g}</b>: ${n}`).join(' • ')}</p>` : ''}`,
      csv: [[L('Kedudukan', 'Rank'), L('Nama', 'Name'), 'ID', L('Markah', 'Mark'), L('Gred', 'Grade')], ...rows.map((r, i) => [i + 1, r.s.name, r.s.studentId, r.m ?? '', grade(r.m, e.max) || ''])],
      file: `keputusan-${safeName(e.title)}.csv`,
    };
  },
  relief() {
    const years = [...new Set([String(new Date().getFullYear()), ...S.reliefs.map(r => r.date.slice(0, 4))])].sort().reverse();
    const ym = UI.rRelMonth;
    const list = S.reliefs.filter(r => r.date.startsWith(ym || UI.rYear)).sort(sortRelief);
    const mins = list.reduce((t, r) => t + reliefMins(r), 0);
    return {
      filters: `${field(L('Tahun', 'Year'), `<select class="input" data-ui="rYear">${years.map(y => `<option ${y === UI.rYear ? 'selected' : ''}>${y}</option>`).join('')}</select>`)}
        ${field(L('Bulan (kosong = setahun)', 'Month (blank = whole year)'), `<input type="month" class="input" data-ui="rRelMonth" value="${ym}">`)}
        ${ym ? `<button class="btn btn-ghost btn-sm" style="margin-bottom:4px" data-act="setUI" data-k="rRelMonth" data-v="">✕ ${L('Setahun', 'Whole year')}</button>` : ''}`,
      tag: ym ? monthLabel(ym) : `${L('Tahun', 'Year')} ${UI.rYear}`,
      title: `${L('Rekod Kelas Relief', 'Relief Class Record')} — Cikgu ${esc(S.settings.teacherName)}`,
      html: `<div class="rs-summary"><div><b>${list.length}</b><small>${L('Jumlah Relief', 'Total Reliefs')}</small></div><div><b>${fmtDur(mins)}</b><small>${L('Jumlah Masa', 'Total Time')}</small></div><div><b>${new Set(list.map(r => r.kelas.toLowerCase())).size}</b><small>${L('Bilangan Kelas', 'Classes')}</small></div><div><b>${new Set(list.map(r => r.date)).size}</b><small>${L('Bilangan Hari', 'Days')}</small></div></div>
        ${list.length ? `<table class="table"><thead><tr><th>#</th><th>${L('Tarikh', 'Date')}</th><th>${L('Hari', 'Day')}</th><th>${L('Kelas', 'Class')}</th><th>${L('Masa', 'Time')}</th><th>${L('Tempoh', 'Duration')}</th><th>${L('Ganti Guru', 'Covering For')}</th></tr></thead>
        <tbody>${list.map((r, i) => `<tr><td>${i + 1}</td><td style="white-space:nowrap">${fmtDate(r.date)}</td><td>${DAYS[lg()][parseISO(r.date).getDay()]}</td><td><b>${esc(r.kelas)}</b>${r.subject ? `<br><small class="muted">${esc(r.subject)}</small>` : ''}</td><td style="white-space:nowrap">${fmtTime(r.start)} – ${fmtTime(r.end)}</td><td>${fmtDur(reliefMins(r))}</td><td>${esc(r.replacing || '—')}</td></tr>`).join('')}
        <tr><td colspan="5" style="text-align:right"><b>${L('JUMLAH', 'TOTAL')}</b></td><td colspan="2"><b>${fmtDur(mins)}</b></td></tr></tbody></table>`
        : `<div class="empty-sm">${L('Tiada rekod relief untuk tempoh ini.', 'No relief records for this period.')}</div>`}`,
      csv: [[L('Bil', 'No'), L('Tarikh', 'Date'), L('Hari', 'Day'), L('Kelas', 'Class'), L('Subjek', 'Subject'), L('Masa Mula', 'Start'), L('Masa Tamat', 'End'), L('Tempoh (minit)', 'Duration (min)'), L('Ganti Guru', 'Covering For'), L('Catatan', 'Notes')],
        ...list.map((r, i) => [i + 1, r.date, DAYS[lg()][parseISO(r.date).getDay()], r.kelas, r.subject, r.start, r.end, reliefMins(r), r.replacing, r.notes]),
        ['', '', '', '', '', '', L('JUMLAH', 'TOTAL'), mins, '', '']],
      file: `rekod-relief-${ym || UI.rYear}.csv`,
    };
  },
  meetings() {
    const years =[...new Set([String(new Date().getFullYear()), ...S.meetings.map(m => m.date.slice(0, 4))])].sort().reverse();
    const list = S.meetings.filter(m => m.date.startsWith(UI.rYear) && (UI.rCat === 'all' || m.category === UI.rCat)).sort(sortMeet);
    const hours = list.reduce((t, m) => t + (Number(m.hours) || 0), 0);
    return {
      filters: `${field(L('Tahun', 'Year'), `<select class="input" data-ui="rYear">${years.map(y => `<option ${y === UI.rYear ? 'selected' : ''}>${y}</option>`).join('')}</select>`)}
        ${field(L('Kategori', 'Category'), `<select class="input" data-ui="rCat"><option value="all">${L('Semua', 'All')}</option>${Object.entries(MCAT).map(([k, v]) => `<option value="${k}" ${UI.rCat === k ? 'selected' : ''}>${v.icon} ${L(v.ms, v.en)}</option>`).join('')}</select>`)}
        <label class="check"><input type="checkbox" data-act="togglePhotos" ${UI.rPhotos ? 'checked' : ''}> ${L('Sertakan bukti gambar', 'Include photo evidence')}</label>`,
      tag: `${L('Tahun', 'Year')} ${UI.rYear}`,
      title: `${L('Rekod Mesyuarat & Kursus', 'Meetings & Courses Record')} — Cikgu ${esc(S.settings.teacherName)}`,
      html: `<div class="rs-summary"><div><b>${list.length}</b><small>${L('Jumlah Rekod', 'Records')}</small></div><div><b>${list.filter(m => m.category === 'mesyuarat').length}</b><small>${L('Mesyuarat', 'Meetings')}</small></div><div><b>${list.filter(m => ['kursus', 'bengkel', 'ldp'].includes(m.category)).length}</b><small>${L('Kursus / Bengkel / LDP', 'Courses / Workshops')}</small></div><div><b>${hours}</b><small>${L('Jumlah Jam', 'Total Hours')}</small></div></div>
        ${list.length ? `<table class="table"><thead><tr><th>#</th><th>${L('Tarikh & Masa', 'Date & Time')}</th><th>${L('Tajuk', 'Title')}</th><th>${L('Kategori', 'Category')}</th><th>${L('Tempat', 'Venue')}</th><th class="num">${L('Jam', 'Hrs')}</th></tr></thead>
        <tbody>${list.map((m, i) => `<tr><td>${i + 1}</td><td style="white-space:nowrap">${fmtDate(m.date)}<br><small class="muted">${fmtTime(m.time)}${m.end ? ' – ' + fmtTime(m.end) : ''}</small></td><td><b>${esc(m.title)}</b>${m.notes ? `<br><small class="muted" style="white-space:pre-line">${esc(m.notes)}</small>` : ''}${UI.rPhotos && m.photos.length ? `<div class="rs-photos">${m.photos.map(p => `<img data-photo="${p}" alt="">`).join('')}</div>` : ''}</td><td>${mcat(m.category).icon} ${mcatLabel(m.category)}</td><td>${esc(m.place || '—')}</td><td class="num">${m.hours || '—'}</td></tr>`).join('')}</tbody></table>`
        : `<div class="empty-sm">${L('Tiada rekod untuk tahun ini.', 'No records for this year.')}</div>`}`,
      csv: [[L('Bil', 'No'), L('Tarikh', 'Date'), L('Masa Mula', 'Start'), L('Masa Tamat', 'End'), L('Tajuk', 'Title'), L('Kategori', 'Category'), L('Tempat', 'Venue'), L('Jam', 'Hours'), L('Catatan', 'Notes'), L('Bil. Gambar', 'Photos')], ...list.map((m, i) => [i + 1, m.date, m.time, m.end, m.title, mcatLabel(m.category), m.place, m.hours, m.notes, m.photos.length])],
      file: `rekod-mesyuarat-kursus-${UI.rYear}.csv`,
    };
  },
};

VIEWS.reports = () => {
  const st = S.settings;
  const head = pageHead(L(`Laporan Rasmi ${st.schoolShort}`, `${st.schoolShort} Official Reports`), L('Jana laporan, eksport CSV dan cetak / simpan sebagai PDF untuk kegunaan sendiri, ibu bapa atau sekolah.', 'Generate reports, export CSV and print / save as PDF.'),
    `<button class="btn btn-ghost" data-act="exportCSV">⬇️ ${L('Eksport CSV', 'Export CSV')}</button><button class="btn btn-primary" data-act="printReport">🖨️ ${L('Cetak / Simpan PDF', 'Print / Save PDF')}</button>`);
  const noClassTabs = ['relief', 'meetings'];
  if (!S.classes.length && !noClassTabs.includes(UI.rTab)) UI.rTab = 'meetings';
  const tabs = [['attendance', L('Penyata Kehadiran', 'Attendance')], ['homework', L('Audit Kerja Rumah Tertunggak', 'Outstanding Homework')], ['card', L('Kad Pelaporan Murid', 'Report Card')], ['exam', L('Keputusan Peperiksaan', 'Exam Results')], ['relief', L('Rekod Relief', 'Relief Record')], ['meetings', L('Rekod Mesyuarat & Kursus', 'Meetings & Courses')]];
  const r = REPORTS[UI.rTab]();
  return head + `<div class="card report-bar"><div class="tabs">${tabs.map(([k, t]) => `<button class="${UI.rTab === k ? 'on' : ''}" data-act="setUI" data-k="rTab" data-v="${k}" ${!S.classes.length && !noClassTabs.includes(k) ? 'disabled' : ''}>${t}</button>`).join('')}</div><div class="report-filters">${r.filters}</div></div>
  <div class="report-sheet card">
    <div class="rs-head"><img src="${LOGO}" alt=""><div class="rs-school"><h2>${esc(st.schoolName.toUpperCase())}</h2><p class="rs-motto">${esc(st.motto.toUpperCase().split(' ').join(' • '))}</p><p>${esc(st.address)}${st.schoolCode ? ` • ${L('Kod Sekolah', 'School Code')}: ${esc(st.schoolCode)}` : ''}</p></div>
      <div class="rs-right"><span class="rs-tag">${esc(r.tag)}</span><p>${L('Tarikh', 'Date')}: <b>${fmtDate(todayISO())}</b></p><p>${L('Guru', 'Teacher')}: <b>${esc(st.teacherName)}</b></p></div></div>
    <h3 class="rs-title">${r.title}</h3>
    ${r.html}
    <div class="rs-sign"><div><div class="line"></div><b>${esc(st.teacherName)}</b><small>${L('Guru', 'Teacher')}</small></div><div><div class="line"></div><b>&nbsp;</b><small>${L('Pengesahan Guru Besar / Penolong Kanan', 'Headmaster / Senior Assistant')}</small></div></div>
  </div>`;
};

/* ---------- Tetapan ---------- */
function settingsModal() {
  const d = UI.draft, lb = S.settings.lastBackup;
  return {
    title: `⚙️ ${L('Tetapan Sistem', 'System Settings')}`,
    body: `<div class="form-grid">
      ${field(L('Nama Penuh Guru', 'Teacher Full Name'), inp('teacherName', d.teacherName))}
      ${field(L('Nama Panggilan', 'Nickname'), inp('nickname', d.nickname))}
      ${field(L('Nama Sekolah', 'School Name'), inp('schoolName', d.schoolName), 'full')}
      ${field(L('Singkatan', 'Short Name'), inp('schoolShort', d.schoolShort))}
      ${field(L('Kod Sekolah', 'School Code'), inp('schoolCode', d.schoolCode, 'placeholder="cth: BBA1234"'))}
      ${field(L('Moto', 'Motto'), inp('motto', d.motto))}
      ${field(L('Alamat', 'Address'), inp('address', d.address))}
    </div>
    <div class="form-section"><h4>💾 ${L('Data & Salinan', 'Data & Backup')}</h4>
      <p class="hint" style="margin:0 0 10px">${L('Salinan terakhir', 'Last backup')}: <b>${lb ? fmtDate(lb.slice(0, 10)) : L('Belum pernah', 'Never')}</b> • <span id="storage-info">${L('Mengira ruang storan…', 'Checking storage…')}</span></p>
      <div class="page-actions">
        <button class="btn btn-soft btn-sm" data-act="backup">⬇️ ${L('Muat Turun Salinan', 'Download Backup')}</button>
        <button class="btn btn-soft btn-sm" data-act="restore">⬆️ ${L('Pulih dari Fail', 'Restore from File')}</button>
        <button class="btn btn-ghost btn-sm" data-act="loadSample">🧪 ${L('Muat Data Contoh', 'Load Sample Data')}</button>
        <button class="btn btn-danger-ghost btn-sm" data-act="eraseAll">🗑️ ${L('Kosongkan Semua Data', 'Erase All Data')}</button>
      </div></div>`,
    footer: `<button class="btn btn-ghost" data-act="closeModal">${L('Batal', 'Cancel')}</button><button class="btn btn-primary" data-act="saveSettings">💾 ${L('Simpan Tetapan', 'Save Settings')}</button>`,
  };
}

/* =========================================================
   ACTIONS
   ========================================================= */
const A = {};

A.setLang = el => { S.settings.lang = el.dataset.v; persist(); render(); drawModal(); };
A.setUI = el => { UI[el.dataset.k] = el.dataset.v; render(); };
A.toggleBell = () => { UI.bellOpen = !UI.bellOpen; render(); };
A.closeModal = (el, e) => { if (el.dataset.self && e.target !== el) return; closeModal(); };
A.askYes = () => { $('#confirm-root').innerHTML = ''; UI.askRes?.(true); };
A.askNo = (el, e) => { if (el.dataset.self && e.target !== el) return; $('#confirm-root').innerHTML = ''; UI.askRes?.(false); };
A.pickDraft = el => { UI.draft[el.dataset.k] = el.dataset.v; drawModal(); };

/* Kehadiran */
A.mark = el => { const d = ensureDraft(); d.data[el.dataset.sid] = el.dataset.v; d.dirty = true; render(); };
A.markAll = () => { const d = ensureDraft(); studentsOf(UI.attClass).forEach(s => { d.data[s.id] = 'H'; }); d.dirty = true; render(); toast(L('Semua murid ditanda Hadir — jangan lupa Simpan.', 'All marked present — remember to Save.'), 'info'); };
A.saveAtt = async () => {
  const d = ensureDraft(), list = studentsOf(UI.attClass);
  const missing = list.filter(s => !d.data[s.id]).length;
  if (missing === list.length) return toast(L('Sila tanda kehadiran sekurang-kurangnya seorang murid.', 'Please mark at least one student.'), 'err');
  if (missing && !await ask(L(`${missing} murid belum ditanda. Simpan juga?`, `${missing} students are unmarked. Save anyway?`))) return;
  const rec = {};
  list.forEach(s => { if (d.data[s.id]) rec[s.id] = d.data[s.id]; });
  S.attendance[d.key] = rec;
  d.dirty = false;
  if (await persistNow()) toast(`✅ ${L('Rekod kehadiran disimpan!', 'Attendance saved!')}`);
  render();
};
A.gotoDay = el => { UI.attDate = el.dataset.d; UI.attMode = 'daily'; render(); scrollTo(0, 0); };

/* Kerja rumah */
A.addHw = () => { UI.draft = { classId: UI.hwClass !== 'all' ? UI.hwClass : S.classes[0].id, title: '', desc: '', assigned: todayISO(), due: addDays(todayISO(), 3), link: '' }; openModal(hwFormModal); };
A.editHw = el => { UI.draft = clone(S.homework.find(h => h.id === el.dataset.id)); openModal(hwFormModal); };
A.saveHw = async () => {
  const d = UI.draft;
  if (!d.title.trim() || !d.due) return toast(L('Sila isi Tajuk dan Tarikh Hantar.', 'Please fill in Title and Due Date.'), 'err');
  const old = d.id && S.homework.find(h => h.id === d.id);
  const rec = { id: d.id || uid(), classId: d.classId, title: d.title.trim(), desc: d.desc, assigned: d.assigned || todayISO(), due: d.due, link: d.link.trim(), records: d.records || {} };
  if (old) Object.assign(old, rec); else S.homework.push(rec);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Tugasan disimpan', 'Assignment saved')}`);
};
A.delHw = async el => {
  const h = S.homework.find(x => x.id === el.dataset.id);
  if (!await ask(L(`Padam tugasan "${esc(h.title)}"? Rekod penghantaran juga akan dipadam.`, `Delete "${esc(h.title)}"? Submission records will be removed.`), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.homework = S.homework.filter(x => x.id !== h.id);
  await persistNow(); render(); toast(L('Tugasan dipadam', 'Assignment deleted'), 'info');
};
A.openHw = el => { closeModal(); UI.bellOpen = false; const h = S.homework.find(x => x.id === el.dataset.id); if (!h) return; UI.hwDraft = { id: h.id, records: clone(h.records) }; openModal(hwRecordModal, 'lg'); render(); };
const hwRec = sid => (UI.hwDraft.records[sid] ||= { done: undefined, level: '', note: '' });
A.hwDone = el => { const r = hwRec(el.dataset.sid); r.done = el.dataset.v === '1'; if (!r.done) r.level = ''; drawModal(); };
A.hwLevel = el => { const r = hwRec(el.dataset.sid); r.level = r.level === el.dataset.v ? '' : el.dataset.v; if (r.level) r.done = true; drawModal(); };
A.hwAllDone = () => { const h = S.homework.find(x => x.id === UI.hwDraft.id); studentsOf(h.classId).forEach(s => { hwRec(s.id).done = true; }); drawModal(); };
A.hwSave = async () => { const h = S.homework.find(x => x.id === UI.hwDraft.id); h.records = UI.hwDraft.records; await persistNow(); closeModal(); render(); toast(`✅ ${L('Rekod kerja rumah disimpan', 'Homework records saved')}`); };

/* Peperiksaan */
A.addExam = () => { UI.draft = { classId: UI.exClass !== 'all' ? UI.exClass : S.classes[0].id, title: '', date: todayISO(), max: 100 }; openModal(examFormModal); };
A.editExam = el => { UI.draft = clone(S.exams.find(e => e.id === el.dataset.id)); openModal(examFormModal); };
A.saveExam = async () => {
  const d = UI.draft;
  if (!d.title.trim() || !(Number(d.max) > 0)) return toast(L('Sila isi Nama dan Markah Penuh.', 'Please fill in Name and Full Marks.'), 'err');
  const old = d.id && S.exams.find(e => e.id === d.id);
  const rec = { id: d.id || uid(), classId: d.classId, title: d.title.trim(), date: d.date || todayISO(), max: Number(d.max), marks: d.marks || {} };
  if (old) Object.assign(old, rec); else S.exams.push(rec);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Peperiksaan disimpan', 'Exam saved')}`);
  if (!old) { UI.examDraft = { id: rec.id, marks: {} }; openModal(marksModal, 'md'); }
};
A.delExam = async el => {
  const e = S.exams.find(x => x.id === el.dataset.id);
  if (!await ask(L(`Padam "${esc(e.title)}" dan semua markahnya?`, `Delete "${esc(e.title)}" and all its marks?`), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.exams = S.exams.filter(x => x.id !== e.id);
  await persistNow(); render(); toast(L('Peperiksaan dipadam', 'Exam deleted'), 'info');
};
A.openMarks = el => { const e = S.exams.find(x => x.id === el.dataset.id); UI.examDraft = { id: e.id, marks: clone(e.marks) }; openModal(marksModal, 'md'); };
A.saveMarks = async () => {
  const e = S.exams.find(x => x.id === UI.examDraft.id);
  const bad = Object.values(UI.examDraft.marks).some(v => v !== '' && (v < 0 || v > e.max || isNaN(v)));
  if (bad) return toast(L(`Markah mesti antara 0 dan ${e.max}.`, `Marks must be between 0 and ${e.max}.`), 'err');
  e.marks = UI.examDraft.marks;
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Markah disimpan', 'Marks saved')}`);
};

/* Jadual */
A.addSlot = el => { const c = S.classes[0]; UI.draft = { day: el.dataset.day || 1, classId: c.id, start: '08:00', end: '09:00', subject: c.subject, room: '' }; openModal(slotFormModal); };
A.editSlot = el => { UI.draft = clone(S.timetable.find(t => t.id === el.dataset.id)); openModal(slotFormModal); };
A.saveSlot = async () => {
  const d = UI.draft;
  if (!d.start || !d.end || d.end <= d.start) return toast(L('Masa tamat mesti selepas masa mula.', 'End time must be after start time.'), 'err');
  const old = d.id && S.timetable.find(t => t.id === d.id);
  const rec = { id: d.id || uid(), day: Number(d.day), classId: d.classId, start: d.start, end: d.end, subject: d.subject.trim() || cls(d.classId)?.subject || '', room: d.room.trim() };
  if (old) Object.assign(old, rec); else S.timetable.push(rec);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Jadual dikemas kini', 'Timetable updated')}`);
};
A.delSlot = async el => {
  if (!await ask(L('Padam slot jadual ini?', 'Delete this slot?'), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.timetable = S.timetable.filter(t => t.id !== el.dataset.id);
  await persistNow(); closeModal(); render();
};

/* Relief */
A.addRelief = () => { UI.draft = { date: todayISO(), kelas: '', start: '08:00', end: '08:30', subject: '', replacing: '', notes: '' }; openModal(reliefFormModal, 'md'); };
A.editRelief = el => { UI.draft = clone(S.reliefs.find(r => r.id === el.dataset.id)); openModal(reliefFormModal, 'md'); };
A.reliefDur = el => { const d = UI.draft; d.end = minToTime(toMin(d.start || '08:00') + Number(el.dataset.m)); drawModal(); };
A.saveRelief = async () => {
  const d = UI.draft;
  if (!d.date || !d.kelas.trim() || !d.start || !d.end) return toast(L('Sila isi Tarikh, Kelas dan Masa.', 'Please fill in Date, Class and Time.'), 'err');
  if (d.end <= d.start) return toast(L('Masa tamat mesti selepas masa mula.', 'End time must be after start time.'), 'err');
  const old = d.id && S.reliefs.find(r => r.id === d.id);
  const rec = { id: d.id || uid(), date: d.date, kelas: d.kelas.trim(), start: d.start, end: d.end, subject: d.subject.trim(), replacing: d.replacing.trim(), notes: d.notes };
  if (old) Object.assign(old, rec); else S.reliefs.push(rec);
  if (UI.relMonth && !rec.date.startsWith(UI.relMonth)) UI.relMonth = rec.date.slice(0, 7);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Rekod relief disimpan', 'Relief saved')} — ${fmtDur(reliefMins(rec))}`);
};
A.delRelief = async el => {
  const r = S.reliefs.find(x => x.id === el.dataset.id);
  if (!await ask(L(`Padam relief ${esc(r.kelas)} pada ${fmtDate(r.date)}?`, `Delete relief for ${esc(r.kelas)} on ${fmtDate(r.date)}?`), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.reliefs = S.reliefs.filter(x => x.id !== r.id);
  await persistNow(); render(); toast(L('Relief dipadam', 'Relief deleted'), 'info');
};

/* Murid */
A.addStudent =() => { UI.draft = { name: '', classId: UI.stuClass !== 'all' ? UI.stuClass : S.classes[0].id, studentId: nextStudentId(), gender: '', parent: '', phone: '', notes: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] }; openModal(studentFormModal, 'md'); };
A.editStudent = el => { UI.draft = clone(stu(el.dataset.id)); openModal(studentFormModal, 'md'); };
A.viewStudent = el => { UI.profileId = el.dataset.id; openModal(studentProfileModal, 'md'); };
A.saveStudent = async () => {
  const d = UI.draft;
  if (!d.name.trim()) return toast(L('Sila isi nama murid.', 'Please enter the student name.'), 'err');
  const old = d.id && stu(d.id);
  const rec = { ...d, id: d.id || uid(), name: d.name.trim(), studentId: d.studentId.trim() || nextStudentId(), remark: d.remark || '' };
  if (old) Object.assign(old, rec); else S.students.push(rec);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Maklumat murid disimpan', 'Student saved')}`);
};
A.delStudent = async el => {
  const s = stu(el.dataset.id);
  if (!await ask(L(`Padam ${esc(s.name)}? Semua rekod murid ini (kehadiran, markah, anugerah) akan dipadam.`, `Delete ${esc(s.name)}? All their records will be removed.`), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.students = S.students.filter(x => x.id !== s.id);
  Object.values(S.attendance).forEach(r => delete r[s.id]);
  S.homework.forEach(h => delete h.records[s.id]);
  S.exams.forEach(e => delete e.marks[s.id]);
  S.awards = S.awards.filter(a => a.sid !== s.id);
  await persistNow(); closeModal(); render(); toast(L('Murid dipadam', 'Student deleted'), 'info');
};
A.reportCard = el => { const s = stu(el.dataset.id); UI.rTab = 'card'; UI.rClass = s.classId; UI.rStudent = s.id; closeModal(); if (UI.view === 'reports') render(); else location.hash = 'reports'; };
A.openImport = () => { UI.draft = { classId: UI.stuClass !== 'all' ? UI.stuClass : S.classes[0].id, text: '' }; openModal(importModal, 'md'); };
A.importTemplate = () => downloadCSV('templat-senarai-murid.csv', [['Nama Murid', 'Nama Ibu Bapa', 'No Telefon'], ['Aisyah Humaira', 'Puan Rohana', '012-3456789']]);
A.doImport = async () => {
  const rows = parseImport(UI.draft.text);
  if (!rows.length) return toast(L('Tiada data untuk diimport.', 'Nothing to import.'), 'err');
  const c = cls(UI.draft.classId);
  if (!await ask(L(`Import ${rows.length} murid ke kelas ${esc(c.name)}?`, `Import ${rows.length} students into ${esc(c.name)}?`), { ok: L('Import', 'Import') })) return;
  rows.forEach(r => S.students.push({ id: uid(), studentId: nextStudentId(), name: r.name, gender: '', classId: c.id, parent: r.parent, phone: r.phone, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], notes: '', remark: '' }));
  await persistNow(); closeModal(); UI.stuClass = c.id; render(); toast(`✅ ${rows.length} ${L('murid berjaya diimport!', 'students imported!')}`);
};

/* Kelas */
A.addClass = () => { UI.draft = { name: '', subject: '', color: COLORS[S.classes.length % COLORS.length] }; openModal(classFormModal); };
A.editClass = el => { UI.draft = clone(cls(el.dataset.id)); openModal(classFormModal); };
A.saveClass = async () => {
  const d = UI.draft;
  if (!d.name.trim() || !d.subject.trim()) return toast(L('Sila isi Nama Kelas dan Subjek.', 'Please fill in Class Name and Subject.'), 'err');
  const old = d.id && cls(d.id);
  const rec = { id: d.id || uid(), name: d.name.trim(), subject: d.subject.trim(), color: d.color };
  if (old) Object.assign(old, rec); else S.classes.push(rec);
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Kelas disimpan', 'Class saved')}`);
};
A.delClass = async el => {
  const c = cls(el.dataset.id), n = studentsOf(c.id).length;
  const msg = n ? L(`Kelas ${esc(c.name)} mempunyai ${n} murid. Padam kelas ini bersama SEMUA murid, kehadiran, kerja rumah dan markahnya?`, `${esc(c.name)} has ${n} students. Delete the class with ALL its students and records?`) : L(`Padam kelas ${esc(c.name)}?`, `Delete ${esc(c.name)}?`);
  if (!await ask(msg, { danger: true, ok: L('Padam', 'Delete') })) return;
  const sids = new Set(studentsOf(c.id).map(s => s.id));
  S.classes = S.classes.filter(x => x.id !== c.id);
  S.students = S.students.filter(s => !sids.has(s.id));
  S.homework = S.homework.filter(h => h.classId !== c.id);
  S.exams = S.exams.filter(e => e.classId !== c.id);
  S.timetable = S.timetable.filter(t => t.classId !== c.id);
  S.awards = S.awards.filter(a => !sids.has(a.sid));
  Object.keys(S.attendance).forEach(k => { if (k.startsWith(c.id + '|')) delete S.attendance[k]; });
  await persistNow(); render(); toast(L('Kelas dipadam', 'Class deleted'), 'info');
};
A.classStudents = el => { UI.stuClass = el.dataset.id; UI.stuSearch = ''; location.hash = 'students'; };

/* Anugerah */
A.addAward = () => { const cid = UI.awClass !== 'all' ? UI.awClass : S.classes[0].id; UI.draft = { classId: cid, sid: '', type: AWARDS[0].k, pts: AWARDS[0].pts, date: todayISO(), note: '' }; openModal(awardFormModal, 'md'); };
A.pickAward = el => { const t = awardType(el.dataset.v); UI.draft.type = t.k; UI.draft.pts = t.pts; drawModal(); };
A.saveAward = async () => {
  const d = UI.draft;
  if (!d.sid) return toast(L('Sila pilih murid.', 'Please choose a student.'), 'err');
  S.awards.push({ id: uid(), sid: d.sid, type: d.type, pts: Number(d.pts) || 0, date: d.date || todayISO(), note: d.note.trim() });
  await persistNow(); closeModal(); render(); toast(`🏆 ${L('Anugerah diberikan kepada', 'Award given to')} ${esc(stu(d.sid).name)}!`);
};
A.delAward = async el => {
  if (!await ask(L('Padam anugerah ini?', 'Delete this award?'), { danger: true, ok: L('Padam', 'Delete') })) return;
  S.awards = S.awards.filter(a => a.id !== el.dataset.id);
  await persistNow(); render();
};

/* Mesyuarat */
A.addMeeting = () => { UI.draft = { date: todayISO(), time: '08:00', end: '', title: '', category: 'mesyuarat', place: '', hours: '', notes: '', photos: [] }; openModal(meetingFormModal, 'md'); };
A.editMeeting = el => { const m = S.meetings.find(x => x.id === el.dataset.id); UI.draft = { ...clone(m), photos: m.photos.map(id => ({ id })) }; openModal(meetingFormModal, 'md'); };
A.viewMeeting = el => { UI.bellOpen = false; UI.meetId = el.dataset.id; openModal(meetingDetailModal, 'md'); render(); };
A.rmPhoto = el => { UI.draft.photos.splice(Number(el.dataset.i), 1); drawModal(); };
A.addPhotos = async el => {
  const files = [...el.files];
  if (!files.length) return;
  toast(`⏳ ${L(`Memproses ${files.length} gambar…`, `Processing ${files.length} photos…`)}`, 'info');
  let fail = 0;
  for (const f of files) {
    try { UI.draft.photos.push({ id: uid(), src: await compressImage(f), isNew: true }); } catch { fail++; }
  }
  if (fail) toast(L(`${fail} gambar tidak dapat dibaca. Guna format JPG / PNG.`, `${fail} photos could not be read. Use JPG / PNG.`), 'err');
  drawModal();
};
A.saveMeeting = async () => {
  const d = UI.draft;
  if (!d.date || !d.time || !d.title.trim()) return toast(L('Sila isi Tarikh, Masa dan Tajuk.', 'Please fill in Date, Time and Title.'), 'err');
  try {
    for (const p of d.photos.filter(p => p.isNew)) { await DB.put('photos', p.id, p.src); photoCache.set(p.id, p.src); }
    const old = d.id && S.meetings.find(m => m.id === d.id);
    const keep = d.photos.map(p => p.id);
    if (old) for (const pid of old.photos) if (!keep.includes(pid)) { await DB.del('photos', pid); photoCache.delete(pid); }
    const rec = { id: d.id || uid(), date: d.date, time: d.time, end: d.end, title: d.title.trim(), category: d.category, place: d.place.trim(), hours: d.hours, notes: d.notes, photos: keep };
    if (old) Object.assign(old, rec); else S.meetings.push(rec);
    if (!(await persistNow())) return;
    closeModal();
    if (daysUntil(rec.date) < 0 && UI.meetFilter === 'upcoming') UI.meetFilter = 'all';
    render(); toast(`✅ ${L('Rekod mesyuarat disimpan', 'Meeting record saved')}`);
  } catch {
    toast(L('Gagal menyimpan gambar — ruang storan mungkin penuh.', 'Failed to save photos — storage may be full.'), 'err');
  }
};
A.delMeeting = async el => {
  const m = S.meetings.find(x => x.id === el.dataset.id);
  if (!await ask(L(`Padam rekod "${esc(m.title)}" beserta ${m.photos.length} gambar?`, `Delete "${esc(m.title)}" and its ${m.photos.length} photos?`), { danger: true, ok: L('Padam', 'Delete') })) return;
  for (const p of m.photos) { await DB.del('photos', p); photoCache.delete(p); }
  S.meetings = S.meetings.filter(x => x.id !== m.id);
  await persistNow(); closeModal(); render(); toast(L('Rekod dipadam', 'Record deleted'), 'info');
};
A.lightbox = el => { const m = S.meetings.find(x => x.id === el.dataset.mid); UI.lb = { ids: m.photos, i: Number(el.dataset.i) }; drawLightbox(); };
A.lbNav = el => { const n = UI.lb.ids.length; UI.lb.i = (UI.lb.i + Number(el.dataset.d) + n) % n; drawLightbox(); };
A.lbClose = (el, e) => { if (el.dataset.self && e.target !== el) return; UI.lb = null; $('#lightbox-root').innerHTML = ''; };

/* Laporan */
A.togglePhotos = el => { UI.rPhotos = el.checked; render(); };
A.printReport = () => window.print();
A.exportCSV = () => { const r = REPORTS[UI.rTab](); if (!r.csv.length) return toast(L('Tiada data untuk dieksport.', 'Nothing to export.'), 'err'); downloadCSV(r.file, r.csv); toast(`⬇️ ${L('Fail CSV dimuat turun — boleh buka dengan Excel', 'CSV downloaded — open it in Excel')}`); };

/* Tetapan & data */
A.settings = async () => {
  UI.bellOpen = false;
  UI.draft = clone(S.settings);
  openModal(settingsModal, 'md');
  render();
  try {
    const est = await navigator.storage?.estimate?.();
    const el = $('#storage-info');
    if (est && el) el.innerHTML = `${L('Ruang digunakan', 'Storage used')}: <b>${(est.usage / 1048576).toFixed(1)} MB</b>`;
  } catch { /* tidak disokong */ }
};
A.saveSettings = async () => {
  const d = UI.draft;
  ['teacherName', 'nickname', 'schoolName', 'schoolShort', 'motto', 'address', 'schoolCode'].forEach(k => { S.settings[k] = String(d[k] ?? '').trim(); });
  if (!S.settings.nickname) S.settings.nickname = S.settings.teacherName.split(' ')[0];
  await persistNow(); closeModal(); render(); toast(`✅ ${L('Tetapan disimpan', 'Settings saved')}`);
};
A.backup = async () => {
  try {
    const photos = {};
    for (const k of await DB.keys('photos')) photos[k] = await DB.get('photos', k);
    S.settings.lastBackup = new Date().toISOString();
    const data = { app: APP_ID, version: 1, exportedAt: S.settings.lastBackup, state: S, photos };
    download(`salinan-ecikgu-${safeName(S.settings.schoolShort)}-${todayISO()}.json`, new Blob([JSON.stringify(data)], { type: 'application/json' }));
    await persistNow();
    render(); drawModal();
    toast(`💾 ${L('Fail salinan dimuat turun. Simpan dalam Google Drive / pendrive.', 'Backup downloaded. Keep it in Google Drive / USB.')}`);
  } catch {
    toast(L('Gagal membuat salinan.', 'Backup failed.'), 'err');
  }
};
A.restore = () => { const f = $('#restore-file'); f.value = ''; f.click(); };
async function restoreFrom(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast(L('Fail tidak sah.', 'Invalid file.'), 'err'); }
  if (!data || data.app !== APP_ID || !data.state) return toast(L('Ini bukan fail salinan e-Cikgu.', 'This is not an e-Cikgu backup file.'), 'err');
  const when = data.exportedAt ? fmtDate(data.exportedAt.slice(0, 10)) : '?';
  if (!await ask(L(`Pulihkan data dari salinan bertarikh ${when}? Data semasa akan DIGANTIKAN.`, `Restore data from the backup dated ${when}? Current data will be REPLACED.`), { danger: true, ok: L('Pulihkan', 'Restore') })) return;
  await DB.clear('photos');
  photoCache.clear();
  for (const [k, v] of Object.entries(data.photos || {})) await DB.put('photos', k, v);
  S = normalize(data.state);
  UI.attDraft = null;
  await persistNow(); closeModal(); render();
  toast(`✅ ${L('Data berjaya dipulihkan!', 'Data restored!')}`);
}
A.loadSample = async () => {
  if (!await ask(L('Gantikan semua data semasa dengan data contoh?', 'Replace all current data with sample data?'), { danger: true, ok: L('Ya, gantikan', 'Yes, replace') })) return;
  const keep = { ...S.settings };
  await DB.clear('photos'); photoCache.clear();
  S = await seedState();
  Object.assign(S.settings, keep);
  UI.attDraft = null;
  await persistNow(); closeModal(); render(); toast(L('Data contoh dimuatkan', 'Sample data loaded'), 'info');
};
A.eraseAll = async () => {
  if (!await ask(L('Padam SEMUA kelas, murid, kehadiran, kerja rumah, markah dan rekod mesyuarat? Tindakan ini tidak boleh dibatalkan. Pastikan anda sudah buat salinan.', 'Erase ALL data? This cannot be undone. Make sure you have a backup.'), { danger: true, ok: L('Padam Semua', 'Erase All') })) return;
  const keep = { ...S.settings };
  await DB.clear('photos'); photoCache.clear();
  S = emptyState();
  Object.assign(S.settings, keep);
  UI.attDraft = null;
  await persistNow(); closeModal(); render(); toast(L('Semua data dikosongkan', 'All data erased'), 'info');
};

/* Input tanpa lukis semula */
const INP = {
  hwNote: el => { hwRec(el.dataset.sid).note = el.value; },
  markInp: el => {
    const e = S.exams.find(x => x.id === UI.examDraft.id);
    const v = el.value === '' ? '' : Number(el.value);
    UI.examDraft.marks[el.dataset.sid] = v;
    const g = grade(v, e.max), span = $(`#g-${el.dataset.sid}`);
    if (span) { span.className = `grade g-${g || ''}`; span.textContent = g || '—'; }
    el.style.borderColor = v !== '' && (v < 0 || v > e.max) ? 'var(--red)' : '';
  },
  importText: el => { UI.draft.text = el.value; $('#imp-preview').innerHTML = importPreview(parseImport(el.value)); },
  remark: el => { const s = stu(el.dataset.sid); s.remark = el.value; persist(); const box = $('.rs-remark'); if (box) box.textContent = el.value; },
};
const FILE = {
  addPhotos: A.addPhotos,
  importFile: async el => {
    const f = el.files[0];
    if (!f) return;
    try {
      let text;
      if (/\.xlsx?$/i.test(f.name)) {
        if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
        text = rows.filter(r => r.some(c => String(c ?? '').trim())).map(r => r.map(c => String(c ?? '').trim()).join('\t')).join('\n');
      } else {
        text = await f.text();
      }
      UI.draft.text = text;
      drawModal();
    } catch {
      toast(L('Tidak dapat membaca fail. Perlu internet untuk .xlsx — atau simpan sebagai CSV, atau copy-paste terus.', 'Could not read the file. .xlsx needs internet — or save as CSV, or copy-paste.'), 'err');
    }
  },
};

/* =========================================================
   Event handling
   ========================================================= */
document.addEventListener('click', e => {
  if (UI.bellOpen && !e.target.closest('.bell-wrap')) { UI.bellOpen = false; if (!e.target.closest('[data-act]')) { render(); return; } }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bind && UI.draft) {
    UI.draft[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.value;
    if (UI.modal?.fn === reliefFormModal) updateReliefLive();
    return;
  }
  if (el.dataset.inp && INP[el.dataset.inp]) { INP[el.dataset.inp](el); return; }
  if (el.dataset.ui && (el.type === 'text' || el.type === 'search' || !el.type)) { UI[el.dataset.ui] = el.value; render(); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'restore-file' && el.files[0]) return restoreFrom(el.files[0]);
  if (el.dataset.file && FILE[el.dataset.file]) return FILE[el.dataset.file](el);
  if (el.dataset.bind && UI.draft) {
    UI.draft[el.dataset.bind] = el.value;
    if (el.dataset.bind === 'classId' && UI.modal?.fn === slotFormModal) { UI.draft.subject = cls(el.value)?.subject || ''; drawModal(); }
    if (el.dataset.redraw) drawModal();
    return;
  }
  if (el.dataset.ui && el.type !== 'text' && el.type !== 'search') {
    const k = el.dataset.ui;
    if ((k === 'attClass' || k === 'attDate') && UI.attDraft?.dirty) {
      if (!await ask(L('Ada perubahan kehadiran yang belum disimpan. Teruskan tanpa simpan?', 'You have unsaved attendance changes. Continue without saving?'), { danger: true })) { el.value = UI[k]; return; }
      UI.attDraft = null;
    }
    if (!el.value && (k === 'attDate' || k === 'attMonth')) { el.value = UI[k]; return; }
    UI[k] = el.value;
    render();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (UI.lb) { UI.lb = null; $('#lightbox-root').innerHTML = ''; }
    else if ($('#confirm-root').innerHTML) { $('#confirm-root').innerHTML = ''; UI.askRes?.(false); }
    else if (UI.modal) closeModal();
    else if (UI.bellOpen) { UI.bellOpen = false; render(); }
  }
  if (UI.lb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const n = UI.lb.ids.length; UI.lb.i = (UI.lb.i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; drawLightbox(); }
});
window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (VIEWS[v] && v !== UI.view) { UI.view = v; UI.bellOpen = false; closeModal(); render(); scrollTo(0, 0); }
});
window.addEventListener('beforeunload', e => {
  if (saveTimer) DB.put('state', 'main', S);
  if (UI.attDraft?.dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* =========================================================
   Mula
   ========================================================= */
(async function init() {
  await DB.open();
  try { S = await DB.get('state', 'main'); } catch { S = null; }
  if (!S) { S = await seedState(); await persistNow(); }
  else S = normalize(S);
  navigator.storage?.persist?.().catch(() => {});
  const v = location.hash.slice(1);
  if (VIEWS[v]) UI.view = v;
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
