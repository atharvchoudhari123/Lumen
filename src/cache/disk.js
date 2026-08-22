/*
 * Disk cache placeholder.
 *
 * Disk I/O will stay outside the hot path.
 */

export class DiskCache {

  async get() {
    return null;
  }

  async set() {}

  async delete() {}

  async clear() {}
}
