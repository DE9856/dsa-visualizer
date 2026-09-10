// Detailed, page-level explanations for each data structure "thing" — shown once per
// page (as opposed to the short per-operation blurbs in ListInfoPanel, which describe
// what an individual button/operation does).

export const TOPIC_OVERVIEWS = {
  btree: {
    overview:
      "A binary search tree is built for a machine where following a pointer is cheap. Real storage is not that machine: reading a disk block or pulling a cache line costs thousands of times what a comparison costs, and a BST pays that price at every level while extracting a single bit of information from it. A B-tree fixes the ratio by making nodes as wide as the block they live in — order m means up to m children and m−1 keys, so one read narrows the search m ways instead of two. The height falls from log₂ n to log_m n, which for the orders a database actually uses (hundreds) means three or four reads for millions of keys. Every leaf sits at the same depth, always, and that is not maintained by rotations. It falls out of the update rules: a node that overflows splits and pushes its median key *up*, and a node that underflows borrows from a sibling or merges with one, pulling a separator *down*. The tree grows only by splitting at the root and shrinks only by emptying it, so every leaf necessarily moves together.",
    howItWorks: [
      "A node holds a sorted run of keys and one more child than it has keys. The keys are separators: everything in the child before a key is smaller than it, everything in the child after is larger. Searching a node is a scan or a binary search within one block, then a single descent.",
      "Insert always lands in a leaf. If the leaf now holds more than m−1 keys it splits in half and its median key moves up into the parent as a new separator.",
      "The parent may overflow in turn, so the split can travel upward. If it reaches the root, the root splits and a new root is created above it — the only event that ever makes the tree taller.",
      "Delete is arranged so that it always ends up removing from a leaf. A key in an internal node is a separator and cannot simply vanish, so it is overwritten with its predecessor — which lives in a leaf — and that copy is deleted instead.",
      "A node left with fewer than ⌈m/2⌉−1 keys borrows from a sibling that has one to spare: the separator drops into the short node and the sibling's outermost key rises to replace it. If neither sibling can spare one, the two merge and the separator comes down between them.",
      "A merge costs the parent a key, so the repair can travel upward exactly as a split does. When the root loses its last key, its only child becomes the new root and the tree gets one level shorter.",
      "A B+ tree changes where the data lives: every key is stored in a leaf, internal nodes hold only routing separators, and the leaves are linked left to right. A splitting leaf therefore *copies* its median upward rather than moving it, since the key still has to be findable at the bottom.",
    ],
    useCases: [
      "Essentially every relational database index — InnoDB, PostgreSQL's default index, SQL Server — is a B+ tree, and the table itself is often stored in one.",
      "Filesystems: NTFS directories, HFS+, ext4's htree, btrfs (whose name is the point), and ReiserFS all index with B-trees.",
      "Key–value stores and embedded engines such as LMDB and BerkeleyDB, where a page of the tree is a page of the memory map.",
      "Anywhere the unit of access is a block rather than a word: the shape is a response to the storage hierarchy, not to the data.",
    ],
    advantages: [
      "Height is log_m n, so the number of block reads per lookup is tiny and grows almost imperceptibly with n.",
      "Perfect balance is free — there is no rotation rule to get right, because splitting and merging cannot produce an unbalanced tree.",
      "Node size can be tuned to the hardware: pick m so a node is exactly one page, and every read does the maximum possible work.",
      "Space is bounded from below as well as above: every node except the root is at least half full, so the tree cannot degenerate into a sparse chain of nearly-empty blocks.",
      "In a B+ tree a range scan finds its starting leaf once and then walks the leaf chain, never touching the interior again — which is why `WHERE x BETWEEN a AND b` is fast.",
    ],
    disadvantages: [
      "In memory, where a pointer chase is cheap, the wide nodes buy nothing and the extra intra-node scanning makes a B-tree slower than a red-black tree or a plain BST.",
      "Delete is genuinely intricate — predecessor replacement, two borrow cases and a merge case, each of which can cascade — and is where most hand-written implementations get it wrong.",
      "Nodes sit half empty in the worst case, so a tree built by ascending inserts wastes close to half its space until it is rebuilt.",
      "Splits and merges rewrite whole blocks, which is expensive on write-amplified media — the reason log-structured merge trees displaced B-trees in write-heavy stores.",
      "A B+ tree pays for its leaf chain: separators are duplicated in the leaves and every search runs the full height, even one that finds its key in the root.",
    ],
  },
  huffman: {
    overview:
      "A fixed-width code spends the same number of bits on every symbol, which is only the right choice when every symbol is equally likely. Huffman coding spends fewer bits on the common symbols and more on the rare ones, and — remarkably — finds the *optimal* such assignment with a greedy rule that takes one line to state: repeatedly merge the two lightest trees. The argument for why that is optimal runs backwards. In any optimal code the two rarest symbols must sit deepest, and siblings, because if they were not you could swap them with something deeper and rarer and shorten the total. So merging them first costs nothing you could have avoided, and once merged they behave exactly like a single symbol of their combined weight — which reduces the problem to the same problem with one fewer symbol.",
    howItWorks: [
      "Count how often each symbol occurs. Nothing else about the text matters — two texts with the same frequencies get the same tree.",
      "Make a leaf per symbol and put them all in a priority queue ordered by weight. The queue is the forest, and every step shrinks it by one.",
      "Take the two lightest trees, merge them under a new parent whose weight is their sum, and put the parent back. Everything inside both trees just gained one bit, which is why it must be the two lightest.",
      "Repeat until one tree remains. Its shape is the code.",
      "Read the codes off the paths: left is 0, right is 1, and a leaf's code is the route taken to reach it. A symbol's code length is exactly its depth.",
      "The result is a prefix code for free: every symbol is a leaf, so no symbol's code can be a prefix of another's, and a decoder can read a bit stream with no separators — walk down from the root, emit a symbol when you hit a leaf, start again.",
    ],
    useCases: [
      "DEFLATE — the algorithm behind gzip, zip and PNG — which combines Huffman coding with LZ77 matching.",
      "JPEG and MP3, where Huffman coding compresses the quantised coefficients after the lossy step has already done its work.",
      "Any place a known, skewed symbol distribution needs packing: telemetry codes, opcode encodings, protocol field tags.",
    ],
    advantages: [
      "Provably optimal among codes that assign a whole number of bits per symbol — no other such code does better on the same frequencies.",
      "Decoding is a walk down a tree, which is fast and needs no lookahead.",
      "Prefix-freeness comes from the structure rather than from careful design, so there is no way to accidentally produce an ambiguous code.",
    ],
    disadvantages: [
      "'A whole number of bits per symbol' is the ceiling. A symbol with probability 0.9 deserves about 0.15 bits and Huffman must spend 1, so on very skewed alphabets arithmetic coding and ANS beat it outright.",
      "The tree has to reach the decoder — either shipped with the data or rebuilt from an agreed model — which is pure overhead on short inputs.",
      "It assumes the frequencies are known up front and stable. Adaptive Huffman exists but complicates both ends considerably.",
      "It codes symbols independently, so it captures nothing about *sequences* — which is exactly why real compressors put an LZ stage in front of it.",
    ],
  },
  rangequery: {
    overview:
      "Given an array that keeps changing, answer questions about ranges of it quickly. A plain array answers 'what is the sum of positions 3 to 9?' in O(n) and updates in O(1); an array of prefix sums swaps that round — O(1) to query, O(n) to repair after a single write. Neither is good enough when both happen often. Segment trees and Fenwick trees both get O(log n) for each, and they do it the same way: store partial answers over *ranges* rather than over positions, so any range can be assembled from a handful of them and any single change only invalidates a handful. The two differ in how they find those ranges. A segment tree is an explicit binary tree you descend; a Fenwick tree has no tree at all, only an array whose indices stand for ranges that happen to nest the way binary counting does — so it navigates by adding and subtracting the lowest set bit.",
    howItWorks: [
      "A segment tree's root covers the whole array, and every node splits its range in half until the leaves are single cells. Building is depth-first and finished post-order: a node cannot be combined until both children exist.",
      "A range query descends from the root and stops at every node lying entirely inside the requested range. Those nodes tile the range exactly, and there are never more than about 2 log n of them — so a query of a thousand cells reads a couple of dozen stored values.",
      "A point update changes one leaf, and only the nodes on the path from that leaf to the root contain it. Recombining that path is the whole update.",
      "A Fenwick tree stores, at index i, the combined value of the range (i − lowbit(i), i], where lowbit is the lowest set bit. Ranges of the same width can never overlap, which is why the picture lays out in rows.",
      "A prefix query walks backwards from i, adding bit[i] and then stripping the lowest set bit — each jump lands on the range ending just before the one it left, so the ranges tile the prefix with no gaps or overlaps.",
      "A point update walks forwards from i by *adding* the lowest set bit, which visits exactly the indices whose range contains i.",
      "A Fenwick range is prefix(r) − prefix(l−1). That subtraction is also the structure's limit: it needs an operation with an inverse, so a Fenwick tree can do sums and cannot do minima.",
    ],
    useCases: [
      "Competitive programming, where 'array with updates and range queries' is close to a genre of its own.",
      "Order statistics and inversion counting — a Fenwick tree over value-frequencies answers 'how many seen so far are smaller than this?' in O(log n).",
      "Databases and analytics engines maintaining running aggregates over a changing column.",
      "Any sliding-window statistic where the window's contents change one element at a time.",
    ],
    advantages: [
      "Both queries and updates are O(log n), rather than one of them being fast and the other linear.",
      "A segment tree works for any associative combine — sum, min, max, gcd, matrix product — because it never relies on undoing anything.",
      "A Fenwick tree is remarkably small: n integers, no pointers, no recursion, and an implementation that fits in four lines per operation. It is also very cache-friendly for the same reason.",
      "Segment trees extend to lazy propagation, which makes *range* updates O(log n) too — the point at which they leave Fenwick trees behind entirely.",
    ],
    disadvantages: [
      "Both are redundant storage: a segment tree needs roughly 2n nodes, and both must be kept in step with the array by hand.",
      "A Fenwick tree only supports invertible operations. Range minimum needs a segment tree, or a sparse table if the array never changes.",
      "For a static array, prefix sums beat both — O(1) queries and no structure to maintain. These are worth building only when updates actually happen.",
      "The Fenwick index arithmetic is famously easy to write and hard to read: nothing in `i += i & -i` says 'walk to the enclosing range'.",
    ],
  },
  greedy: {
    overview:
      "A greedy algorithm makes the choice that looks best right now and never reconsiders it. That is the easy part; the hard part is that it is almost always wrong. What separates the two problems here from the dozens where greed fails is that each comes with a proof. Activity selection has an exchange argument: any optimal schedule can be rewritten, one swap at a time, into the one greed produces, without ever losing an activity. Fractional knapsack has an interchange argument: if a lower-ratio item occupied space while a higher-ratio one was left outside, swapping equal weights of the two would raise the total, so no optimal packing looks like that. Take away the assumption those proofs rest on and the algorithm breaks immediately — 0/1 knapsack is fractional knapsack minus divisibility, and greed is simply wrong on it, which is why it needs dynamic programming instead. The three number-theory algorithms are not greedy at all; they are the arithmetic that everything else quietly stands on.",
    howItWorks: [
      "Activity selection sorts by finishing time and takes anything that starts at or after the last one ended. Finishing earliest leaves the most room for whatever comes next, and the exchange argument turns that intuition into a proof.",
      "The tempting alternatives are both wrong: taking the shortest activity fails on one short activity that straddles two long ones, and taking the earliest to start fails on a single activity that spans the entire day.",
      "Fractional knapsack sorts by value per unit weight and pours items in best-first, cutting the one that straddles the capacity. Exactly one item is ever cut, and that cut is what makes the answer exactly optimal rather than approximately so.",
      "The sieve of Eratosthenes crosses out multiples of each surviving number. Crossing can start at p² because any smaller multiple of p has a factor below p and was struck out already, and the outer loop can stop at √n because a composite must have a factor no larger than its own square root.",
      "Fast exponentiation reads the exponent in binary: b¹³ = b⁸·b⁴·b¹ because 13 is 1101. Squaring the base walks up the powers of two, and each bit decides whether that square joins the answer — log₂n steps instead of n.",
      "Euclid's algorithm replaces (a, b) with (b, a mod b) because any common divisor of a and b also divides their remainder. The remainder strictly shrinks, so the descent must end, and the last non-zero value is the answer.",
      "The quotient at each Euclid step is exactly how many subtractions the modulo did in one go — the original algorithm subtracted repeatedly, and that shortcut is the difference between O(a) and O(log min(a, b)).",
    ],
    useCases: [
      "Scheduling: allocating rooms, machines, CPU intervals, or advertising slots, where activity selection is the base case and its weighted version needs dynamic programming.",
      "Resource allocation where the resource genuinely divides — bandwidth, fuel, budget, raw material — which is what makes the fractional rule legitimate.",
      "Cryptography: modular exponentiation is the core operation in RSA, Diffie–Hellman and elliptic-curve schemes, and Euclid's extended form computes the modular inverses those need.",
      "Primality and factoring work, where a sieve provides the small primes every later stage tests against, and hashing schemes that want a prime table size.",
      "Reducing fractions, computing least common multiples, and the modular arithmetic underneath random number generators and checksums.",
    ],
    advantages: [
      "Greedy algorithms are fast and use almost no memory — activity selection is a sort plus one linear scan, and needs no table of subproblems.",
      "They are short enough to get right, and short enough to prove: an exchange argument is a few lines, where a dynamic programming recurrence needs its own correctness case.",
      "The sieve finds every prime below n in about O(n log log n), far better than testing each number separately, and the numbers it produces are reused by everything downstream.",
      "Fast exponentiation turns an impossible computation into a trivial one — the difference between n and log₂n is what makes public-key cryptography practical rather than theoretical.",
      "Euclid needs no factorisation, no table and no recursion in its iterative form; it is a handful of instructions and it has been correct for two thousand years.",
    ],
    disadvantages: [
      "Greed is right far less often than it looks, and a greedy algorithm that is wrong is wrong silently — it returns a plausible answer, not an error. Every use needs its own proof.",
      "Fractional knapsack's rule fails outright on the 0/1 version, and the failure is not a small approximation: the ratio-best item may have to be excluded entirely.",
      "The sieve's memory is O(n) and it must know its limit in advance, so finding primes near a large number without sieving everything below it needs a segmented variant.",
      "Fast exponentiation's running time depends on the bits of the exponent, which leaks it through timing — real cryptographic implementations use constant-time ladders instead of this straightforward version.",
      "Euclid's worst case is consecutive Fibonacci numbers, where every quotient is 1 and no step ever skips ahead; the algorithm is still logarithmic, but it does the most work it ever can.",
    ],
  },
  strings: {
    overview:
      "Searching for a pattern in a text by brute force is O(n·m), and the reason is waste: when a comparison fails after eight matching characters, the naive search throws all eight away, slides the pattern one place right, and starts again from the beginning. Every algorithm here is a different answer to the question 'what did that failed attempt actually prove?'. KMP precomputes, from the pattern alone, how much of a partial match survives a mismatch. The Z-algorithm precomputes how far every position agrees with the prefix, reusing an already-matched window instead of recomparing inside it. Rabin-Karp gives up on characters and compares numbers, rolling a hash across the text so each window costs O(1). Manacher answers a different question — the longest palindrome — with the same instinct as Z: a palindrome you have already found tells you about the positions inside it for free.",
    howItWorks: [
      "KMP builds a failure function π over the pattern, where π[i] is the length of the longest proper prefix of P[0..i] that is also a suffix of it. It is computed by matching the pattern against itself, before the text is touched at all.",
      "On a mismatch after j matched characters, KMP shifts the pattern by j − π[j−1] rather than by 1. Those π[j−1] characters are already known to match, so the text pointer never moves backwards — which is exactly why the search is O(n).",
      "The Z-algorithm keeps a window [l, r] that is known to match the prefix. For a position inside it, the answer at its mirror near the front is a free lower bound; only the part reaching past r costs real comparisons, and r never moves left.",
      "Pattern matching with Z is a trick of concatenation: run it on P + '$' + T, where the separator occurs in neither string. Any position whose Z value equals the pattern's length is an occurrence, because a match can never run across the separator.",
      "Rabin-Karp hashes each window of the text. A window whose hash differs from the pattern's cannot match, so one integer comparison replaces m character ones — and the rolling update subtracts the departing character and adds the arriving one instead of rehashing.",
      "Equal hashes do not mean equal strings, so every hash hit must be verified character by character. The failures are spurious hits, and they are why Rabin-Karp is O(n + m) expected but O(n·m) in the worst case.",
      "Manacher interleaves separators — 'abc' becomes '#a#b#c#' — so every palindrome becomes odd-length and the even-length case disappears. Radii in the padded string are lengths in the original, and the mirror inside the current palindrome gives most radii away for nothing.",
    ],
    useCases: [
      "grep, editors and anything with a find bar; KMP and Boyer–Moore variants are what makes searching a large file feel instant.",
      "Plagiarism detection and near-duplicate finding, where Rabin-Karp's hashing extends naturally to comparing many substrings at once (the Rabin fingerprint).",
      "Bioinformatics: finding motifs in DNA, where alphabets are tiny and texts are enormous, so linear time is not optional.",
      "Intrusion detection and virus scanners, matching many patterns against a stream that can only be read once.",
      "Competitive programming, where Z and Manacher are the standard tools for prefix-agreement and palindrome questions respectively.",
    ],
    advantages: [
      "Linear time, and for KMP and Z that is a worst-case guarantee rather than an average — no input makes them degrade.",
      "KMP and Z read the text once, left to right, with no backtracking, which means they work on a stream you cannot rewind.",
      "The precomputation depends only on the pattern, so searching many texts for the same pattern pays for it once.",
      "Rabin-Karp generalises where the others do not: it extends to two-dimensional patterns and to searching for many patterns at once, because hashes are cheap to compare in bulk.",
    ],
    disadvantages: [
      "Each needs an auxiliary array proportional to the pattern (KMP) or the whole string (Z, Manacher) — the constant-space naive search does not.",
      "Rabin-Karp is only expected-linear. A modulus chosen badly, or an adversary who knows it, can make every window collide and drive it to O(n·m).",
      "In practice a good Boyer–Moore–Horspool often beats KMP on natural text, because it can skip *forward* by more than one character; KMP's guarantee is about never going backwards, which is a different thing from being fast.",
      "The failure function is easy to get subtly wrong — off-by-one in the fallback is the classic bug, and it produces an algorithm that works on most inputs and fails on a few.",
    ],
  },
  backtracking: {
    overview:
      "Backtracking is depth-first search over the space of partial answers, with one addition that changes everything: the moment a partial answer is provably hopeless, the entire subtree underneath it is abandoned without being built. Choose a value for the next slot, check whether it can still lead somewhere, recurse if it can, and if the recursion comes back empty-handed, undo the choice and try the next one. That undo is the whole name of the technique, and it is the one step people skip when they write it out by hand — the state has to be put back exactly as it was found, or the next branch starts from a lie. What separates the four problems here is only what a slot is and how much the check can rule out, and the fourth of them has no check at all, which is what makes it the useful control case.",
    howItWorks: [
      "Represent a partial answer as something you can add one decision to: a queen per row, a digit per blank, a yes-or-no per number, a value per slot.",
      "At each step, enumerate the choices for the next slot. This is where the branching factor comes from, and it is why the tree is exponential before any pruning.",
      "Test each choice against the constraint before recursing. A square attacked by a queen already placed, a digit already in the row, a running total that has overshot the target — each of these kills a branch that would otherwise have been explored in full.",
      "Recurse. If the recursion reports success and you only wanted one answer, return straight up; if you want all of them, keep going.",
      "Undo the choice — take the queen off, rub the digit out, put the number back. This is the backtrack, and it is why the algorithm can reuse one board rather than copying the state at every node.",
      "When every choice at a slot fails, return failure. The mistake is not in this slot but in one further up, and the caller's undo is what fixes it.",
    ],
    useCases: [
      "Constraint satisfaction of every kind — timetabling, seating, scheduling, register allocation — where the rules make most of the search space illegal.",
      "Puzzle solvers: sudoku, crosswords, knight's tours, and the whole genre of exact-cover problems.",
      "Regular expression engines with backreferences, which backtrack over the ways a pattern could have matched.",
      "Enumeration problems where you need every answer rather than one: all permutations, all subsets, all colourings of a graph.",
    ],
    advantages: [
      "It finds an answer without ever building the whole search space, which for these problems is the difference between practical and impossible.",
      "Memory is tiny — one partial answer plus a recursion stack, because the undo means state is reused rather than copied.",
      "The pruning test is separate from the search, so a better test makes the same code dramatically faster without changing its shape.",
      "It is complete: if an answer exists, an exhaustive backtracking search will find it.",
    ],
    disadvantages: [
      "Still exponential in the worst case. Pruning changes the constant and often the practical outcome, but it does not change the complexity class.",
      "Performance depends enormously on the order choices are tried in. The sudoku solver here takes blanks in reading order; picking the most constrained blank first — the standard improvement — cuts the work on hard puzzles by orders of magnitude.",
      "The undo has to restore the state exactly. Any decision recorded and not reversed leaks into sibling branches, and the resulting bug looks like a wrong answer rather than a crash.",
      "Deep recursion on a large problem can exhaust the call stack, which is why iterative formulations with an explicit stack exist.",
    ],
  },
  dp: {
    overview:
      "Dynamic programming is what you get when a recursive solution keeps solving the same subproblem. Write the recursion honestly — the best way to make change for 11 is one coin plus the best way to make change for 11 minus that coin — and it is correct and exponentially slow, because the same amounts come up again and again down different branches. DP is the observation that there are only so many distinct subproblems, so you can lay them out in a table, fill it in an order where every cell's dependencies are already there, and pay for each one exactly once. Every problem here is that same move: decide what one cell means, work out which already-filled cells it depends on, pick a fill order that respects them, and then — the half most explanations skip — walk the table backwards to find out not how good the answer is but what it actually was.",
    howItWorks: [
      "Define the subproblem so that a cell is an answer, not a step: L[i][j] is the LCS of the first i characters of A and the first j of B; K[i][w] is the best value from the first i items in a bag of capacity w. Getting this sentence right is most of the work — the recurrence usually falls out of it.",
      "Fill the base cases first. They are the subproblems small enough to answer without recursion: an empty string shares nothing with anything, no items are worth nothing, a run of one matrix costs nothing to multiply.",
      "Fill the rest in an order where every dependency is already written down. Row by row for the two-string problems, item by item for the knapsack, and by increasing chain length for matrix chain multiplication — which is why that one fills diagonally rather than in rows.",
      "Each cell makes one small decision and records which way it went: a match or not, take the item or skip it, split the chain here or there. The value is what the decision cost; the mark in the cell's corner is what the decision was.",
      "Backtrack. The table's answer cell holds a number, and a number is not a solution: 'length 4' is not a subsequence and '23' is not a set of items. Starting at the answer and following the recorded decisions backwards recovers the choices that produced it — which is the part of the table that is actually useful and the part that is usually drawn as an afterthought.",
      "Notice how few cells the backtrack touches. Filling the table is O(n·m); the walk back is a single path through it. All that work to make one path findable is the honest cost of the technique.",
    ],
    useCases: [
      "Diffing files and version control: the longest common subsequence of two files' lines is exactly what a diff is.",
      "Spell checking, fuzzy search and DNA sequence alignment, all of which are edit distance with different costs attached to the three operations.",
      "Resource allocation under a hard limit — budgets, cargo, ad slots — which is the 0/1 knapsack whenever the things being chosen cannot be cut in half.",
      "Query planners and expression compilers, which choose an evaluation order the same way matrix chain multiplication chooses a bracketing.",
    ],
    advantages: [
      "Turns exponential recursion into polynomial time by paying for each distinct subproblem once instead of once per path that reaches it.",
      "The table is a complete record: once it is filled, related questions ('what if the bag were smaller?') are already answered in the cells you have.",
      "Correct where greedy is not. Coin change with denominations 1, 3 and 4 makes 6 in two coins, and always-take-the-largest gets three — the table finds the answer greedy cannot see.",
    ],
    disadvantages: [
      "Memory is the table. O(n·m) cells is fine at these sizes and a real problem at scale, which is why practical implementations often keep only the row they need — at the cost of being able to backtrack at all.",
      "It only works when the problem has optimal substructure and overlapping subproblems. Without the first, a cell's answer cannot be built from smaller cells; without the second, memoizing buys nothing over plain recursion.",
      "The table says how good the answer is, never what it was, unless you deliberately keep the decisions as well. That is a separate array in most textbook code and a very easy thing to leave out.",
      "Finding the right subproblem is genuinely hard and does not generalise. The recurrence is obvious in hindsight and rarely in foresight.",
    ],
  },
  treecompare: {
    overview:
      "A binary search tree has no shape of its own. Its shape is decided entirely by the order its keys arrive in, and the worst order is the most natural one: insert 1, 2, 3, … n into a plain BST and every key is larger than everything already there, so nothing ever branches left and you get a linked list with extra pointers — height n−1, lookups O(n). AVL trees and 2-3 trees exist to make that stop being possible. This view builds all three from the same keys in the same order, one insert per tick, so the difference is visible rather than asserted.",
    howItWorks: [
      "One key sequence — a permutation of 1…n chosen by the insertion order — is handed unchanged to all three structures, so any difference in the result is the structure and not the data.",
      "A BST inserts by plain descent and never restructures, so its height is a direct record of how ordered the input was.",
      "An AVL tree checks the balance factor of every node on the path back up and rotates whenever it leaves [−1, 1]. Each rotation is O(1) and at most a constant number happen per insert, which is what buys a height guaranteed below 1.44 log₂(n+2).",
      "A 2-3 tree never rotates. It absorbs a key into an existing node when there is room, and splits a node that would hold three keys, promoting the middle key to the parent. Splits propagate upward, and the tree only ever gets taller by splitting at the root — which is why every leaf stays at the same depth.",
      "The scoreboard shows height alongside the comparisons spent getting there. They are not the same measure: a 2-3 node holding two keys costs two comparisons to pass through, so it buys its shorter height with wider nodes.",
      "The height sweep runs the same insert code at sizes far past what three canvases can draw, keeping only the final numbers, and plots height against n with log₂ n, log₃ n and n over the top.",
    ],
    useCases: [
      "Seeing why a self-balancing tree is worth its complexity: sorted input turns a BST into a chain and leaves the other two at height 3.",
      "Understanding that 'not sorted' is not the same as 'random' — the alternating-ends order looks scrambled and degenerates a BST just as badly.",
      "Watching the median-first order build a perfectly balanced BST with no rebalancing at all, which is the case where AVL's rotations are pure overhead.",
      "Comparing the two balancing strategies directly: rotations versus splits, and what each costs per insert.",
      "Checking a textbook height bound against a measured height instead of taking it on faith.",
    ],
    advantages: [
      "All three structures are built with the same functions the tree views use, so a shape measured here is the shape those views would draw.",
      "The animated lanes and the height sweep run the same insert code — one with the intermediate trees kept, one without — so the plot cannot drift away from the pictures.",
      "The insertion order is the only variable, and it is on screen with the cursor on it.",
    ],
    disadvantages: [
      "Height is not the whole cost of a lookup. A 2-3 tree is shorter than an AVL tree but examines more keys per node, and neither figure accounts for cache behaviour or pointer chasing.",
      "The canvases cap at 24 keys because that is what three trees side by side can show legibly; the asymptotic behaviour only appears in the sweep.",
      "Only insertions are compared. Deletion is where 2-3 trees get genuinely intricate — borrowing and merging — and none of that is measured here.",
    ],
  },
  race: {
    overview:
      "Comparing sorting algorithms honestly is harder than it looks. Two runs are only comparable if they sorted the same data, and a side-by-side animation is only fair if a step in one lane costs what a step in the other lane costs — which, for algorithms whose frames mean completely different things, it does not. This view fixes both: every lane sorts one shared array built from a named shape and a seed, every algorithm counts its own comparisons, reads, writes, auxiliary memory and recursion depth as it works, and the transport can advance the lanes by equal amounts of *work* rather than equal numbers of frames.",
    howItWorks: [
      "One input array is built from an input shape (random, nearly sorted, reversed, few unique, all equal, sawtooth, organ pipe) and a seed, then handed unchanged to every lane — so any difference you see is the algorithm, not the data.",
      "Each algorithm reports its own counters as it runs, rather than having them inferred from what a frame happened to highlight. A comparison is a key comparison; a write is an array write; auxiliary memory is a high-water mark in elements; depth is the deepest the recursion actually went.",
      "BY WORK sync spends the same number of operations (comparisons + writes) in every lane per tick, so a lane that costs less genuinely finishes earlier on screen. BY FRAME sync advances every lane one frame per tick, which is simpler but compares frames rather than work.",
      "A lane that finishes early freezes on its final frame instead of vanishing, so the finished array sits next to the ones still churning.",
      "The empirical complexity sweep runs each algorithm at ten sizes from 10 up to 5000 with frame recording switched off, and plots measured operations against n with n, n log n and n² fitted over the top. The slope of the measured curve on log-log axes is the growth exponent — a number, not a claim.",
      "Colour-by-origin tints each bar by the index it started at. Two equal values look identical as bars, so this is the only way to see whether a sort kept tied elements in their original order — the definition of stability.",
    ],
    useCases: [
      "Seeing insertion sort beat quick sort on nearly-sorted input, which the asymptotic notation alone will never tell you.",
      "Watching Lomuto quick sort collapse to O(n²) on already-sorted data, then fixing it by switching the pivot rule to median-of-three.",
      "Comparing shell sort's gap sequences — same algorithm, same input, visibly different curves.",
      "Demonstrating stability concretely: merge, insertion, bubble and radix sort keep tied elements in order; selection, shell, heap and quick sort do not.",
      "Checking a textbook complexity claim against measured counts instead of taking it on faith.",
    ],
    advantages: [
      "The numbers are produced by the algorithms themselves, so they are exact rather than inferred from the animation.",
      "The same seeded input rebuilds identically in anyone's browser, so a shared link is the same race.",
      "The complexity sweep and the animation run the same algorithm body — one with frame recording on, one with it off — so the plot cannot drift away from what the bars show.",
    ],
    disadvantages: [
      "Operation counts are not wall-clock time: cache behaviour, branch prediction and constant factors are invisible here, which is exactly why heap sort loses to quick sort in practice despite winning on paper.",
      "The array on the race track is capped at 40 elements because that is what the bars can show; the interesting asymptotic behaviour only appears in the sweep, at sizes far past what can be animated.",
      "Counting conventions are choices. A comparison here includes the two array reads it implies, and OPS means comparisons plus writes — defensible, but not the only defensible answer.",
    ],
  },
  linkedlist: {
    overview:
      "A linked list is a linear data structure made of nodes scattered anywhere in memory, each holding a value and a pointer (or two) to its neighbor(s). Unlike an array, elements aren't stored contiguously, so there's no single block of memory to resize — growing or shrinking the list is just a matter of relinking pointers.",
    howItWorks: [
      "Each node stores a value plus a reference to the next node (and, in a doubly linked list, a reference to the previous node too).",
      "The list keeps a reference to the head (first node) and often the tail (last node) so both ends are reachable quickly.",
      "A circular list links the tail's 'next' back to the head, forming a loop instead of ending in a null pointer.",
      "To reach a node, you walk the chain of pointers one hop at a time — there's no way to jump straight to index k the way an array can.",
    ],
    useCases: [
      "Implementing stacks, queues, and other ADTs where insert/delete at the ends must be O(1).",
      "Situations with frequent insertions and deletions in the middle of a sequence, since no shifting is required.",
      "Building blocks for more advanced structures like adjacency lists (graphs) and LRU caches.",
    ],
    advantages: [
      "Insertion and deletion at a known position are O(1) — no shifting elements like an array requires.",
      "Size grows and shrinks dynamically without needing to reallocate a contiguous block of memory.",
      "A doubly linked list allows O(1) traversal in either direction; a circular list allows continuous looping.",
    ],
    disadvantages: [
      "No random access — reaching the k-th element takes O(n) time since you must walk from the head.",
      "Extra memory overhead per node for storing pointers.",
      "Poor cache locality compared to arrays, since nodes can be scattered anywhere in memory.",
    ],
  },

  polynomial: {
    overview:
      "A polynomial can be represented as a linked list where each node stores one term — a coefficient and an exponent — kept in decreasing order of exponent. This representation naturally handles polynomials of any degree without wasting memory on zero coefficients, since terms that don't exist simply have no node.",
    howItWorks: [
      "Each node holds a (coefficient, exponent) pair, e.g. 3 and 2 for the term 3x².",
      "Nodes are kept sorted by exponent so operations like addition can walk both lists in lockstep.",
      "Addition merges two polynomials term-by-term, combining nodes with matching exponents and copying over the rest.",
      "Multiplication distributes every term of one polynomial across every term of the other, then combines any resulting like terms.",
      "Evaluating the polynomial at a value of x walks the list once, accumulating coefficient × x^exponent for each node.",
    ],
    useCases: [
      "Symbolic math libraries and computer algebra systems that manipulate polynomials of arbitrary size.",
      "Sparse polynomials (e.g. x¹⁰⁰ + 1) where an array indexed by exponent would waste enormous amounts of memory.",
      "Signal processing and coding theory, where polynomial arithmetic underlies operations like CRC checks and error-correcting codes.",
    ],
    advantages: [
      "Memory-efficient for sparse polynomials — only non-zero terms take up space.",
      "Naturally supports polynomials of unbounded degree.",
      "Addition and multiplication map cleanly onto linked-list merge/traversal patterns.",
    ],
    disadvantages: [
      "No random access to a specific term by exponent — you must traverse to find it.",
      "Multiplication is O(n·m) for polynomials with n and m terms, since every pair of terms must be considered.",
      "Extra pointer overhead per term compared to a dense array representation.",
    ],
  },

  leftist: {
    overview:
      "A binary heap is fast at everything except joining two of them. Its shape is the array it lives in, and two arrays cannot be spliced, so melding two n-element heaps means re-heapifying — O(n), which swamps the log-time operations the heap was chosen for. A leftist tree gives up the array and the complete shape, keeps only heap order, and adds one structural rule that keeps a single path short. Every node stores its null-path length s, the distance to the nearest missing child, and the rule is s(left) ≥ s(right) at every node — so the shortest way out is always to the right. That bounds the right spine at ⌊log₂(n+1)⌋, and every operation works only down the right spines. The result is a heap that melds in O(log n); and once you have that, insert and delete-min are melds too, so there is no sift-up and no sift-down anywhere in the structure.",
    howItWorks: [
      "s(x), the null-path length, is the number of edges on the shortest path from x to a missing child. A leaf has s = 1 and a null pointer s = 0.",
      "The leftist property is s(left) ≥ s(right) at every node. It says nothing about subtree sizes or heights — a leftist tree is often extremely lopsided, and that is the point: leaning left is what pays for the short right spine.",
      "Why the spine is short: every path out of a node with s = k is at least k long, so it has a complete tree of at least 2^k − 1 nodes beneath it. An n-node tree therefore has s(root) ≤ log₂(n+1), and s(root) is exactly the right spine's length.",
      "Meld, in two passes. First merge the two right spines into one key-ordered chain, each node keeping its left subtree untouched. Then walk the chain back up from the bottom, hanging each node's successor on its right, swapping children where the leftist property demands it, and setting s = s(right) + 1.",
      "Only right pointers are ever rewritten, so the work is the sum of the two spine lengths and never the tree sizes.",
      "Insert is a meld with a one-node tree. Delete-min removes the root and melds its two subtrees, which were each already leftist and already heap-ordered.",
      "Building from n values by repeated insert is O(n log n). Putting each value in a queue as a one-node tree and repeatedly melding the front two, result to the back, is O(n) — the same trick that builds a Huffman tree.",
      "A skew heap is this structure with the bookkeeping removed: it stores no s values and swaps children unconditionally, which gives the same bounds amortised rather than worst case.",
    ],
    useCases: [
      "Any priority queue that has to be merged: discrete-event simulations that join event lists, and parallel or distributed schedulers that combine per-worker queues.",
      "External and polyphase merge sorting, where runs are combined pairwise and the queues themselves have to join.",
      "Dijkstra and Prim built on meldable heaps — the whole line of work on decrease-key (Fibonacci, pairing and rank-pairing heaps) starts from the meldable-heap idea.",
      "Functional and persistent priority queues: because a meld rewrites only one path, the untouched subtrees can be shared with the previous version rather than copied.",
    ],
    advantages: [
      "Meld in O(log n), which a binary heap cannot do at all without rebuilding.",
      "One operation covers everything — insert and delete-min are melds — so there is no separate sift-up or sift-down code and no complete-shape invariant to maintain.",
      "Only the nodes on the two right spines are touched, which makes the structure naturally persistent.",
      "Worst-case logarithmic rather than amortised: unlike a skew heap, no single operation can be slow.",
    ],
    disadvantages: [
      "Pointers instead of an array — two child pointers and an s value per node, against nothing at all for a binary heap — and no cache locality worth speaking of.",
      "The height is unbounded; a leftist tree can be a left-leaning chain. Anything that walks the height rather than the right spine is not logarithmic.",
      "find-max on a min leftist tree is O(n), exactly as on a binary heap. It is single-ended.",
      "Slower in practice than a binary heap for any workload that never melds, which is most of them.",
    ],
  },

  depq: {
    overview:
      "A binary heap answers one question cheaply: give me the smallest. Ask a min heap for its largest element and it has nothing to offer — the maximum is somewhere among the leaves, so finding it means examining all ⌈n/2⌉ of them and what was O(log n) becomes O(n). A double-ended priority queue answers both ends in log time from one structure, and two classical designs do it while keeping the single flat array a binary heap uses. Only the invariant laid over it changes. A min-max heap alternates the levels — even levels are min levels, odd levels are max — so the root is the smallest element, the largest is one of its two children, and comparisons happen against grandparents rather than parents. An interval heap reads the same array in pairs: node k holds two values as a closed interval, the lower ends form a min heap, the upper ends a max heap, and the root node holds both answers side by side.",
    howItWorks: [
      "Min-max heap: level(i) = ⌊log₂(i+1)⌋. Even levels are min levels — a node there is ≤ all of its descendants — and odd levels are max levels. The root is the global minimum; the global maximum is one of indices 1 and 2.",
      "A min node's parent is a max node and says nothing about it, so the nearest node of the same kind is the grandparent, two levels up. Every sift therefore moves in steps of two.",
      "Min-max insert: place at the end, spend one comparison against the parent to learn which of the two orders the value belongs in, then rise against grandparents.",
      "Min-max delete: the last element fills the hole and trickles down, considering six candidates at each step — two children and four grandchildren. When the winner is a grandchild there is one extra comparison afterwards, because the value has just dropped past a node of the other kind and may be on the wrong side of it.",
      "Interval heap: node k is items[2k] and items[2k+1], read as [lo, hi]. The lo values are a min heap, the hi values a max heap, and every node's interval contains both of its children's. Only the last node may hold a single element, which stands in for both of its own ends.",
      "Interval insert: put the value in the last node, order the pair, then rise through the min heap on lo endpoints or the max heap on hi endpoints — never both, since a value cannot be below its parent's lower end and above its upper end at once.",
      "Interval delete-min takes the root's lo and sifts the replacement down the lo endpoints; delete-max takes the root's hi and sifts down the hi endpoints. Either mover can leave a node with lo > hi, so each one swaps the pair back afterwards.",
      "An interval heap also gives a range query for nothing: the root's interval is the range of the whole collection, and every node's interval is the range of its own subtree.",
    ],
    useCases: [
      "Bounded buffers that keep the best k of a stream: insert everything and evict the worst, which needs both ends.",
      "External sorting, and replacement selection, which discards elements outside the current window while building runs.",
      "Branch-and-bound and A*-style searches that both expand the most promising node and prune the least promising one.",
      "Scheduling and load balancing where the shortest and longest jobs both matter, and median or trimmed-mean maintenance over a stream.",
      "k-nearest-neighbour search, where the current worst candidate is what decides the pruning radius — interval heaps are the standard choice in the external-memory literature.",
    ],
    advantages: [
      "Both ends in O(1) to find and O(log n) to remove, from a single structure — no pair of heaps to keep in step and no correspondence pointers between them.",
      "Still one flat array: no child pointers, and the same cache behaviour and zero space overhead a binary heap has.",
      "An interval heap gives the whole collection's range for free, and spends slightly fewer comparisons than a min-max heap, because the opponent is always in the same node.",
    ],
    disadvantages: [
      "More intricate than a binary heap in every operation, and the fiddly cases — a min-max grandchild correction, an interval heap's half-full last node — are exactly where implementations go wrong.",
      "Worse constant factors than a plain heap, so if only one end is ever asked for, a binary heap is the better choice.",
      "Neither melds: joining two is O(n), which is the problem a leftist tree exists to solve.",
      "Neither supports decrease-key without extra machinery, since neither keeps any index from a value to its position.",
    ],
  },

  selectiontree: {
    overview:
      "Merging two sorted runs costs one comparison per element. Merging k of them the obvious way costs k−1 per element, because every output re-scans every run's head — re-deriving, every single time, a fact that has barely changed, since only one run moved. A selection tree remembers the tournament instead. The k runs are the leaves of a complete binary tree, every internal node records the result of a match between its two subtrees, and after an element is output only the matches on one root-to-leaf path can have changed. So the next winner costs ⌈log₂ k⌉ comparisons rather than k−1. There are two ways to record the tournament and both come out of the same pass over it: a winner tree stores the winner of each match, so the root is the answer, while a loser tree stores the loser and keeps the champion above the root. The loser tree sounds perverse until you replay a path — the loser sitting at a node is precisely the opponent the next contender has to beat there, so it is the useful half to have kept.",
    howItWorks: [
      "k runs at the leaves, k rounded up to a power of two so the bottom row is full. Padding leaves hold empty runs, which offer +∞ and therefore lose every match they play.",
      "The array holds run indices, never values. A run's head changes constantly, and re-storing it everywhere it appeared would be the bookkeeping the tree exists to avoid.",
      "Building plays k−1 matches bottom-up. Each one establishes two facts — who won and who lost — and the two kinds of tree differ only in which of them the node keeps.",
      "Winner tree: node i holds the winner beneath it, so the root holds the overall winner. Replaying a path re-plays each match, which means reading both children of every node on it.",
      "Loser tree: node i holds the loser of the match played at i, and the champion sits at position 0, outside the tree. Replaying is a plain walk upward — carry the contender up and beat it against the loser sitting at each node, and the winner of that carries on. One value read per level, and no sibling indexing at all.",
      "Output one element: take the champion, advance that run by one, and replay the path from its leaf to the root. Only that leaf changed, so only that path can be wrong.",
      "A run that runs out is treated as offering +∞, so it loses every subsequent match and needs no special case anywhere else.",
      "Total cost for n elements across k runs: O(n log k), against O(nk) for a flat scan. It is also why a k-element heap works here — a selection tree is essentially that heap with the comparison structure made explicit and the movement removed.",
    ],
    useCases: [
      "External merge sort: the k-way merge pass is what touches the disk, and the comparison count decides how many passes over the data are affordable. This is the classical application and the reason loser trees appear in Knuth.",
      "Replacement selection, which uses a selection tree to generate initial runs roughly twice as long as memory.",
      "Merging sorted segments in database query execution, LSM-tree compaction (which merges k sorted SSTables), and Lucene segment merges.",
      "Tournament sort — heapsort recast as a selection tree — and any k-way stream merge: time-series ingestion, log aggregation, sorted-index intersection.",
      "Finding the k-th smallest across several sorted lists, where the tree yields each successive element in log k.",
    ],
    advantages: [
      "log₂ k comparisons per output instead of k−1, and the gap grows with k: a factor of two at k = 4, a factor of ten by k = 64.",
      "Each run is read strictly sequentially, and a head is compared only when it changes — which is what makes this right for data on disk or arriving as a stream.",
      "One flat array of run indices, no per-element bookkeeping, and O(k) space however much data flows through it.",
      "A loser tree replays a path with one comparison and one node read per level, and the walk needs no child arithmetic at all.",
    ],
    disadvantages: [
      "Only worth it for k above about four. At k = 2 it is a plain merge with extra machinery, and the constant factors are real.",
      "k has to be known when the tree is built; adding or removing a run means rebuilding it.",
      "The bottom row must be full, so up to half the leaves can be padding when k is just above a power of two.",
      "It exposes only the overall winner — there is no way to ask about the second-smallest element without outputting the first.",
    ],
  },

  mdarray: {
    overview:
      "There are no two-dimensional arrays. Memory is a single run of addresses, and every array of more than one dimension is a *formula* that turns a tuple of indices into one offset. Which formula a language picked is the difference between C and Fortran: row-major fills a row before moving on, column-major fills a column, and the two produce identical results and wildly different performance for the same loop. Once you see the array as a mapping rather than a shape, the special matrices follow — if you know in advance that everything above the diagonal is zero, or that A[i][j] always equals A[j][i], then the mapping can skip those cells entirely, and n² storage becomes n(n+1)/2 or 3n−2 or n. What you pay for it is that the mapping stops being one formula and starts having a branch in it, and that a cell with no address is a cell you cannot write to.",
    howItWorks: [
      "Row-major: offset = ((i₀·d₁ + i₁)·d₂ + i₂)·… — Horner's rule, one multiply and one add per dimension. The last index moves fastest, so cells adjacent along the last axis are adjacent in memory.",
      "Column-major is the same computation with the indices in the other order: offset = i₀ + d₀·(i₁ + d₁·i₂). The first index moves fastest.",
      "Neither formula contains the first dimension, which is why C accepts `int a[][4]` with the outer size left off and refuses to let you leave the inner one off.",
      "A traversal is fast when it matches the layout and slow when it does not — same elements, same arithmetic, several times the time, because every read misses the cache. Swapping the two loops is the whole fix, and it is why BLAS routines come in row and column variants.",
      "Lower triangular: rows 0..i−1 hold i(i+1)/2 elements between them, so offset = i(i+1)/2 + j for j ≤ i, and cells above the diagonal have no offset at all.",
      "Symmetric matrices store the lower triangle and *redirect*: reading A[i][j] with j > i reads slot j(j+1)/2 + i instead. One number under two names — which also means writing through either name changes both.",
      "Tridiagonal: only |i − j| ≤ 1 is stored, and the mapping collapses to offset = 2i + j, for 3n−2 elements. A diagonal matrix goes further still: offset = i, for n.",
    ],
    useCases: [
      "Every compiler emits one of these formulas for every array subscript; understanding the row-major one is understanding what `a[i][j]` compiles to.",
      "Cache-aware numerical code — loop interchange, blocking, and tiling all exist because of the traversal-order asymmetry.",
      "LAPACK's packed storage formats (SP, HP, TP) are exactly the triangular and symmetric layouts here, and are used for Cholesky factorisation and covariance matrices.",
      "Tridiagonal systems appear wherever a one-dimensional differential equation is discretised, and are solved in O(n) by the Thomas algorithm precisely because of that storage.",
      "Image and tensor libraries expose the layout as a first-class property — NumPy's C vs F order, PyTorch's strides — because getting it wrong is a silent slowdown rather than an error.",
    ],
    advantages: [
      "Addressing is O(1) with no indirection and no lookup table: a couple of multiply-adds, which is what makes an array the fastest structure there is.",
      "The packed layouts cut storage by nearly half (triangular, symmetric) or to almost nothing (tridiagonal, diagonal), and they do it without any per-element bookkeeping — no indices are stored, unlike a sparse matrix.",
      "The mapping is a closed form, so it parallelises and vectorises trivially.",
    ],
    disadvantages: [
      "The shape has to be known and fixed: a ragged array is not addressable by a formula, and growing a dimension means re-laying out everything.",
      "A traversal against the layout can be many times slower than the same traversal with it, and nothing in the source code shows which one you wrote.",
      "The packed layouts need a comparison before the arithmetic, and cells outside the stored region cannot be written at all — so the structure enforces the assumption it was built on, which is a feature until the assumption changes.",
      "Symmetric storage aliases two logical cells onto one, which is correct for a symmetric matrix and a bug the moment the matrix stops being one.",
    ],
  },

  sparsematrix: {
    overview:
      "A matrix is called sparse when most of its entries are zero, and the interesting thing about that is not the memory — it is that every operation changes shape. Store only the non-zero entries as (row, column, value) triples in row-major order and the grid disappears: 3 numbers per term plus a 3-number header, against one per cell, so the representation pays off below roughly a third density and costs more above it. What you buy with the saving is real, and so is what you give up. Reading A[i][j] was one address calculation and is now a search. Addition was a nested loop and is now a two-list merge. Transpose, which was almost free, becomes the most interesting operation in the set — because the obvious way to keep the result ordered is quadratic, and there is a linear way that works by counting first.",
    howItWorks: [
      "The representation is a list of (row, column, value) triples, kept sorted by row and then by column. Scanning a dense grid in row-major order produces exactly that order, so building the list needs no sort.",
      "Reading a single cell is a binary search over the terms, O(log t). A zero cell is the worst case: it is found by not being there.",
      "Addition walks both lists together and compares positions, copying whichever term comes first in row-major order and adding the values when both lists hold the same cell. A sum of zero is dropped — a sparse list that stored zeros would stop being sparse.",
      "Multiplication only ever multiplies a term of A at (i, k) with a term of B at (k, j): the inner index has to match, so the work is the number of matching pairs and not rows × columns × depth. Products accumulate, because several pairs can land in the same result cell.",
      "The simple transpose keeps the result in order by building it in order — take column 0, scan every term looking for it, then column 1, and so on. That re-reads all t terms once per column: O(cols · t).",
      "The fast transpose works out every destination before moving anything. Count the terms in each column of A (that count is the length of the matching row of Aᵀ), turn the counts into starting positions with a running sum, then read the list once and drop each term straight into its slot. O(cols + t) — a counting sort on the column index.",
      "Real libraries take the same idea further: compressed sparse row (CSR) drops the row index entirely, storing one pointer per row instead of one row number per term, which is the fast transpose's starting-position array made permanent.",
    ],
    useCases: [
      "Finite element and finite difference solvers, where a mesh of a million nodes produces a matrix with a handful of non-zeros per row and would be impossible to store densely.",
      "Graph algorithms: an adjacency matrix of a sparse graph is a sparse matrix, and CSR is how most graph libraries store one.",
      "Recommender systems and search — a user-by-item ratings matrix or a document-by-term matrix is typically far below 1% dense.",
      "Google's original PageRank iteration is a sparse matrix-vector product, repeated.",
    ],
    advantages: [
      "Memory proportional to the number of non-zero entries rather than to the shape, which is the difference between possible and impossible at scale.",
      "Operations skip the zeros entirely: a sparse multiply does work proportional to the matching pairs, not to the dimensions.",
      "Addition and transpose come out already sorted, because a merge of ordered lists is ordered and a counting pass places terms in order.",
    ],
    disadvantages: [
      "Random access is gone: reading one cell is O(log t) at best, against O(1) for a dense array.",
      "Above about a third density the triplet form costs more memory than the grid it replaced, and every operation is slower too.",
      "Updates are awkward — inserting a term into a sorted list means shifting the rest, so most libraries treat a built sparse matrix as read-only and rebuild it instead.",
      "A product of two sparse matrices need not be sparse, so the representation can quietly stop paying off partway through a computation.",
    ],
  },

  expression: {
    overview:
      "Infix — the notation everybody writes arithmetic in — is the only one of the three that needs help to be read. A + B * C means one thing rather than another because of a precedence table that is nowhere in the text, and ( A + B ) * C needs brackets to override it. Postfix (A B C * +) and prefix (+ A * B C) need neither: the position of an operator relative to its operands says exactly which operands are its, so there is one reading and no table. That is why compilers and calculators convert. The conversion is Dijkstra's shunting yard, and the evaluation is a single stack, and the two are close enough to be the same loop: an operator waits until something arrives that proves its right-hand operand is finished, and then it is either written out (converting) or applied (evaluating).",
    howItWorks: [
      "Converting infix to postfix: operands go straight to the output, because postfix never reorders them. Operators wait on a stack.",
      "An incoming operator pops every waiting operator that binds at least as tightly as it does — those can no longer be given anything more on their right, so they are finished.",
      "'(' is pushed as a wall that nothing pops past, and the matching ')' drains the stack back down to it. Brackets never appear in the output: what they were saying is now said by the operator order.",
      "Associativity is one character of difference. A left-associative operator is popped by an equal precedence (>=); a right-associative one is not (>), which is what makes 2^3^2 group as 2^(3^2).",
      "Evaluating postfix is one left-to-right pass and one stack: push operands, and on an operator pop two, apply, push the result. The value popped first is the right operand.",
      "Prefix is the mirror image of postfix, so both its conversion and its evaluation are the same algorithms run right to left — and in the mirror, the value popped first is the left operand instead.",
      "Infix can also be evaluated in one pass without writing the postfix down, but it takes two stacks — one for operands, one for operators — and the same precedence decision at the same points. That second stack is the cost of the notation.",
    ],
    useCases: [
      "Every compiler and interpreter front end: expression parsing is precedence-climbing or shunting yard, and the output is a tree that prefix notation is a literal transcription of.",
      "Stack virtual machines — the JVM, CPython's bytecode, WebAssembly — execute postfix, because a stack machine needs no operand addressing at all.",
      "Reverse Polish calculators (HP's whole line), where the user does the conversion and the machine keeps only the stack.",
      "Spreadsheet formula engines, database query planners, and any place a user-typed expression has to be evaluated repeatedly: convert once, evaluate many times.",
    ],
    advantages: [
      "Postfix and prefix are unambiguous with no precedence table and no brackets, so evaluating either needs no lookahead and no backtracking.",
      "Both conversion and evaluation are a single pass, O(n) time, with a stack no deeper than the expression nests.",
      "Converting once and evaluating many times is strictly cheaper than re-parsing infix on every evaluation.",
    ],
    disadvantages: [
      "Neither postfix nor prefix is comfortable to read or write, which is why source code is infix and only the internals are not.",
      "Unary and binary operators sharing a symbol (the two meanings of '-') cannot be told apart by position alone, so a real tokeniser needs context the notation itself does not carry.",
      "Turning postfix back into readable infix requires the precedence table again — a naive reconstruction brackets everything.",
    ],
  },

  stack: {
    overview:
      "A stack is a Last-In-First-Out (LIFO) data structure: the most recently added element is always the first one removed, just like a stack of plates — you add to and take from the top only.",
    howItWorks: [
      "push adds a new element to the top of the stack.",
      "pop removes and returns the element currently on top.",
      "peek looks at the top element without removing it.",
      "Because both insertion and removal happen at the same end, no shifting of other elements is ever needed.",
    ],
    useCases: [
      "Function call management — the 'call stack' that tracks return addresses and local variables.",
      "Undo/redo functionality in editors, where each action is pushed and undone in reverse order.",
      "Expression evaluation and parsing, such as matching brackets or converting infix to postfix notation.",
      "Depth-first search (DFS) traversal of trees and graphs, either explicitly or via recursion's implicit call stack.",
    ],
    advantages: [
      "All core operations (push, pop, peek) run in O(1) time.",
      "Very simple to implement with either an array or a linked list.",
      "Enforces a strict, predictable order that's ideal for problems with a natural 'nesting' structure.",
    ],
    disadvantages: [
      "No access to elements in the middle without popping everything above them first.",
      "A fixed-size array-backed stack can overflow if it exceeds its capacity.",
      "Not suitable when you need first-in-first-out order — that's what a queue is for.",
    ],
  },

  queue: {
    overview:
      "A queue is a First-In-First-Out (FIFO) data structure: elements are added at the back and removed from the front, just like people waiting in a line — whoever arrived first gets served first.",
    howItWorks: [
      "enqueue adds a new element to the back (rear) of the queue.",
      "dequeue removes and returns the element at the front.",
      "peek looks at the front element without removing it.",
      "The front and rear are tracked independently so both operations can run without touching the rest of the elements.",
    ],
    useCases: [
      "Task scheduling and job processing, where requests should be handled in the order they arrive.",
      "Breadth-first search (BFS) traversal of trees and graphs, using a queue to track the next nodes to visit.",
      "Buffering data between producers and consumers that run at different speeds, such as I/O or streaming pipelines.",
      "Print queues, message queues, and request-handling systems.",
    ],
    advantages: [
      "Core operations (enqueue, dequeue, peek) run in O(1) time with a proper implementation.",
      "Preserves arrival order, which matches many real-world processes naturally.",
      "Simple to implement with an array (circular buffer) or a linked list.",
    ],
    disadvantages: [
      "No access to elements in the middle without dequeuing everything ahead of them.",
      "A naive array-backed queue that only tracks a front index can waste space unless implemented as a circular buffer.",
      "A fixed-capacity queue can become full and reject new elements.",
    ],
  },

  unionfind: {
    overview:
      "Union-find answers one question — are these two things in the same group? — and supports one change: merge two groups. That is all it does. It keeps no edges, no paths and no membership lists; each element only stores a pointer to another element, and a group is identified by the one element that points at itself. From those two arrays it answers connectivity queries in effectively constant time, which is why it sits underneath Kruskal's algorithm, connected-component labelling, and every 'are these accounts the same person' merge you have ever written.",
    howItWorks: [
      "Each element stores a parent pointer. An element that points at itself is a root, and the root's identity is the name of the set.",
      "find(x) walks up the parent chain to the root. Two elements are in the same set exactly when their walks end at the same place.",
      "union(a, b) finds both roots and points one at the other — a single pointer write merges two entire sets.",
      "Union by size decides which root moves: the smaller tree is hung under the larger, so the elements that gain depth are always the fewer ones.",
      "Path compression is applied during find: every element the walk passed is re-pointed straight at the root, so the same walk never happens twice and the trees flatten as they are used.",
      "With both optimizations, m operations on n elements cost O(m · α(n)), where α is the inverse Ackermann function — below 5 for any n that could physically be stored.",
    ],
    useCases: [
      "Kruskal's minimum spanning tree, where the cycle check is exactly 'are these two vertices already connected?'.",
      "Connected components and image segmentation — labelling which pixels or nodes belong to the same blob.",
      "Dynamic connectivity in networks: keeping track of what is reachable as links are added.",
      "Merging equivalence classes, from type inference in compilers to de-duplicating records that turn out to be the same entity.",
    ],
    advantages: [
      "Effectively constant time per operation once both optimizations are in place — faster than any tree- or graph-based alternative for pure connectivity.",
      "Tiny memory footprint: two integer arrays, no pointers to allocate and no per-set bookkeeping.",
      "Trivial to implement correctly, and it degrades gracefully — even without path compression, union by size alone keeps trees at O(log n).",
    ],
    disadvantages: [
      "Merges are one-way: there is no undo, no split, and no way to remove an element from a set without rebuilding.",
      "It knows that two elements are connected but not how — no path, no distance, no edges are retained.",
      "The groups themselves are never stored; listing the members of a set means walking every element up to its root.",
    ],
  },

  trie: {
    overview:
      "A trie stores a set of strings by their characters rather than as whole values: every edge carries one character, and every node is the prefix spelled by the path that reaches it. Nothing in the structure holds a complete word — 'car' and 'card' share three nodes and differ by one — and lookup never compares whole strings, only walks a path. That makes a trie's cost depend on the length of the word you are asking about and not at all on how many words are stored, and it makes prefix queries, which every other dictionary structure struggles with, almost free.",
    howItWorks: [
      "Each node holds one child per possible next character, plus a flag marking whether a word ends there.",
      "That end-of-word flag is essential: in a trie holding only 'card', the word 'car' is spelled out perfectly and is still not stored. Without the flag there would be no way to tell the two cases apart.",
      "Insert walks the word, creating nodes only where the path runs out, then sets the flag — so inserting 'card' next to 'car' costs a single node.",
      "Searching walks the same path and checks the flag at the end; running out of edges means nothing stored even begins that way.",
      "Autocomplete walks to the prefix node and enumerates the subtree beneath it, because every completion of a prefix lives under exactly one node.",
      "Deleting clears the flag and then prunes back up the path, stopping at the first node that still has children or is itself a word — those are still spelling out other words.",
      "Visiting each node's children in alphabetical order makes any traversal come out sorted, with no sorting step.",
    ],
    useCases: [
      "Autocomplete and type-ahead suggestions, the canonical use — prefix lookup is what the structure is for.",
      "Spell checkers and word games, where near-misses and valid-prefix checks matter as much as exact hits.",
      "IP routing tables and longest-prefix matching, using tries over bits rather than letters.",
      "Dictionary compression for large word lists that share heavy prefixes.",
    ],
    advantages: [
      "Lookup, insert and delete are O(L) in the length of the word, regardless of how many words are stored.",
      "Prefix queries and autocomplete come for free; a hash table scatters 'car' and 'card' to unrelated buckets and cannot answer them at all.",
      "Traversal yields words in alphabetical order without sorting, and shared prefixes are stored only once.",
      "No hash function, so no collisions to resolve and no worst case caused by unlucky keys.",
    ],
    disadvantages: [
      "Memory-hungry: each node carries a slot per possible character, so a sparse trie over a large alphabet wastes a great deal of space — radix trees and ternary search tries exist to fix exactly this.",
      "Poor cache locality — a lookup chases one pointer per character, where a hash table computes one index and makes a single probe.",
      "Only useful for string-like keys that decompose into characters; there is nothing to walk for an arbitrary value.",
    ],
  },

  heap: {
    overview:
      "A binary heap is a complete binary tree with one rule: every parent outranks its children — larger in a max-heap, smaller in a min-heap. That is a far weaker promise than a binary search tree makes, and the weakness is the point. Nothing orders the two subtrees under a node against each other, so a heap can never answer 'what comes after 30?', but it can keep the single most extreme value at the root through any sequence of insertions and removals for O(log n) a piece. Because the tree is always complete it needs no pointers at all: it lives in a flat array where index i's children sit at 2i+1 and 2i+2.",
    howItWorks: [
      "The tree is complete — every level full except the last, which fills left to right — so the height is always ⌊log₂ n⌋ and no rebalancing machinery is needed.",
      "That completeness is what lets the tree collapse into an array: the root is index 0, index i's children are 2i+1 and 2i+2, and its parent is ⌊(i−1)/2⌋. No child pointers are stored anywhere.",
      "Insert puts the value at the end of the array — the only slot that keeps the tree complete — then sifts it up, swapping with its parent while it outranks it.",
      "Extract returns the root and fills the hole with the last element (again, to stay complete), then sifts that value down, swapping with the better of its two children until both fall below it.",
      "Building a heap from an arbitrary array is done bottom-up: sift down every internal node from the last one back to the root. This costs O(n), not O(n log n), because half the nodes are leaves that never move and only the root can travel the full height.",
      "Heap sort is nothing more than build-then-extract-repeatedly, which is why it is O(n log n) with no extra memory.",
    ],
    useCases: [
      "Priority queues — schedulers, event simulations, and bandwidth shapers that always need the next-most-urgent item.",
      "Dijkstra's and Prim's algorithms, which repeatedly pull the cheapest unvisited vertex.",
      "Heap sort, where the array being sorted doubles as the heap.",
      "Streaming top-k problems: keep a k-element min-heap and every new value is one O(log k) comparison away from being accepted or discarded.",
    ],
    advantages: [
      "Insert and extract are O(log n) with a guaranteed height — unlike a BST, a heap cannot degenerate into a list.",
      "Reading the maximum (or minimum) is O(1), and building a heap from an existing array is O(n).",
      "No pointers and no wasted nodes: the array representation is as compact as a data structure gets, with excellent cache behaviour.",
    ],
    disadvantages: [
      "No ordering beyond parent-vs-child, so searching for an arbitrary value is O(n) and range queries are impossible.",
      "Only one end is cheap: a max-heap gives you the maximum in O(1) but says nothing useful about the minimum.",
      "Not stable, and merging two heaps is O(n) — specialised variants (binomial, Fibonacci) exist precisely because the binary heap is bad at it.",
    ],
  },

  hashtable: {
    overview:
      "A hash table stores keys in an array of buckets, using a hash function to turn each key directly into an index — h(k) = k mod m here. That skips searching entirely: instead of comparing your way to a key, you compute where it must be. The catch is that a function mapping a huge key space onto a small array must send different keys to the same bucket sometimes, so every hash table is really two designs — a hash function, and a plan for what to do when two keys collide.",
    howItWorks: [
      "The hash function maps a key to a bucket index. Division — h(k) = k mod m — is the default here, and a prime m keeps it from clustering when the keys share a factor with the table size.",
      "The other three trade that arithmetic for a different failure mode. Multiplication scales the key by an irrational fraction and keeps the fractional part, which works for any m, prime or not. Mid-square squares the key and takes the middle digits, so every digit of the key influences the result. Digit folding splits the key into chunks and adds them, which is cheap and is what checksum-style hashes do.",
      "Separate chaining gives every bucket a linked list, so colliding keys simply queue up in the same bucket and the table can hold more keys than it has buckets.",
      "Open addressing stores at most one key per bucket and sends collisions elsewhere: linear probing tries the next slot, then the next; quadratic probing jumps 1, 4, 9, 16... slots ahead to break up the clusters linear probing forms; double hashing takes its step size from a *second* hash of the key, so two keys that collide once do not then walk the same path — which is what removes clustering rather than merely spreading it out.",
      "Robin Hood hashing is linear probing with one extra rule: on a collision, whichever of the two keys is further from its home bucket gets the slot, and the other keeps probing. It steals from the rich to give to the poor, which does not shorten the average probe at all — it shortens the *worst* one, by evening out the distances.",
      "Cuckoo hashing gives up probing entirely. Every key has exactly two possible buckets, one per hash function, so a lookup is two reads and never more. An insert that finds both occupied evicts the sitting key and re-inserts it at its other bucket, which may evict another in turn — a chain that either settles or loops, and a loop means rehash.",
      "A lookup repeats the insert's path exactly — same hash, same chain or probe sequence — and stops at the first free slot, because an insert would have stopped there too.",
      "Deleting under open addressing cannot blank a slot: that would strand every key whose probe sequence runs through it. The slot gets a tombstone instead, which searches skip and later inserts can reuse.",
      "The load factor α = n/m tracks how full the table is. Crossing the limit (about 0.75 for chaining, 0.5 for probing) triggers a resize: allocate a larger prime capacity and rehash every key, since h(k) is taken mod the new size.",
    ],
    useCases: [
      "Dictionaries, maps, and sets in essentially every standard library — Python's dict, Java's HashMap, JavaScript's Map.",
      "Database indexes and caches, where a key must resolve to a record in constant time.",
      "De-duplication and membership tests, such as tracking which URLs a crawler has already visited.",
      "Compiler and interpreter symbol tables, mapping identifiers to their declarations.",
    ],
    advantages: [
      "Insert, search, and delete all run in O(1) on average — no comparisons chain, the hash goes straight to the bucket.",
      "Performance is tunable: the load factor limit trades memory for speed, and resizing keeps that trade in force as the table grows.",
      "Separate chaining degrades gracefully — it keeps working past a load factor of 1, where open addressing would have no room left.",
      "Cuckoo hashing gives a worst-case O(1) *lookup*, not just an average one: two buckets, two reads, done. Robin Hood keeps the probe lengths tightly clustered around the average, which is what makes open addressing predictable enough to rely on.",
    ],
    disadvantages: [
      "No ordering. Keys come out in hash order, so range queries and sorted iteration need a tree instead.",
      "Worst case is O(n) — a bad hash function, or adversarial keys, can pile every key into one bucket.",
      "Resizing is an O(n) pause: one unlucky insert rehashes the entire table, which matters for latency even though inserts stay O(1) amortized.",
      "Open addressing wastes slots on tombstones and slows down as it fills, which is why it needs a much lower load factor than chaining.",
      "The cleverer schemes move the cost rather than removing it. Double hashing needs a second hash function whose step size is coprime with the table size or the probe sequence will not reach every slot. Cuckoo hashing pays for its fast lookups with inserts that can cascade, and above a load factor of about 0.5 those cascades turn into rehashes.",
    ],
  },

  dynamichash: {
    overview:
      "An ordinary hash table grows by rehashing: allocate a bigger array, recompute every key's index, copy them all across. That is O(n) in one go, and while it runs the table is unusable — fine for an in-memory map, unacceptable for a database index holding millions of records on disk. Dynamic hashing grows a table one bucket at a time instead. Extendible hashing keeps a directory of pointers and splits a single bucket at a time; linear hashing has no directory at all and splits buckets in a fixed rotation, regardless of which one actually overflowed.",
    howItWorks: [
      "Both schemes address a key by its low bits rather than by a remainder against an arbitrary size: doubling the number of buckets then means looking at exactly one more bit, and a key either stays where it is or moves to one specific new bucket.",
      "Extendible hashing keeps a directory of 2^d pointers, where d is the global depth — the number of bits it indexes on. Each bucket records its own local depth: how many bits that bucket has actually been split on. Several directory entries can point at the same bucket, and a bucket with local depth d' is pointed at by 2^(d − d') of them.",
      "When an extendible bucket overflows it splits in two and its keys are redealt by the next bit. If its local depth was below the global depth, the directory already has spare entries to re-aim and nothing else changes. Only when the two are equal must the directory itself double — which costs a copy of the directory, not of the data.",
      "Linear hashing drops the directory and keeps two numbers: the level L, giving the base hash h_L(k) = k mod N·2^L, and a split pointer. A bucket the pointer has already passed has been rehashed to the next level, so it answers to h_(L+1) instead — one comparison decides which hash to apply.",
      "The defining trick is that the bucket that splits is the one the pointer is on, not the one that overflowed. An overflowing bucket chains its extra keys into an overflow block and waits its turn. Splits are triggered by the overall load factor, so growth is spread evenly instead of chasing whichever bucket is currently unlucky.",
      "When the split pointer has been all the way round, every bucket has been rehashed, the level goes up, and the pointer restarts at bucket 0 — the table has doubled without any single operation costing more than one bucket split.",
    ],
    useCases: [
      "Database and file-system indexes, where the table lives on disk and a full rehash would mean rewriting the entire index file.",
      "Any table that must stay responsive while it grows: no single insert pays more than the cost of splitting one bucket.",
      "Extendible hashing where lookups must be exactly one bucket read and the directory is small enough to keep in memory; linear hashing where even that directory is unwelcome, or where it would be a contention point between concurrent writers.",
    ],
    advantages: [
      "Growth is incremental. There is no O(n) rehashing pause, so worst-case insert latency stays flat as the table fills.",
      "Extendible hashing guarantees a lookup in one bucket access after the directory read, no matter how skewed the keys are.",
      "Linear hashing needs no directory at all — just a level and a pointer — so it costs nothing in space and has no structure that all writers have to share.",
    ],
    disadvantages: [
      "Extendible hashing's directory doubles when a bucket at the global depth splits, and a badly skewed set of keys can make it much larger than the data warrants.",
      "Linear hashing tolerates overflow chains by design, so a lookup can degrade to walking one — the price of splitting in rotation rather than where the pressure actually is.",
      "Both are more code than a plain table with a resize, and neither is worth it until a rehash of everything is genuinely too expensive to accept.",
    ],
  },

  graph: {
    overview:
      "A graph is a collection of vertices (nodes) connected by edges, capable of modeling relationships that are far more flexible than the strictly linear or hierarchical connections in lists and trees. Edges can be directed or undirected, and weighted or unweighted, depending on what the relationship represents.",
    howItWorks: [
      "Vertices represent entities (cities, people, web pages, etc.) and edges represent relationships or connections between them.",
      "A directed graph's edges point one way (A → B doesn't imply B → A); an undirected graph's edges go both ways.",
      "A weighted graph attaches a cost or distance to each edge, used by algorithms like Dijkstra's shortest path.",
      "Graphs are commonly stored as an adjacency list (each vertex keeps a list of its neighbors) or an adjacency matrix (an n×n grid marking which vertices are connected).",
      "Traversal algorithms like BFS and DFS, and shortest-path algorithms like Dijkstra's, explore the graph by visiting vertices along its edges.",
    ],
    useCases: [
      "Modeling networks: social connections, road maps, computer networks, and the web's hyperlink structure.",
      "Finding shortest paths (GPS navigation, network routing) with algorithms like Dijkstra's or Floyd-Warshall.",
      "Scheduling tasks with dependencies using topological sort on a directed acyclic graph (DAG).",
      "Building minimum spanning trees (Prim's, Kruskal's) to connect all nodes at the lowest total cost, e.g. designing efficient wiring or network layouts.",
    ],
    advantages: [
      "Extremely flexible — can represent virtually any kind of relationship between entities, not just linear or hierarchical ones.",
      "An adjacency list uses only O(V + E) space, making it efficient for sparse graphs.",
      "A rich family of well-studied algorithms exists for traversal, shortest paths, connectivity, and optimization.",
    ],
    disadvantages: [
      "An adjacency matrix uses O(V²) space regardless of how many edges actually exist, which is wasteful for sparse graphs.",
      "Many graph algorithms (e.g. all-pairs shortest paths) are computationally expensive on large graphs.",
      "Detecting structural properties like cycles or connectivity requires careful traversal logic to avoid revisiting nodes forever.",
    ],
  },

  // The tree view offers seven types, and they are different structures rather
  // than settings on one — so the panel is keyed `tree:<type>` and each gets
  // its own write-up. A single entry here used to serve all seven, which meant
  // selecting AVL or a treap and reading about a BST.
  "tree:binary": {
    overview:
      "A binary tree is the shape without the rule: nodes, each with up to two children, one root, no cycles — and nothing at all about what goes where. That sounds like less than a binary search tree, and it is, but it is the honest starting point, because it makes clear which properties come from the shape and which come from the ordering. Nothing here can be searched by comparison: with no relationship between a node and its children, a comparison at a node tells you nothing about which way to go, so finding a value means looking at every node. What the shape alone still gives you is the traversals, the level structure, and a compact array representation when the tree is complete — which is exactly the subset a binary heap is built on.",
    howItWorks: [
      "Each node holds a value and up to two children, a left and a right. That is the whole definition.",
      "Insert has no ordering to follow, so this view scans level by level, as a queue would, and drops the value into the first free child slot. That keeps the tree complete — the property that matters when there is no ordering to keep instead.",
      "Search has to scan every node, breadth-first here, because no comparison narrows anything down. O(n), and this is precisely the cost a BST's ordering rule buys you out of.",
      "Delete finds the value by scanning, then replaces it with the deepest, rightmost node in level order and drops that — the only removal that leaves the tree complete. It is the same move a binary heap makes, for the same reason.",
      "The four traversals still work and are the reason the structure is worth having: in-order, pre-order and post-order differ only in when the node is visited relative to its subtrees, and level order (BFS) reads the tree a row at a time.",
      "A complete binary tree needs no pointers at all: store it in an array and index i's children live at 2i+1 and 2i+2. That is the representation the heap view uses.",
    ],
    useCases: [
      "Expression trees, where the shape is the parse and the ordering rule would be meaningless — an operator's children are its operands, not smaller and larger values.",
      "Binary heaps, which take the complete-shape half of a binary tree and add a heap-order rule instead of a search-order one.",
      "Huffman trees, whose shape encodes the code lengths and where the leaves, not the ordering, carry the meaning.",
      "Any hierarchy that is genuinely just a hierarchy: a decision tree, a tournament bracket, a syntax tree.",
    ],
    advantages: [
      "No invariant to maintain, so insert and delete never rebalance and never rotate.",
      "The traversals and the level structure are available without any ordering rule at all.",
      "A complete binary tree stores in a flat array with no pointer overhead and perfect locality.",
    ],
    disadvantages: [
      "Search, insert-by-value and delete-by-value are all O(n), because nothing prunes the search.",
      "No sorted iteration: in-order traversal of an unordered binary tree yields no useful order.",
      "It is a foundation rather than a working collection — almost every practical use adds a rule on top, which is what the other six types here are.",
    ],
  },

  "tree:bst": {
    overview:
      "A binary search tree adds one rule to a binary tree, and gets almost everything from it: every node's left subtree holds smaller values, its right subtree larger ones. That single invariant turns a comparison at a node into a decision — go left or go right — and so turns a scan of n nodes into a walk down one path. Search, insert and delete all become O(h) where h is the height, and in-order traversal comes out sorted for free. The catch is the whole reason the other five types exist: nothing in a plain BST keeps h small. The shape is a fossil of the insertion order, and keys arriving in sorted order build a linked list.",
    howItWorks: [
      "Each node holds a value and up to two children — a left child and a right child.",
      "To insert a value, compare it to the current node: go left if smaller, right if larger, and repeat until an empty spot is found. Nothing happens on the way back up.",
      "Searching follows the same left/right comparisons, discarding one subtree at every step.",
      "In-order traversal (left, node, right) visits every value in sorted order; pre-order and post-order visit the root before or after its subtrees, which is useful for copying or deleting a tree.",
      "Deleting a leaf just removes it, and a node with one child is replaced by that child. A node with two children is the interesting case: its value is overwritten with its in-order successor — the minimum of its right subtree — and that successor is deleted instead, because it has at most one child by construction.",
      "Always taking the successor rather than alternating with the predecessor is a small asymmetry with a visible consequence: repeated deletions drift the tree leftward over time.",
    ],
    useCases: [
      "Maintaining a dynamically sorted collection that supports fast search, insert and delete.",
      "Implementing symbol tables, indexes and priority-based lookup structures.",
      "Range queries — finding all values between two bounds by pruning subtrees that fall entirely outside the range, which a hash table cannot do at all.",
      "Teaching the idea every balanced tree here is a repair of: that the ordering rule gives you the log and the shape is what you have to fight for.",
    ],
    advantages: [
      "Search, insert and delete are O(log n) on a balanced tree, and the code is short enough to write from memory.",
      "In-order traversal yields every element in sorted order with no separate sorting step.",
      "Supports the ordered queries a hash table cannot: predecessor, successor, minimum, maximum and range.",
      "No balance metadata per node — no heights, colours or priorities — so a node is just a value and two pointers.",
    ],
    disadvantages: [
      "The height is unbounded. Inserting already-sorted data builds a linked list and every operation degrades to O(n), which is the classic trigger and easy to hit by accident.",
      "Nothing self-corrects: a BST that has become lopsided stays lopsided until it is rebuilt.",
      "More memory per node than an array, and poor cache locality, since nodes can be anywhere in memory.",
      "Deletion is the fiddly operation, and the successor rule is where most hand-written implementations go wrong.",
    ],
  },

  "tree:avl": {
    overview:
      "An AVL tree is a binary search tree that refuses to get tall. Every node stores its balance factor — height(left) − height(right) — and the tree maintains the invariant that it is always −1, 0 or +1. When an insert or delete breaks that at some node, one or two rotations restore it, and rotations preserve the in-order sequence exactly, which is why they are safe: the tree changes shape without changing what it holds. The payoff is a hard guarantee rather than an average — the height stays under about 1.44 log₂ n for any insertion order, so no input can degrade it. It was the first self-balancing tree, from 1962, and it is still the strictest of the ones in common use.",
    howItWorks: [
      "Insert as in a BST, then walk back up the path recomputing each ancestor's balance factor. If one falls outside [−1, 1], rotate at the lowest such node.",
      "There are four cases, distinguished by which direction the imbalance leans over two levels: left-left and right-right need a single rotation, left-right and right-left need a double, which is the same single rotation applied twice at different nodes.",
      "An insert needs at most one rotation, ever. Fixing the lowest unbalanced node restores every height above it, so the walk can stop there.",
      "A delete may need a rotation at every level on the way up. That asymmetry surprises people: a rotation can leave the subtree it fixed one level shorter, which is a fresh imbalance for the node above it.",
      "The balance factor is stored, not recomputed — a node keeps its own height, so checking balance is one subtraction rather than a subtree walk.",
      "A search never rebalances. It is a read and it changes nothing; the rotations exist only to bound the walk it does.",
    ],
    useCases: [
      "Workloads dominated by lookups, where the stricter balance of an AVL tree beats a red-black tree's looser bound.",
      "In-memory databases and language runtimes that need a worst-case guarantee rather than an amortised or expected one.",
      "Any ordered collection fed data that might arrive sorted — the case that destroys a plain BST and leaves an AVL tree unmoved.",
      "As the reference point for what balancing costs: it is the tree to compare a red-black tree, a treap and a splay tree against.",
    ],
    advantages: [
      "Worst-case O(log n) for search, insert and delete, guaranteed for every input order.",
      "Height under about 1.44 log₂ n — the tightest bound of the self-balancing trees here, so searches are the shortest.",
      "Rotations are local and constant-time, and they preserve the in-order sequence, so correctness is easy to reason about.",
    ],
    disadvantages: [
      "More rotations on update than a red-black tree, because the invariant is stricter — so it is the wrong choice for a write-heavy workload.",
      "Every node carries a height or balance factor, which a plain BST does not.",
      "Deletion can rotate at every level, making it noticeably more expensive than insertion.",
      "The four rotation cases are where implementations go wrong, and the double rotations in particular are easy to get backwards.",
    ],
  },

  "tree:threaded": {
    overview:
      "A threaded binary tree is a BST that stops wasting its null pointers. In a tree of n nodes there are 2n child pointers and n + 1 of them are null — more than half. A threaded tree reuses each of those as a thread pointing at the node's in-order neighbour, so the links that recursion would have kept on a stack are stored in the tree itself. In-order traversal then becomes iterative, stack-free and O(1) in space, and finding a node's successor becomes a single hop rather than a walk. It costs nothing in memory, because the pointers were already there and holding nothing.",
    howItWorks: [
      "A null right pointer becomes a link to the in-order successor. In a fully (double) threaded tree, a null left pointer becomes a link to the in-order predecessor; with single (right) threading, only the right ones are used.",
      "Because a thread and a real child live in the same field, each node carries a flag per pointer — lthread / rthread — saying which it is. Every dereference checks the flag first.",
      "The first and last nodes in in-order have no neighbour to point at, so their threads go to a dummy header node instead of being null.",
      "Traversal: visit a node, then follow its right thread in one hop, or, if it has a real right child, take the leftmost node of that subtree. No stack, no recursion, no allocation.",
      "Insert works as in a BST, then repairs threads: the parent's thread on the side the new node landed becomes a real child link, and the new leaf takes over the thread to the neighbour that pointer used to reach.",
      "Delete closes a gap in the in-order sequence, so the threads running through the removed node are relinked to point straight at its two neighbours.",
      "Threads are not used by a search — a search runs in tree order and threads run in in-order — and they cost it nothing either way.",
    ],
    useCases: [
      "Traversal-heavy, update-light trees, which is the trade threading is for: it makes iteration cheaper and every modification more expensive.",
      "Embedded and real-time code, where iterating with no stack means no recursion depth to blow and no allocation to fail.",
      "Iterators and generators that must hand back one value at a time and be re-entrant — the traversal state is a single node pointer.",
      "Answering successor and predecessor queries in O(1) from a node with no child on that side.",
    ],
    advantages: [
      "In-order traversal in O(1) space with no stack and no recursion.",
      "Successor and predecessor in one hop from a node that would otherwise need a walk back up.",
      "Costs no extra memory for the links themselves — the null pointers were already allocated and unused.",
      "Traversal can start from any node, not only the root, since the sequence is stored in the tree.",
    ],
    disadvantages: [
      "Every insert and delete has to relink neighbours' threads as well as child pointers, so updates are more expensive and more error-prone.",
      "Every pointer dereference has to check a flag first, which costs a branch on the hottest path in the structure.",
      "The flags do take space — two bits per node — even though the pointers do not.",
      "It adds nothing to search, and nothing to balance: a threaded tree can still be a linked list.",
    ],
  },

  "tree:redblack": {
    overview:
      "A red-black tree balances by colour rather than by height. Every node is red or black, the root and the leaves are black, no red node has a red parent, and every root-to-leaf path holds the same number of black nodes. Those four rules pin the height under 2 log₂(n+1) — looser than an AVL tree's bound — and in exchange they can be restored with a *constant* number of rotations per update, mostly by recolouring instead of restructuring. That trade is why red-black trees, not AVL trees, are what standard libraries ship: an update touches O(log n) colours but at most three pointers, which matters when the nodes are large or shared.",
    howItWorks: [
      "The invariants: every node is red or black; the root is black; a red node's children are both black (no two reds adjacent); and every path from a node down to a null holds the same number of black nodes — its black-height.",
      "Insert puts the new node in as *red*, which cannot change any path's black-height. So only one rule can break: red with a red parent.",
      "The insert fix-up is a loop. If the parent's sibling is also red, recolour the three of them and push the violation two levels up; if it is black, one or two rotations settle it and the loop ends. At most two rotations, ever.",
      "Delete is the hard direction. Removing a black node leaves one path a black short, and that deficit has to be repaired rather than absorbed — which is the reason red-black deletion has its reputation.",
      "The delete fix-up pushes the deficit upward through recolourings, borrowing blackness from a sibling by rotation where it can and merging where it cannot, until it reaches the root and vanishes. At most three rotations.",
      "Search ignores colours entirely. They exist only to bound the height of the walk.",
      "A red-black tree is a 2-3-4 tree in disguise: a black node with its red children is a multi-way node, and the colour rules are the B-tree split rules rewritten for binary nodes.",
    ],
    useCases: [
      "Essentially every standard library's ordered map and set — C++ std::map and std::set, Java TreeMap and TreeSet, and the ordered containers in .NET.",
      "The Linux kernel, which uses them for process scheduling (the completely fair scheduler), virtual memory areas and epoll interest lists.",
      "Persistent and functional data structures, where the small constant number of rotations per update means fewer nodes to copy.",
      "Database and filesystem indexes where updates and lookups are both frequent and neither may be allowed a bad worst case.",
    ],
    advantages: [
      "Worst-case O(log n) for all operations, with a constant number of rotations per insert or delete.",
      "Cheaper updates than an AVL tree, which is what makes it the default choice for a general-purpose ordered container.",
      "One bit of metadata per node, against a whole integer for an AVL tree's height.",
      "Well suited to persistent versions, since an update restructures very little of the tree.",
    ],
    disadvantages: [
      "Taller than an AVL tree — up to 2 log₂ n against 1.44 log₂ n — so lookups are slower on a read-heavy workload.",
      "By far the most intricate of these to implement: the delete fix-up has several cases and is where almost all bugs live.",
      "The invariants are not local in an obvious way, so it is hard to reason about a red-black tree by looking at part of it.",
      "No better than any other balanced BST at what balanced BSTs are bad at: cache locality, and bulk sequential access.",
    ],
  },

  "tree:splay": {
    overview:
      "A splay tree keeps no balance information at all — no heights, no colours, no priorities — and makes no promise about any single operation, which can be O(n). What it promises is that any sequence of m operations costs O(m log n), and the mechanism is one idea: every access rotates the node it touched all the way to the root. So the tree reshapes itself around the access pattern. Search for the same key twice and the second is nearly free; work over a small hot set and that set migrates to the top and stays there. It is the only tree here that changes shape when you merely read it, and the only one whose guarantee is amortised rather than worst-case.",
    howItWorks: [
      "Splaying moves a node to the root by repeated rotations, in three cases named for the shape of the path: zig (the node's parent is the root, one rotation), zig-zig (node and parent lean the same way, rotate the grandparent first), and zig-zag (they lean opposite ways, rotate the parent first).",
      "The zig-zig case is the one that matters. Rotating the grandparent first roughly halves the depth of everything along the path, which is what makes the amortised bound work; rotating bottom-up naively does not and gives no such guarantee.",
      "Search walks down as in a BST and then splays the node it found — so a read restructures the tree. Search the same value twice in this view and watch the second run.",
      "Insert places the node as in a BST and then splays it to the root.",
      "Delete splays the target to the root first, which makes the removal trivial since the root has no parent to repair, and then joins the two subtrees left behind.",
      "There is nothing to store and nothing to check: a node is a value and two pointers, exactly as in a plain BST. All the machinery is in the rotations.",
    ],
    useCases: [
      "Caches and working-set workloads, where a small fraction of the keys take most of the accesses — the structure adapts to that for free, which no balanced tree does.",
      "Network routers and memory allocators, where the same few entries are hit repeatedly and the access pattern shifts over time.",
      "As the canonical example of amortised analysis and of self-adjusting structures — the potential-function argument for splay trees is where most people first meet the technique.",
      "Link-cut trees and other advanced structures that use splay trees as their underlying representation.",
    ],
    advantages: [
      "Amortised O(log n) with no stored balance information whatsoever — the simplest node of any self-balancing tree here.",
      "Adapts to the access pattern automatically, and provably comes within a constant factor of the best possible static tree for any sequence.",
      "Recently used keys are near the root, which is exactly what a cache wants and what a balanced tree will not give you.",
      "Insert, delete, join and split are all expressed in terms of one primitive.",
    ],
    disadvantages: [
      "A single operation can be O(n). Only the total over a sequence is bounded, which rules it out where individual latency matters.",
      "It mutates on read, so it cannot be shared between threads without a lock, and a read-only traversal is not read-only.",
      "Uniformly random access patterns get no benefit from the adaptation and pay the rotations anyway.",
      "The constant factors are worse than a balanced tree's, because every access rotates all the way up.",
    ],
  },

  "tree:treap": {
    overview:
      "A treap gets its balance from randomness instead of from bookkeeping. Every node is given a random priority when it is created, and the tree is maintained as two structures at once: a binary search tree by key, and a heap by priority. Those two constraints together determine the shape uniquely — and since the priorities are random, the shape is that of a BST built from a random insertion order, whose expected height is about 1.39 log₂ n. So no input order can make a treap tall, because the shape does not depend on the input order at all. It is the shortest self-balancing tree to implement, and the only one whose guarantee is probabilistic.",
    howItWorks: [
      "Each node holds a key and a random priority. The keys obey the BST rule; the priorities obey the heap rule, so a node's priority beats both its children's.",
      "Insert places the node by key as in a BST, then rotates it upward while its priority beats its parent's. The rotations preserve the BST ordering and fix the heap order.",
      "Delete is the insert run backwards: rotate the node downward, always toward whichever child has the stronger priority, until it is a leaf, then drop it. No case analysis for one child versus two — which is why treap deletion is so much shorter than a BST's.",
      "Search is an ordinary BST walk. Priorities decide shape, not descent, so they play no part in a lookup.",
      "The two constraints determine the tree uniquely: for a given set of (key, priority) pairs there is exactly one treap. The insertion order is irrelevant, which is the whole source of the guarantee.",
      "Split and join are the treap's other trick: both fall out of the rotations, which makes treaps the usual choice for problems needing a sequence split and rejoined by position.",
    ],
    useCases: [
      "Randomised balanced search trees where implementation simplicity matters more than a hard worst-case bound.",
      "Problems that need to split a sequence and rejoin it — implicit treaps keyed by position are a standard competitive-programming tool for exactly this.",
      "Distributed and concurrent settings, where deriving the priority from a hash of the key makes the tree's shape reproducible across machines without coordination.",
      "As the clearest demonstration that randomisation can replace balance bookkeeping entirely.",
    ],
    advantages: [
      "Expected O(log n) for every operation, with no input order able to break it.",
      "Much shorter to implement than AVL or red-black — delete in particular has no case analysis at all.",
      "Split and join in expected O(log n), which AVL and red-black trees do not give you easily.",
      "The shape depends only on the (key, priority) pairs, not on the insertion order, so it is reproducible.",
    ],
    disadvantages: [
      "The bound is expected, not worst-case: an unlucky draw of priorities can make a treap tall, and there is no bad *input*, only bad luck.",
      "Needs a source of randomness, and a poor one undermines the whole guarantee.",
      "An extra priority stored per node — more than a red-black tree's single bit.",
      "Taller on average than an AVL tree, so lookups are slightly longer.",
    ],
  },

  twothree: {
    overview:
      "A 2-3 tree is a self-balancing search tree where every node is either a 2-node (one value, two children) or a 3-node (two values, three children), and every leaf sits at exactly the same depth. Instead of rebalancing after every operation like a red-black tree, a 2-3 tree keeps itself balanced by growing upward — splitting nodes when they overflow and merging them when they underflow.",
    howItWorks: [
      "A 2-node holds one value with a left child (smaller values) and a right child (larger values), just like a BST node.",
      "A 3-node holds two values with three children, splitting the range into 'less than the first value', 'between the two values', and 'greater than the second value'.",
      "Inserting a value into a full 3-node causes it to split into two 2-nodes, pushing the middle value up into the parent — if the parent overflows too, the split cascades upward, and the tree only grows taller at the root.",
      "Deleting a value may leave a node under-full, which triggers borrowing a value from a sibling or merging with one, again potentially cascading up toward the root.",
      "Because splits and merges always happen at the same depth for every leaf, the tree remains perfectly height-balanced after every operation.",
    ],
    useCases: [
      "The conceptual foundation for B-trees, which generalize the same split/merge balancing idea to database and filesystem indexes.",
      "Any application needing guaranteed O(log n) search, insert, and delete without the risk of the skewed, unbalanced trees a plain BST can produce.",
      "Teaching the mechanics behind self-balancing trees before moving on to more complex variants like red-black trees or B-trees.",
    ],
    advantages: [
      "Guaranteed O(log n) search, insert, and delete — the tree can never degrade into a linked-list shape.",
      "Perfectly balanced by construction: every leaf is at the same depth, unlike a BST which can become lopsided.",
      "Growth happens at the root (splitting upward) rather than requiring separate rebalancing passes.",
    ],
    disadvantages: [
      "More complex to implement than a standard BST due to the extra logic for splitting and merging nodes.",
      "3-nodes require more memory per node (two values, three child pointers) than a simple binary node.",
      "Less commonly used directly in practice — most real systems use the closely related red-black tree or B-tree instead.",
    ],
  },
};
