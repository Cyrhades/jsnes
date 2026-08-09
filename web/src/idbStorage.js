/**
 * Zero-dependency IndexedDB Storage Wrapper for large NES ROM binary blobs,
 * save states, and thumbnails.
 *
 * Provides asynchronous storage with high capacity (gigabytes quota),
 * and automatic transparent fallback/migration from localStorage.
 */
const DB_NAME = "jsnes_storage_db";
const DB_VERSION = 1;
const STORE_NAME = "keyvalue";

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.warn(
        "IndexedDB failed to open, falling back to localStorage",
        event.target.error,
      );
      resolve(null);
    };
  });

  return dbPromise;
}

/**
 * Retrieve a value asynchronously by key from IndexedDB with localStorage fallback.
 * Automatically migrates existing localStorage entries to IndexedDB.
 */
export async function idbGet(key) {
  try {
    const db = await getDB();
    if (!db) {
      return localStorage.getItem(key);
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result);
        } else {
          // Fallback to localStorage
          let localVal = null;
          try {
            localVal = localStorage.getItem(key);
          } catch (e) {}

          if (localVal !== null) {
            // Asynchronously migrate item to IndexedDB and remove from localStorage to free space
            idbSet(key, localVal)
              .then(() => {
                try {
                  localStorage.removeItem(key);
                } catch (e) {}
              })
              .catch(() => {});
          }
          resolve(localVal);
        }
      };

      req.onerror = () => {
        try {
          resolve(localStorage.getItem(key));
        } catch (e) {
          resolve(null);
        }
      };
    });
  } catch (err) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
}

/**
 * Store a key/value pair in IndexedDB.
 * Safely handles QuotaExceededError and updates localStorage if capacity allows.
 */
export async function idbSet(key, value) {
  let savedInIdb = false;
  try {
    const db = await getDB();
    if (db) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
      });
      savedInIdb = true;
    }
  } catch (err) {
    console.warn("IndexedDB write failed:", err);
  }

  // Attempt sync write to localStorage for smaller objects or fallback.
  // Catch and ignore QuotaExceededError if it's already safely stored in IndexedDB.
  try {
    const strVal = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, strVal);
  } catch (quotaErr) {
    if (!savedInIdb) {
      console.error(
        "Storage quota exceeded and IndexedDB unavailable:",
        quotaErr,
      );
      throw quotaErr;
    }
  }
}

/**
 * Delete a key from both IndexedDB and localStorage.
 */
export async function idbRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}

  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
    }
  } catch (e) {}
}
