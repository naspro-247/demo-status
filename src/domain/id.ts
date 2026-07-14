/**
 * Lightweight unique-id generation.
 *
 * Avoids pulling in a uuid dependency; ids are prefixed to make them
 * self-describing in logs and debugging.
 */

let counter = 0;

export function createId(prefix = 'id'): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${random}`;
}

/** Reset the internal counter. Intended for use in tests only. */
export function resetIdCounter(): void {
  counter = 0;
}
