let counter = 0;

export function nextId() {
  counter += 1;
  return `n${counter}`;
}