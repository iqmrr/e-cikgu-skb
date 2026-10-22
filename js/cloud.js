/* =========================================================
   Sync cloud (Firebase) — login Google + segerak data antara peranti
   Data disimpan di: users/{uid}/sections/{nama}  dan  users/{uid}/photos/{id}
   Sistem tetap berfungsi tanpa fail ini (contohnya bila offline).
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocsFromServer, setDoc, deleteDoc, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Config ini bukan rahsia — data dilindungi oleh Firestore Security Rules
const firebaseConfig = {
  apiKey: 'AIzaSyBpSq90-5e9LtjHYrHYQK_4JraO57ZZ9vk',
  authDomain: 'e-cikgu-skb.firebaseapp.com',
  projectId: 'e-cikgu-skb',
  storageBucket: 'e-cikgu-skb.firebasestorage.app',
  messagingSenderId: '465629331841',
  appId: '1:465629331841:web:baaf410372ff22cfd7e880',
};

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
let db;
try { db = initializeFirestore(fb, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch { db = initializeFirestore(fb, {}); }

const LOCAL_ONLY = ['lang', 'lastBackup']; // tetapan khusus setiap peranti
const LIST_SECTIONS = ['classes', 'students', 'homework', 'exams', 'timetable', 'awards', 'meetings', 'reliefs'];
const QUEUE_KEY = 'ecikgu-photo-queue';
const MAX_DOC = 1000000; // had saiz dokumen Firestore (~1 MB)

let user = null, unsub = null, status = 'off', base = {}, linking = false, pushTimer = null;
const L = (ms, en) => window.App.L(ms, en);

/* ---------- Pembantu ---------- */
function hash(str) { // cyrb53 — cukup untuk kesan perubahan
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// Pecahkan data kepada bahagian kecil (kehadiran dipecah ikut bulan)
function split(S) {
  const out = {};
  const st = { ...S.settings };
  LOCAL_ONLY.forEach(k => delete st[k]);
  out.settings = st;
  LIST_SECTIONS.forEach(k => { out[k] = S[k] || []; });
  for (const [k, rec] of Object.entries(S.attendance || {})) {
    const m = 'att-' + k.split('|')[1].slice(0, 7);
    (out[m] ||= {})[k] = rec;
  }
  return out;
}
function apply(S, name, value) {
  if (name === 'settings') {
    const keep = {};
    LOCAL_ONLY.forEach(k => { keep[k] = S.settings[k]; });
    S.settings = { ...S.settings, ...value, ...keep };
  } else if (name.startsWith('att-')) {
    const ym = name.slice(4);
    Object.keys(S.attendance).forEach(k => { if (k.split('|')[1].startsWith(ym)) delete S.attendance[k]; });
    Object.assign(S.attendance, value || {});
  } else if (LIST_SECTIONS.includes(name)) {
    S[name] = value;
  }
}

const baseKey = () => `ecikgu-sync-base-${user.uid}`;
const loadBase = () => { try { return JSON.parse(localStorage.getItem(baseKey()) || 'null'); } catch { return null; } };
const saveBase = () => { try { localStorage.setItem(baseKey(), JSON.stringify(base)); } catch { /* storan penuh */ } };
const sectionRef = name => doc(db, 'users', user.uid, 'sections', name);
const photoRef = id => doc(db, 'users', user.uid, 'photos', id);

function setStatus(s) { status = s; window.App.cloudStatus(); }

/* ---------- Hantar perubahan ke cloud ---------- */
function push() {
  if (!user || linking) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(doPush, 400);
}
async function doPush() {
  if (!user) return;
  const parts = split(window.App.state());
  const writes = [];
  for (const [name, val] of Object.entries(parts)) {
    const json = JSON.stringify(val), h = hash(json);
    if (base[name] === h) continue;
    base[name] = h;
    writes.push(setDoc(sectionRef(name), { json, updatedAt: Date.now() }).catch(e => { delete base[name]; saveBase(); throw e; }));
  }
  for (const name of Object.keys(base)) {
    if (!(name in parts)) { delete base[name]; writes.push(deleteDoc(sectionRef(name))); }
  }
  if (!writes.length) return;
  saveBase();
  setStatus(navigator.onLine ? 'syncing' : 'offline');
  try { await Promise.all(writes); setStatus('synced'); }
  catch (e) { console.error('[cloud] push', e); setStatus('error'); }
}

/* ---------- Terima perubahan dari peranti lain ---------- */
function listen() {
  unsub?.();
  unsub = onSnapshot(collection(db, 'users', user.uid, 'sections'), snap => {
    const S = window.App.state();
    const local = split(S);
    let changed = false;
    for (const ch of snap.docChanges()) {
      if (ch.doc.metadata.hasPendingWrites) continue; // tulisan sendiri
      const name = ch.doc.id;
      const lh = name in local ? hash(JSON.stringify(local[name])) : undefined;
      if (ch.type === 'removed') {
        if (name.startsWith('att-') && (lh === undefined || lh === base[name])) { apply(S, name, {}); delete base[name]; changed = true; }
        continue;
      }
      const { json } = ch.doc.data();
      const rh = hash(json);
      if (rh === base[name]) continue;               // cloud tak berubah
      if (lh === rh) { base[name] = rh; continue; }  // sudah sama
      if (lh === undefined || lh === base[name]) {   // hanya cloud berubah → ambil
        apply(S, name, JSON.parse(json));
        base[name] = rh;
        changed = true;
      }
      // jika kedua-dua berubah: perubahan dalam peranti ini menang dan akan dihantar
    }
    saveBase();
    if (changed) window.App.remoteApplied();
    if (!snap.metadata.fromCache) setStatus('synced');
    push();
  }, e => { console.error('[cloud] listen', e); setStatus('error'); });
}

/* ---------- Gambar ---------- */
async function putPhoto(id) {
  if (!user) return;
  const data = await window.App.getLocalPhoto(id);
  if (!data || data.length > MAX_DOC) return;
  await setDoc(photoRef(id), { data });
}
async function delPhoto(id) { if (user) await deleteDoc(photoRef(id)); }
async function getPhoto(id) {
  if (!user) return null;
  try {
    const d = await getDoc(photoRef(id));
    if (!d.exists()) return null;
    const data = d.data().data;
    await window.App.putLocalPhoto(id, data);
    return data;
  } catch { return null; }
}
async function flushQueue() {
  let q;
  try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { q = []; }
  if (!q.length) return;
  localStorage.removeItem(QUEUE_KEY);
  for (const { op, id } of q) {
    try { if (op === 'put') await putPhoto(id); else await delPhoto(id); } catch { /* cuba lagi tidak perlu */ }
  }
}

/* ---------- Login kali pertama dalam peranti ini ---------- */
async function firstLink() {
  linking = true;
  setStatus('syncing');
  try {
    const snap = await getDocsFromServer(collection(db, 'users', user.uid, 'sections'));
    if (snap.empty) {
      const up = await window.App.ask(
        L('Akaun ini belum ada data dalam cloud. Naikkan semua data dalam peranti ini (termasuk gambar) ke cloud?', 'This account has no cloud data yet. Upload all data on this device (including photos)?'),
        { ok: L('Ya, naikkan', 'Yes, upload'), cancel: L('Batal', 'Cancel') });
      if (!up) { linking = false; await signOut(auth); return; }
      base = {};
      linking = false;
      await doPush();
      const ids = await window.App.photoIds();
      if (ids.length) window.App.toast(`⏳ ${L(`Menaikkan ${ids.length} gambar…`, `Uploading ${ids.length} photos…`)}`, 'info');
      for (const id of ids) { try { await putPhoto(id); } catch { /* teruskan */ } }
      localStorage.removeItem(QUEUE_KEY);
      window.App.toast(`☁️ ${L('Data berjaya dinaikkan ke cloud!', 'Data uploaded to the cloud!')}`);
    } else {
      const ok = await window.App.ask(
        L('Akaun ini sudah ada data dalam cloud. Data dalam peranti ini akan DIGANTIKAN dengan data cloud. Teruskan?', 'This account already has cloud data. Data on this device will be REPLACED with cloud data. Continue?'),
        { ok: L('Guna data cloud', 'Use cloud data'), cancel: L('Batal', 'Cancel'), danger: true });
      if (!ok) { linking = false; await signOut(auth); return; }
      const S = window.App.blankState();
      base = {};
      snap.forEach(d => { const { json } = d.data(); apply(S, d.id, JSON.parse(json)); base[d.id] = hash(json); });
      await window.App.replaceState(S);
      localStorage.removeItem(QUEUE_KEY);
      window.App.toast(`☁️ ${L('Data dari cloud dimuatkan!', 'Cloud data loaded!')}`);
    }
    linking = false;
    saveBase();
    listen();
  } catch (e) {
    console.error('[cloud] link', e);
    linking = false;
    setStatus('error');
    window.App.toast(L('Gagal sambung ke cloud. Pastikan ada internet dan cuba login semula.', 'Could not reach the cloud. Check your internet and sign in again.'), 'err');
    await signOut(auth);
  }
}

/* ---------- Login / log keluar ---------- */
async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-environment') return signInWithRedirect(auth, provider);
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') window.App.toast(`${L('Login gagal', 'Sign-in failed')}: ${e.code}`, 'err');
  }
}
async function signOutUser() {
  unsub?.(); unsub = null;
  await signOut(auth);
}

window.addEventListener('online', () => { if (user) { setStatus('syncing'); push(); flushQueue(); } });
window.addEventListener('offline', () => { if (user) setStatus('offline'); });

window.Cloud = {
  get user() { return user; },
  get status() { return status; },
  signIn, signOut: signOutUser, push, putPhoto, delPhoto, getPhoto,
};

await window.AppReady;
onAuthStateChanged(auth, async u => {
  unsub?.(); unsub = null;
  user = u;
  if (!u) { setStatus('off'); return; }
  base = loadBase();
  if (!base) { base = {}; await firstLink(); return; }
  setStatus(navigator.onLine ? 'syncing' : 'offline');
  listen();
  flushQueue();
});
window.App.cloudReady();
