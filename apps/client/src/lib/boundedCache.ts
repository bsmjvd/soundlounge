/** Map.set that evicts the oldest (least recently set) entry once the map exceeds `max`. */
export function setBounded<K, V>(map: Map<K, V>, key: K, value: V, max: number): void {
  map.delete(key);
  map.set(key, value);
  if (map.size > max) map.delete(map.keys().next().value as K);
}

/** Map.get that refreshes the entry's recency, making setBounded evict in LRU order. */
export function getBounded<K, V>(map: Map<K, V>, key: K): V | undefined {
  const value = map.get(key);
  if (value !== undefined) {
    map.delete(key);
    map.set(key, value);
  }
  return value;
}
