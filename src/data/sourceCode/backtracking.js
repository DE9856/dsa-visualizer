/**
 * Backtracking implementations, tagged with the line of the search procedure
 * each source line implements — see `./index.js` for how the `@@n` markers
 * are read. Every one of them is the same shape: choose, check, recurse,
 * undo. The undo is the line worth watching.
 */
export default {
  queens: {
    c: `
/* Only one queen per row is ever tried, so a "position" is just which column
   each row's queen sits in — the row constraint is enforced by the shape of
   the search rather than by a check. */
static int col[32];

static int attacked(int row, int c) {
    for (int r = 0; r < row; r++)
        if (col[r] == c || row - r == abs(c - col[r])) return 1;
    return 0;
}

static int solutions = 0;

void place(int row, int n) {@@0
    if (row == n) {@@1
        solutions++;@@1
        return;@@1
    }

    for (int c = 0; c < n; c++) {@@2
        if (attacked(row, c)) continue;@@3

        col[row] = c;@@4
        place(row + 1, n);@@5
        col[row] = -1;@@6
    }
}`,
    cpp: `
// Only one queen per row is ever tried, so a "position" is just which column
// each row's queen sits in — the row constraint is enforced by the shape of
// the search rather than by a check.
std::vector<int> col;
int solutions = 0;

static bool attacked(int row, int c) {
    for (int r = 0; r < row; ++r)
        if (col[r] == c || row - r == std::abs(c - col[r])) return true;
    return false;
}

void place(int row, int n) {@@0
    if (row == n) {@@1
        ++solutions;@@1
        return;@@1
    }

    for (int c = 0; c < n; ++c) {@@2
        if (attacked(row, c)) continue;@@3

        col[row] = c;@@4
        place(row + 1, n);@@5
        col[row] = -1;@@6
    }
}`,
    java: `
// Only one queen per row is ever tried, so a "position" is just which column
// each row's queen sits in — the row constraint is enforced by the shape of
// the search rather than by a check.
static int[] col;
static int solutions = 0;

static boolean attacked(int row, int c) {
    for (int r = 0; r < row; r++)
        if (col[r] == c || row - r == Math.abs(c - col[r])) return true;
    return false;
}

static void place(int row, int n) {@@0
    if (row == n) {@@1
        solutions++;@@1
        return;@@1
    }

    for (int c = 0; c < n; c++) {@@2
        if (attacked(row, c)) continue;@@3

        col[row] = c;@@4
        place(row + 1, n);@@5
        col[row] = -1;@@6
    }
}`,
    python: `
def solve_n_queens(n):
    """Only one queen per row is ever tried, so a position is just which column
    each row's queen sits in — the row constraint is enforced by the shape of
    the search rather than by a check."""
    col = [-1] * n
    solutions = []

    def attacked(row, c):
        return any(col[r] == c or row - r == abs(c - col[r]) for r in range(row))

    def place(row):@@0
        if row == n:@@1
            solutions.append(list(col))@@1
            return@@1

        for c in range(n):@@2
            if attacked(row, c):@@3
                continue@@3

            col[row] = c@@4
            place(row + 1)@@5
            col[row] = -1@@6

    place(0)
    return solutions`,
    javascript: `
// Only one queen per row is ever tried, so a "position" is just which column
// each row's queen sits in — the row constraint is enforced by the shape of
// the search rather than by a check.
function solveNQueens(n) {
  const col = new Array(n).fill(-1);
  const solutions = [];

  const attacked = (row, c) => {
    for (let r = 0; r < row; r++)
      if (col[r] === c || row - r === Math.abs(c - col[r])) return true;
    return false;
  };

  function place(row) {@@0
    if (row === n) {@@1
      solutions.push([...col]);@@1
      return;@@1
    }

    for (let c = 0; c < n; c++) {@@2
      if (attacked(row, c)) continue;@@3

      col[row] = c;@@4
      place(row + 1);@@5
      col[row] = -1;@@6
    }
  }

  place(0);
  return solutions;
}`,
  },

  sudoku: {
    c: `
/* The last line is the one that matters: returning false does not mean the
   puzzle is unsolvable, it means the mistake is further up the call stack. */
static int grid[9][9];

static int conflicts(int r, int c, int d) {
    int br = r - r % 3, bc = c - c % 3;
    for (int i = 0; i < 9; i++)
        if (grid[r][i] == d || grid[i][c] == d || grid[br + i / 3][bc + i % 3] == d)
            return 1;
    return 0;
}

int solve(void) {@@0
    int row = -1, col = -1;
    for (int r = 0; r < 9 && row < 0; r++)@@1
        for (int c = 0; c < 9; c++)@@1
            if (grid[r][c] == 0) { row = r; col = c; break; }@@1

    if (row < 0) return 1;@@2

    for (int d = 1; d <= 9; d++) {@@3
        if (conflicts(row, col, d)) continue;@@4

        grid[row][col] = d;@@5
        if (solve()) return 1;@@6
        grid[row][col] = 0;@@7
    }
    return 0;@@8
}`,
    cpp: `
// The last line is the one that matters: returning false does not mean the
// puzzle is unsolvable, it means the mistake is further up the call stack.
int grid[9][9];

static bool conflicts(int r, int c, int d) {
    int br = r - r % 3, bc = c - c % 3;
    for (int i = 0; i < 9; ++i)
        if (grid[r][i] == d || grid[i][c] == d || grid[br + i / 3][bc + i % 3] == d)
            return true;
    return false;
}

bool solve() {@@0
    int row = -1, col = -1;
    for (int r = 0; r < 9 && row < 0; ++r)@@1
        for (int c = 0; c < 9; ++c)@@1
            if (grid[r][c] == 0) { row = r; col = c; break; }@@1

    if (row < 0) return true;@@2

    for (int d = 1; d <= 9; ++d) {@@3
        if (conflicts(row, col, d)) continue;@@4

        grid[row][col] = d;@@5
        if (solve()) return true;@@6
        grid[row][col] = 0;@@7
    }
    return false;@@8
}`,
    java: `
// The last line is the one that matters: returning false does not mean the
// puzzle is unsolvable, it means the mistake is further up the call stack.
static int[][] grid = new int[9][9];

static boolean conflicts(int r, int c, int d) {
    int br = r - r % 3, bc = c - c % 3;
    for (int i = 0; i < 9; i++)
        if (grid[r][i] == d || grid[i][c] == d || grid[br + i / 3][bc + i % 3] == d)
            return true;
    return false;
}

static boolean solve() {@@0
    int row = -1, col = -1;
    outer:
    for (int r = 0; r < 9; r++)@@1
        for (int c = 0; c < 9; c++)@@1
            if (grid[r][c] == 0) { row = r; col = c; break outer; }@@1

    if (row < 0) return true;@@2

    for (int d = 1; d <= 9; d++) {@@3
        if (conflicts(row, col, d)) continue;@@4

        grid[row][col] = d;@@5
        if (solve()) return true;@@6
        grid[row][col] = 0;@@7
    }
    return false;@@8
}`,
    python: `
def solve_sudoku(grid):
    """The last line is the one that matters: returning False does not mean the
    puzzle is unsolvable, it means the mistake is further up the call stack."""

    def conflicts(r, c, d):
        br, bc = r - r % 3, c - c % 3
        if any(grid[r][i] == d or grid[i][c] == d for i in range(9)):
            return True
        return any(grid[br + i // 3][bc + i % 3] == d for i in range(9))

    def solve():@@0
        cell = None
        for r in range(9):@@1
            for c in range(9):@@1
                if grid[r][c] == 0:@@1
                    cell = (r, c)@@1
                    break
            if cell:
                break

        if cell is None:@@2
            return True@@2
        row, col = cell

        for d in range(1, 10):@@3
            if conflicts(row, col, d):@@4
                continue@@4

            grid[row][col] = d@@5
            if solve():@@6
                return True@@6
            grid[row][col] = 0@@7
        return False@@8

    return solve()`,
    javascript: `
// The last line is the one that matters: returning false does not mean the
// puzzle is unsolvable, it means the mistake is further up the call stack.
function solveSudoku(grid) {
  const conflicts = (r, c, d) => {
    const br = r - (r % 3), bc = c - (c % 3);
    for (let i = 0; i < 9; i++)
      if (grid[r][i] === d || grid[i][c] === d || grid[br + ((i / 3) | 0)][bc + (i % 3)] === d)
        return true;
    return false;
  };

  function solve() {@@0
    let row = -1, col = -1;
    for (let r = 0; r < 9 && row < 0; r++)@@1
      for (let c = 0; c < 9; c++)@@1
        if (grid[r][c] === 0) { row = r; col = c; break; }@@1

    if (row < 0) return true;@@2

    for (let d = 1; d <= 9; d++) {@@3
      if (conflicts(row, col, d)) continue;@@4

      grid[row][col] = d;@@5
      if (solve()) return true;@@6
      grid[row][col] = 0;@@7
    }
    return false;@@8
  }

  return solve();
}`,
  },

  subset: {
    c: `
/* Two prunes, and they are what separate this from brute force. Going over
   the target is final because the numbers are non-negative, and a suffix
   that cannot reach the target is not worth entering at all. */
static int nums[64], n, target;
static int chosen[64], rest[65];   /* rest[i] = nums[i] + ... + nums[n-1] */

void search(int i, int sum) {@@0
    if (sum == target) recordSolution(chosen, i);@@1
    if (i == n) return;@@2

    if (sum + nums[i] <= target) {@@3
        chosen[i] = 1;@@4
        search(i + 1, sum + nums[i]);@@4
        chosen[i] = 0;@@5
    }

    if (sum + rest[i + 1] >= target) {@@6
        search(i + 1, sum);@@7
    }
}`,
    cpp: `
// Two prunes, and they are what separate this from brute force. Going over
// the target is final because the numbers are non-negative, and a suffix
// that cannot reach the target is not worth entering at all.
std::vector<int> nums, chosen, rest;   // rest[i] = nums[i] + ... + nums[n-1]
int target;

void search(int i, int sum) {@@0
    if (sum == target) recordSolution(chosen);@@1
    if (i == (int)nums.size()) return;@@2

    if (sum + nums[i] <= target) {@@3
        chosen.push_back(nums[i]);@@4
        search(i + 1, sum + nums[i]);@@4
        chosen.pop_back();@@5
    }

    if (sum + rest[i + 1] >= target) {@@6
        search(i + 1, sum);@@7
    }
}`,
    java: `
// Two prunes, and they are what separate this from brute force. Going over
// the target is final because the numbers are non-negative, and a suffix
// that cannot reach the target is not worth entering at all.
static int[] nums, rest;      // rest[i] = nums[i] + ... + nums[n-1]
static List<Integer> chosen = new ArrayList<>();
static int target;

static void search(int i, int sum) {@@0
    if (sum == target) recordSolution(chosen);@@1
    if (i == nums.length) return;@@2

    if (sum + nums[i] <= target) {@@3
        chosen.add(nums[i]);@@4
        search(i + 1, sum + nums[i]);@@4
        chosen.remove(chosen.size() - 1);@@5
    }

    if (sum + rest[i + 1] >= target) {@@6
        search(i + 1, sum);@@7
    }
}`,
    python: `
def subset_sum(nums, target):
    """Two prunes, and they are what separate this from brute force. Going over
    the target is final because the numbers are non-negative, and a suffix that
    cannot reach the target is not worth entering at all."""
    n = len(nums)
    # rest[i] is everything from i onwards, so a branch can be tested against
    # the most it could still add.
    rest = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        rest[i] = rest[i + 1] + nums[i]

    chosen, solutions = [], []

    def search(i, total):@@0
        if total == target:@@1
            solutions.append(list(chosen))@@1
        if i == n:@@2
            return@@2

        if total + nums[i] <= target:@@3
            chosen.append(nums[i])@@4
            search(i + 1, total + nums[i])@@4
            chosen.pop()@@5

        if total + rest[i + 1] >= target:@@6
            search(i + 1, total)@@7

    search(0, 0)
    return solutions`,
    javascript: `
// Two prunes, and they are what separate this from brute force. Going over
// the target is final because the numbers are non-negative, and a suffix
// that cannot reach the target is not worth entering at all.
function subsetSum(nums, target) {
  const n = nums.length;
  // rest[i] is everything from i onwards, so a branch can be tested against
  // the most it could still add.
  const rest = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) rest[i] = rest[i + 1] + nums[i];

  const chosen = [], solutions = [];

  function search(i, sum) {@@0
    if (sum === target) solutions.push([...chosen]);@@1
    if (i === n) return;@@2

    if (sum + nums[i] <= target) {@@3
      chosen.push(nums[i]);@@4
      search(i + 1, sum + nums[i]);@@4
      chosen.pop();@@5
    }

    if (sum + rest[i + 1] >= target) {@@6
      search(i + 1, sum);@@7
    }
  }

  search(0, 0);
  return solutions;
}`,
  },

  perms: {
    c: `
/* No constraint at all, so nothing is ever pruned: the search tree *is* the
   answer, and every leaf is a permutation. That is what makes it the useful
   thing to compare the other three against. */
static int values[16], slot[16], used[16], n;

void permute(int k) {@@0
    if (k == n) {@@1
        recordArrangement(slot, n);@@1
        return;@@1
    }

    for (int i = 0; i < n; i++) {@@2
        if (used[i]) continue;@@2

        used[i] = 1;@@3
        slot[k] = values[i];@@3
        permute(k + 1);@@4
        used[i] = 0;@@5
    }
}`,
    cpp: `
// No constraint at all, so nothing is ever pruned: the search tree *is* the
// answer, and every leaf is a permutation. That is what makes it the useful
// thing to compare the other three against.
std::vector<int> values, slot;
std::vector<bool> used;

void permute(int k) {@@0
    int n = values.size();
    if (k == n) {@@1
        recordArrangement(slot);@@1
        return;@@1
    }

    for (int i = 0; i < n; ++i) {@@2
        if (used[i]) continue;@@2

        used[i] = true;@@3
        slot[k] = values[i];@@3
        permute(k + 1);@@4
        used[i] = false;@@5
    }
}`,
    java: `
// No constraint at all, so nothing is ever pruned: the search tree *is* the
// answer, and every leaf is a permutation. That is what makes it the useful
// thing to compare the other three against.
static int[] values, slot;
static boolean[] used;

static void permute(int k) {@@0
    int n = values.length;
    if (k == n) {@@1
        recordArrangement(slot);@@1
        return;@@1
    }

    for (int i = 0; i < n; i++) {@@2
        if (used[i]) continue;@@2

        used[i] = true;@@3
        slot[k] = values[i];@@3
        permute(k + 1);@@4
        used[i] = false;@@5
    }
}`,
    python: `
def permutations(values):
    """No constraint at all, so nothing is ever pruned: the search tree *is*
    the answer, and every leaf is a permutation. That is what makes it the
    useful thing to compare the other three against."""
    n = len(values)
    slot = [None] * n
    used = [False] * n
    out = []

    def permute(k):@@0
        if k == n:@@1
            out.append(list(slot))@@1
            return@@1

        for i in range(n):@@2
            if used[i]:@@2
                continue@@2

            used[i] = True@@3
            slot[k] = values[i]@@3
            permute(k + 1)@@4
            used[i] = False@@5

    permute(0)
    return out`,
    javascript: `
// No constraint at all, so nothing is ever pruned: the search tree *is* the
// answer, and every leaf is a permutation. That is what makes it the useful
// thing to compare the other three against.
function permutations(values) {
  const n = values.length;
  const slot = new Array(n);
  const used = new Array(n).fill(false);
  const out = [];

  function permute(k) {@@0
    if (k === n) {@@1
      out.push([...slot]);@@1
      return;@@1
    }

    for (let i = 0; i < n; i++) {@@2
      if (used[i]) continue;@@2

      used[i] = true;@@3
      slot[k] = values[i];@@3
      permute(k + 1);@@4
      used[i] = false;@@5
    }
  }

  permute(0);
  return out;
}`,
  },
};
