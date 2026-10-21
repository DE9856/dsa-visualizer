/**
 * A small seeded PRNG (mulberry32).
 *
 * Randomness in a comparison has to be reproducible or the comparison isn't
 * one: a race that re-rolls its input on every re-render, or a random-pivot
 * quicksort that picks differently each time you scrub, can't be argued
 * about. Everything random in the race and complexity views draws from a seed
 * that travels in the shared link.
 */
export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh seed for "roll again" buttons. */
export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
