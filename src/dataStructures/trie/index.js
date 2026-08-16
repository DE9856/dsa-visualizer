import { insert } from "./insert";
import { del } from "./delete";
import { search } from "./search";
import { autocomplete } from "./autocomplete";
import { listWords } from "./listWords";
import { size } from "./size";
import { clearTrie } from "./clear";
import { MAX_WORDS, MAX_WORD_LENGTH } from "./helpers";

// The trie ADT: build (insert/delete), the two lookups that make the structure
// worth its memory (exact word, and prefix), an ordered enumeration, and the
// size read-out that shows what prefix sharing actually saves.
export const TRIE_OPERATIONS = [insert, del, search, autocomplete, listWords, size, clearTrie];

export const TRIE_OP_MAP = Object.fromEntries(TRIE_OPERATIONS.map((op) => [op.key, op]));

export const TRIE_GROUPS = [
  { key: "core", label: "Core (Insert / Delete)" },
  { key: "search", label: "Search" },
  { key: "traverse", label: "Traversal" },
  { key: "status", label: "Status" },
  { key: "utility", label: "Utility" },
];

export { MAX_WORDS, MAX_WORD_LENGTH };
