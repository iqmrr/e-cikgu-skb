/* =========================================================
   Storan data (IndexedDB) — semua rekod disimpan dalam peranti
   'state'  : satu objek besar untuk semua data teks
   'photos' : gambar bukti mesyuarat (dataURL), ikut id
   Fallback ke localStorage jika IndexedDB tidak tersedia.
   ========================================================= */
const DB = (() => {
  const NAME = 'ecikgu-skb';
  const VERSION = 1;
  let db = null;
  let fallback = false;

  function open() {
    return new Promise(resolve => {
      if (!('indexedDB' in window)) { fallback = true; return resolve(); }
      let req;
      try { req = indexedDB.open(NAME, VERSION); } catch { fallback = true; return resolve(); }
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('state')) d.createObjectStore('state');
        if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos');
      };
      req.onsuccess = () => { db = req.result; resolve(); };
      req.onerror = () => { fallback = true; resolve(); };
    });
  }

  function tx(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const lsKey = (s, k) => `${NAME}:${s}:${k}`;
  const lsPrefix = s => `${NAME}:${s}:`;

  return {
    open,
    get isFallback() { return fallback; },

    async get(store, key) {
      if (fallback) return JSON.parse(localStorage.getItem(lsKey(store, key)) || 'null');
      return (await tx(store, 'readonly', s => s.get(key))) ?? null;
    },
    async put(store, key, val) {
      if (fallback) { localStorage.setItem(lsKey(store, key), JSON.stringify(val)); return; }
      await tx(store, 'readwrite', s => s.put(val, key));
    },
    async del(store, key) {
      if (fallback) { localStorage.removeItem(lsKey(store, key)); return; }
      await tx(store, 'readwrite', s => s.delete(key));
    },
    async keys(store) {
      if (fallback) return Object.keys(localStorage).filter(k => k.startsWith(lsPrefix(store))).map(k => k.slice(lsPrefix(store).length));
      return tx(store, 'readonly', s => s.getAllKeys());
    },
    async clear(store) {
      if (fallback) { (await this.keys(store)).forEach(k => localStorage.removeItem(lsKey(store, k))); return; }
      await tx(store, 'readwrite', s => s.clear());
    },
  };
})();
