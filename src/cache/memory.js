export class MemoryCache {

  constructor({
    maxEntries = 500
  } = {}) {

    this.maxEntries =
      maxEntries;

    this.store =
      new Map();
  }


  get(key) {

    const item =
      this.store.get(key);

    if (!item) {
      return null;
    }

    if (
      item.expiresAt <=
      Date.now()
    ) {

      this.store.delete(key);

      return null;
    }

    // LRU refresh
    this.store.delete(key);
    this.store.set(key, item);

    return item.value;
  }


  set(
    key,
    value,
    ttlMs = 30000
  ) {

    if (
      this.store.size >=
      this.maxEntries &&
      !this.store.has(key)
    ) {

      const oldest =
        this.store.keys()
          .next()
          .value;

      this.store.delete(oldest);
    }

    this.store.delete(key);

    this.store.set(key, {
      value,
      expiresAt:
        Date.now() + ttlMs
    });
  }


  clear() {
    this.store.clear();
  }


  get size() {
    return this.store.size;
  }
}
