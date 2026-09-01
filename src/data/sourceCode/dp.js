/**
 * Dynamic programming implementations, tagged with the recurrence line each
 * source line implements — see `./index.js` for how the `@@n` markers are
 * read. Each one fills the same table the canvas draws and then walks it
 * backwards, because the table only ever holds the *cost*; the answer itself
 * comes out of the backtrack.
 */
export default {
  lcs: {
    c: `
/* L[i][j] is the answer for the first i characters of A against the first j
   of B, which is what makes the recurrence local: one character pair at a
   time, never the whole string. */
int lcs(const char *A, int n, const char *B, int m, char *out) {
    int L[n + 1][m + 1];

    for (int i = 0; i <= n; i++) L[i][0] = 0;@@0
    for (int j = 0; j <= m; j++) L[0][j] = 0;@@1

    for (int i = 1; i <= n; i++) {@@2
        for (int j = 1; j <= m; j++) {@@2
            if (A[i - 1] == B[j - 1]) {@@3
                L[i][j] = L[i - 1][j - 1] + 1;@@4
            } else {@@5
                L[i][j] = L[i - 1][j] > L[i][j - 1] ? L[i - 1][j] : L[i][j - 1];@@6
            }
        }
    }

    /* Walk back from the last cell: a match came from the diagonal and is
       part of the answer; anything else came from the bigger neighbour. */
    int len = L[n][m], k = len;@@7
    out[k] = 0;@@7
    for (int i = n, j = m; i > 0 && j > 0;) {@@7
        if (A[i - 1] == B[j - 1]) { out[--k] = A[i - 1]; i--; j--; }@@7
        else if (L[i - 1][j] >= L[i][j - 1]) i--;@@7
        else j--;@@7
    }
    return len;@@7
}`,
    cpp: `
// L[i][j] is the answer for the first i characters of A against the first j
// of B, which is what makes the recurrence local: one character pair at a
// time, never the whole string.
std::string lcs(const std::string& A, const std::string& B) {
    int n = A.size(), m = B.size();
    std::vector<std::vector<int>> L(n + 1, std::vector<int>(m + 1));

    for (int i = 0; i <= n; ++i) L[i][0] = 0;@@0
    for (int j = 0; j <= m; ++j) L[0][j] = 0;@@1

    for (int i = 1; i <= n; ++i) {@@2
        for (int j = 1; j <= m; ++j) {@@2
            if (A[i - 1] == B[j - 1]) {@@3
                L[i][j] = L[i - 1][j - 1] + 1;@@4
            } else {@@5
                L[i][j] = std::max(L[i - 1][j], L[i][j - 1]);@@6
            }
        }
    }

    // Walk back from the last cell: a match came from the diagonal and is
    // part of the answer; anything else came from the bigger neighbour.
    std::string out;@@7
    for (int i = n, j = m; i > 0 && j > 0;) {@@7
        if (A[i - 1] == B[j - 1]) { out += A[--i]; --j; }@@7
        else if (L[i - 1][j] >= L[i][j - 1]) --i;@@7
        else --j;@@7
    }
    std::reverse(out.begin(), out.end());@@7
    return out;@@7
}`,
    java: `
// L[i][j] is the answer for the first i characters of A against the first j
// of B, which is what makes the recurrence local: one character pair at a
// time, never the whole string.
static String lcs(String A, String B) {
    int n = A.length(), m = B.length();
    int[][] L = new int[n + 1][m + 1];

    for (int i = 0; i <= n; i++) L[i][0] = 0;@@0
    for (int j = 0; j <= m; j++) L[0][j] = 0;@@1

    for (int i = 1; i <= n; i++) {@@2
        for (int j = 1; j <= m; j++) {@@2
            if (A.charAt(i - 1) == B.charAt(j - 1)) {@@3
                L[i][j] = L[i - 1][j - 1] + 1;@@4
            } else {@@5
                L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);@@6
            }
        }
    }

    // Walk back from the last cell: a match came from the diagonal and is
    // part of the answer; anything else came from the bigger neighbour.
    StringBuilder out = new StringBuilder();@@7
    for (int i = n, j = m; i > 0 && j > 0;) {@@7
        if (A.charAt(i - 1) == B.charAt(j - 1)) { out.append(A.charAt(--i)); j--; }@@7
        else if (L[i - 1][j] >= L[i][j - 1]) i--;@@7
        else j--;@@7
    }
    return out.reverse().toString();@@7
}`,
    python: `
def lcs(a, b):
    """L[i][j] is the answer for the first i characters of a against the first
    j of b, which is what makes the recurrence local: one character pair at a
    time, never the whole string."""
    n, m = len(a), len(b)
    L = [[0] * (m + 1) for _ in range(n + 1)]

    for i in range(n + 1):@@0
        L[i][0] = 0@@0
    for j in range(m + 1):@@1
        L[0][j] = 0@@1

    for i in range(1, n + 1):@@2
        for j in range(1, m + 1):@@2
            if a[i - 1] == b[j - 1]:@@3
                L[i][j] = L[i - 1][j - 1] + 1@@4
            else:@@5
                L[i][j] = max(L[i - 1][j], L[i][j - 1])@@6

    # Walk back from the last cell: a match came from the diagonal and is
    # part of the answer; anything else came from the bigger neighbour.
    out = []@@7
    i, j = n, m@@7
    while i > 0 and j > 0:@@7
        if a[i - 1] == b[j - 1]:@@7
            out.append(a[i - 1])@@7
            i, j = i - 1, j - 1@@7
        elif L[i - 1][j] >= L[i][j - 1]:@@7
            i -= 1@@7
        else:@@7
            j -= 1@@7
    return "".join(reversed(out))@@7`,
    javascript: `
// L[i][j] is the answer for the first i characters of A against the first j
// of B, which is what makes the recurrence local: one character pair at a
// time, never the whole string.
function lcs(A, B) {
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) L[i][0] = 0;@@0
  for (let j = 0; j <= m; j++) L[0][j] = 0;@@1

  for (let i = 1; i <= n; i++) {@@2
    for (let j = 1; j <= m; j++) {@@2
      if (A[i - 1] === B[j - 1]) {@@3
        L[i][j] = L[i - 1][j - 1] + 1;@@4
      } else {@@5
        L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);@@6
      }
    }
  }

  // Walk back from the last cell: a match came from the diagonal and is part
  // of the answer; anything else came from the bigger neighbour.
  const out = [];@@7
  let i = n, j = m;@@7
  while (i > 0 && j > 0) {@@7
    if (A[i - 1] === B[j - 1]) { out.push(A[--i]); j--; }@@7
    else if (L[i - 1][j] >= L[i][j - 1]) i--;@@7
    else j--;@@7
  }
  return out.reverse().join("");@@7
}`,
  },

  edit: {
    c: `
/* The same table as the longest common subsequence with the arithmetic
   turned upside down: instead of counting what the strings share, it counts
   what they don't. Which neighbour won is which edit you made. */
int editDistance(const char *A, int n, const char *B, int m) {
    int D[n + 1][m + 1];

    for (int i = 0; i <= n; i++) D[i][0] = i;@@0
    for (int j = 0; j <= m; j++) D[0][j] = j;@@1

    for (int i = 1; i <= n; i++) {@@2
        for (int j = 1; j <= m; j++) {@@2
            if (A[i - 1] == B[j - 1]) {@@3
                D[i][j] = D[i - 1][j - 1];@@4
            } else {@@5
                int sub = D[i - 1][j - 1];@@6
                int del = D[i - 1][j];@@7
                int ins = D[i][j - 1];@@8
                int best = sub < del ? sub : del;
                if (ins < best) best = ins;
                D[i][j] = 1 + best;@@6
            }
        }
    }

    /* The script of edits only comes out of the walk back, not the table. */
    return D[n][m];@@9
}`,
    cpp: `
// The same table as the longest common subsequence with the arithmetic
// turned upside down: instead of counting what the strings share, it counts
// what they don't. Which neighbour won is which edit you made.
int editDistance(const std::string& A, const std::string& B) {
    int n = A.size(), m = B.size();
    std::vector<std::vector<int>> D(n + 1, std::vector<int>(m + 1));

    for (int i = 0; i <= n; ++i) D[i][0] = i;@@0
    for (int j = 0; j <= m; ++j) D[0][j] = j;@@1

    for (int i = 1; i <= n; ++i) {@@2
        for (int j = 1; j <= m; ++j) {@@2
            if (A[i - 1] == B[j - 1]) {@@3
                D[i][j] = D[i - 1][j - 1];@@4
            } else {@@5
                int sub = D[i - 1][j - 1];@@6
                int del = D[i - 1][j];@@7
                int ins = D[i][j - 1];@@8
                D[i][j] = 1 + std::min({sub, del, ins});@@6
            }
        }
    }

    // The script of edits only comes out of the walk back, not the table.
    return D[n][m];@@9
}`,
    java: `
// The same table as the longest common subsequence with the arithmetic
// turned upside down: instead of counting what the strings share, it counts
// what they don't. Which neighbour won is which edit you made.
static int editDistance(String A, String B) {
    int n = A.length(), m = B.length();
    int[][] D = new int[n + 1][m + 1];

    for (int i = 0; i <= n; i++) D[i][0] = i;@@0
    for (int j = 0; j <= m; j++) D[0][j] = j;@@1

    for (int i = 1; i <= n; i++) {@@2
        for (int j = 1; j <= m; j++) {@@2
            if (A.charAt(i - 1) == B.charAt(j - 1)) {@@3
                D[i][j] = D[i - 1][j - 1];@@4
            } else {@@5
                int sub = D[i - 1][j - 1];@@6
                int del = D[i - 1][j];@@7
                int ins = D[i][j - 1];@@8
                D[i][j] = 1 + Math.min(sub, Math.min(del, ins));@@6
            }
        }
    }

    // The script of edits only comes out of the walk back, not the table.
    return D[n][m];@@9
}`,
    python: `
def edit_distance(a, b):
    """The same table as the longest common subsequence with the arithmetic
    turned upside down: instead of counting what the strings share, it counts
    what they don't. Which neighbour won is which edit you made."""
    n, m = len(a), len(b)
    D = [[0] * (m + 1) for _ in range(n + 1)]

    for i in range(n + 1):@@0
        D[i][0] = i@@0
    for j in range(m + 1):@@1
        D[0][j] = j@@1

    for i in range(1, n + 1):@@2
        for j in range(1, m + 1):@@2
            if a[i - 1] == b[j - 1]:@@3
                D[i][j] = D[i - 1][j - 1]@@4
            else:@@5
                sub = D[i - 1][j - 1]@@6
                dele = D[i - 1][j]@@7
                ins = D[i][j - 1]@@8
                D[i][j] = 1 + min(sub, dele, ins)@@6

    # The script of edits only comes out of the walk back, not the table.
    return D[n][m]@@9`,
    javascript: `
// The same table as the longest common subsequence with the arithmetic
// turned upside down: instead of counting what the strings share, it counts
// what they don't. Which neighbour won is which edit you made.
function editDistance(A, B) {
  const n = A.length, m = B.length;
  const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) D[i][0] = i;@@0
  for (let j = 0; j <= m; j++) D[0][j] = j;@@1

  for (let i = 1; i <= n; i++) {@@2
    for (let j = 1; j <= m; j++) {@@2
      if (A[i - 1] === B[j - 1]) {@@3
        D[i][j] = D[i - 1][j - 1];@@4
      } else {@@5
        const sub = D[i - 1][j - 1];@@6
        const del = D[i - 1][j];@@7
        const ins = D[i][j - 1];@@8
        D[i][j] = 1 + Math.min(sub, del, ins);@@6
      }
    }
  }

  // The script of edits only comes out of the walk back, not the table.
  return D[n][m];@@9
}`,
  },

  knapsack: {
    c: `
/* Each item is taken whole or not at all — that is the 0/1, and it is
   exactly what makes the greedy answer wrong: the best value-per-kilo item
   can crowd out a pair that would have fitted better. */
int knapsack(int weight[], int value[], int n, int W, int taken[]) {
    int K[n + 1][W + 1];

    for (int w = 0; w <= W; w++) K[0][w] = 0;@@0

    for (int i = 1; i <= n; i++) {@@1
        for (int w = 0; w <= W; w++) {@@1
            int skip = K[i - 1][w];@@2
            int take = -1;
            if (weight[i - 1] <= w) {@@3
                take = K[i - 1][w - weight[i - 1]] + value[i - 1];@@4
            }
            K[i][w] = take > skip ? take : skip;@@5
        }
    }

    /* Item i was taken exactly when its row differs from the row above. */
    int w = W;@@6
    for (int i = n; i >= 1; i--) {@@6
        taken[i - 1] = K[i][w] != K[i - 1][w];@@6
        if (taken[i - 1]) w -= weight[i - 1];@@6
    }
    return K[n][W];@@6
}`,
    cpp: `
// Each item is taken whole or not at all — that is the 0/1, and it is
// exactly what makes the greedy answer wrong: the best value-per-kilo item
// can crowd out a pair that would have fitted better.
int knapsack(const std::vector<int>& weight, const std::vector<int>& value, int W,
             std::vector<bool>& taken) {
    int n = weight.size();
    std::vector<std::vector<int>> K(n + 1, std::vector<int>(W + 1, 0));

    for (int w = 0; w <= W; ++w) K[0][w] = 0;@@0

    for (int i = 1; i <= n; ++i) {@@1
        for (int w = 0; w <= W; ++w) {@@1
            int skip = K[i - 1][w];@@2
            int take = -1;
            if (weight[i - 1] <= w) {@@3
                take = K[i - 1][w - weight[i - 1]] + value[i - 1];@@4
            }
            K[i][w] = std::max(skip, take);@@5
        }
    }

    // Item i was taken exactly when its row differs from the row above.
    taken.assign(n, false);@@6
    int w = W;@@6
    for (int i = n; i >= 1; --i) {@@6
        taken[i - 1] = K[i][w] != K[i - 1][w];@@6
        if (taken[i - 1]) w -= weight[i - 1];@@6
    }
    return K[n][W];@@6
}`,
    java: `
// Each item is taken whole or not at all — that is the 0/1, and it is
// exactly what makes the greedy answer wrong: the best value-per-kilo item
// can crowd out a pair that would have fitted better.
static int knapsack(int[] weight, int[] value, int W, boolean[] taken) {
    int n = weight.length;
    int[][] K = new int[n + 1][W + 1];

    for (int w = 0; w <= W; w++) K[0][w] = 0;@@0

    for (int i = 1; i <= n; i++) {@@1
        for (int w = 0; w <= W; w++) {@@1
            int skip = K[i - 1][w];@@2
            int take = -1;
            if (weight[i - 1] <= w) {@@3
                take = K[i - 1][w - weight[i - 1]] + value[i - 1];@@4
            }
            K[i][w] = Math.max(skip, take);@@5
        }
    }

    // Item i was taken exactly when its row differs from the row above.
    int w = W;@@6
    for (int i = n; i >= 1; i--) {@@6
        taken[i - 1] = K[i][w] != K[i - 1][w];@@6
        if (taken[i - 1]) w -= weight[i - 1];@@6
    }
    return K[n][W];@@6
}`,
    python: `
def knapsack(weights, values, capacity):
    """Each item is taken whole or not at all — that is the 0/1, and it is
    exactly what makes the greedy answer wrong: the best value-per-kilo item
    can crowd out a pair that would have fitted better."""
    n = len(weights)
    K = [[0] * (capacity + 1) for _ in range(n + 1)]

    for w in range(capacity + 1):@@0
        K[0][w] = 0@@0

    for i in range(1, n + 1):@@1
        for w in range(capacity + 1):@@1
            skip = K[i - 1][w]@@2
            take = -1
            if weights[i - 1] <= w:@@3
                take = K[i - 1][w - weights[i - 1]] + values[i - 1]@@4
            K[i][w] = max(skip, take)@@5

    # Item i was taken exactly when its row differs from the row above.
    taken = [False] * n@@6
    w = capacity@@6
    for i in range(n, 0, -1):@@6
        taken[i - 1] = K[i][w] != K[i - 1][w]@@6
        if taken[i - 1]:@@6
            w -= weights[i - 1]@@6
    return K[n][capacity], taken@@6`,
    javascript: `
// Each item is taken whole or not at all — that is the 0/1, and it is
// exactly what makes the greedy answer wrong: the best value-per-kilo item
// can crowd out a pair that would have fitted better.
function knapsack(weights, values, capacity) {
  const n = weights.length;
  const K = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let w = 0; w <= capacity; w++) K[0][w] = 0;@@0

  for (let i = 1; i <= n; i++) {@@1
    for (let w = 0; w <= capacity; w++) {@@1
      const skip = K[i - 1][w];@@2
      let take = -1;
      if (weights[i - 1] <= w) {@@3
        take = K[i - 1][w - weights[i - 1]] + values[i - 1];@@4
      }
      K[i][w] = Math.max(skip, take);@@5
    }
  }

  // Item i was taken exactly when its row differs from the row above.
  const taken = new Array(n).fill(false);@@6
  let w = capacity;@@6
  for (let i = n; i >= 1; i--) {@@6
    taken[i - 1] = K[i][w] !== K[i - 1][w];@@6
    if (taken[i - 1]) w -= weights[i - 1];@@6
  }
  return { best: K[n][capacity], taken };@@6
}`,
  },

  coins: {
    c: `
/* Almost exactly the knapsack, with one telling difference: taking a coin
   reads from the *same* row rather than the one above, because using a coin
   does not use it up. */
#define INF 1000000

int coinChange(int coin[], int n, int A, int used[]) {
    int C[n + 1][A + 1];

    C[0][0] = 0;@@0
    for (int a = 1; a <= A; a++) C[0][a] = INF;@@0

    for (int i = 1; i <= n; i++) {@@1
        for (int a = 0; a <= A; a++) {@@1
            int without = C[i - 1][a];@@2
            int with = INF;
            if (coin[i - 1] <= a) {@@3
                with = C[i][a - coin[i - 1]] + 1;@@4
            }
            C[i][a] = with < without ? with : without;@@5
        }
    }

    /* Coin i was used exactly when its row differs from the row above. */
    int a = A;@@6
    for (int i = n; i >= 1; i--) {@@6
        used[i - 1] = 0;@@6
        while (a >= 0 && C[i][a] != C[i - 1][a]) { used[i - 1] = 1; a -= coin[i - 1]; }@@6
    }
    return C[n][A] >= INF ? -1 : C[n][A];@@6
}`,
    cpp: `
// Almost exactly the knapsack, with one telling difference: taking a coin
// reads from the *same* row rather than the one above, because using a coin
// does not use it up.
static const int INF = 1000000;

int coinChange(const std::vector<int>& coin, int A) {
    int n = coin.size();
    std::vector<std::vector<int>> C(n + 1, std::vector<int>(A + 1, INF));

    C[0][0] = 0;@@0
    for (int a = 1; a <= A; ++a) C[0][a] = INF;@@0

    for (int i = 1; i <= n; ++i) {@@1
        for (int a = 0; a <= A; ++a) {@@1
            int without = C[i - 1][a];@@2
            int with = INF;
            if (coin[i - 1] <= a) {@@3
                with = C[i][a - coin[i - 1]] + 1;@@4
            }
            C[i][a] = std::min(without, with);@@5
        }
    }

    // Coin i was used exactly when its row differs from the row above.
    return C[n][A] >= INF ? -1 : C[n][A];@@6
}`,
    java: `
// Almost exactly the knapsack, with one telling difference: taking a coin
// reads from the *same* row rather than the one above, because using a coin
// does not use it up.
static final int INF = 1000000;

static int coinChange(int[] coin, int A) {
    int n = coin.length;
    int[][] C = new int[n + 1][A + 1];

    C[0][0] = 0;@@0
    for (int a = 1; a <= A; a++) C[0][a] = INF;@@0

    for (int i = 1; i <= n; i++) {@@1
        for (int a = 0; a <= A; a++) {@@1
            int without = C[i - 1][a];@@2
            int with = INF;
            if (coin[i - 1] <= a) {@@3
                with = C[i][a - coin[i - 1]] + 1;@@4
            }
            C[i][a] = Math.min(without, with);@@5
        }
    }

    // Coin i was used exactly when its row differs from the row above.
    return C[n][A] >= INF ? -1 : C[n][A];@@6
}`,
    python: `
INF = float("inf")


def coin_change(coins, amount):
    """Almost exactly the knapsack, with one telling difference: taking a coin
    reads from the *same* row rather than the one above, because using a coin
    does not use it up."""
    n = len(coins)
    C = [[INF] * (amount + 1) for _ in range(n + 1)]

    C[0][0] = 0@@0
    for a in range(1, amount + 1):@@0
        C[0][a] = INF@@0

    for i in range(1, n + 1):@@1
        for a in range(amount + 1):@@1
            without = C[i - 1][a]@@2
            with_coin = INF
            if coins[i - 1] <= a:@@3
                with_coin = C[i][a - coins[i - 1]] + 1@@4
            C[i][a] = min(without, with_coin)@@5

    # Coin i was used exactly when its row differs from the row above.
    return -1 if C[n][amount] == INF else C[n][amount]@@6`,
    javascript: `
// Almost exactly the knapsack, with one telling difference: taking a coin
// reads from the *same* row rather than the one above, because using a coin
// does not use it up.
const INF = Infinity;

function coinChange(coins, amount) {
  const n = coins.length;
  const C = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(INF));

  C[0][0] = 0;@@0
  for (let a = 1; a <= amount; a++) C[0][a] = INF;@@0

  for (let i = 1; i <= n; i++) {@@1
    for (let a = 0; a <= amount; a++) {@@1
      const without = C[i - 1][a];@@2
      let withCoin = INF;
      if (coins[i - 1] <= a) {@@3
        withCoin = C[i][a - coins[i - 1]] + 1;@@4
      }
      C[i][a] = Math.min(without, withCoin);@@5
    }
  }

  // Coin i was used exactly when its row differs from the row above.
  return C[n][amount] === INF ? -1 : C[n][amount];@@6
}`,
  },

  lis: {
    c: `
/* L[i] is the best subsequence *ending exactly at* i, not the best in the
   whole prefix. That restriction is what makes the recurrence work — and it
   is why the answer is the largest cell anywhere, not the last one. */
int lis(int seq[], int n, int out[]) {
    int L[n], prev[n];

    for (int i = 0; i < n; i++) { L[i] = 1; prev[i] = -1; }@@0

    for (int i = 1; i < n; i++) {@@1
        for (int j = 0; j < i; j++) {@@2
            if (seq[j] < seq[i] && L[j] + 1 > L[i]) {@@3
                L[i] = L[j] + 1;@@4
                prev[i] = j;@@4
            }
        }
    }

    int best = 0;@@5
    for (int i = 1; i < n; i++) if (L[i] > L[best]) best = i;@@5
    int k = L[best];@@5
    for (int i = best; i >= 0; i = prev[i]) out[--k] = seq[i];@@5
    return L[best];@@5
}`,
    cpp: `
// L[i] is the best subsequence *ending exactly at* i, not the best in the
// whole prefix. That restriction is what makes the recurrence work — and it
// is why the answer is the largest cell anywhere, not the last one.
std::vector<int> lis(const std::vector<int>& seq) {
    int n = seq.size();
    std::vector<int> L(n, 1), prev(n, -1);@@0

    for (int i = 1; i < n; ++i) {@@1
        for (int j = 0; j < i; ++j) {@@2
            if (seq[j] < seq[i] && L[j] + 1 > L[i]) {@@3
                L[i] = L[j] + 1;@@4
                prev[i] = j;@@4
            }
        }
    }

    int best = (int)(std::max_element(L.begin(), L.end()) - L.begin());@@5
    std::vector<int> out;@@5
    for (int i = best; i >= 0; i = prev[i]) out.push_back(seq[i]);@@5
    std::reverse(out.begin(), out.end());@@5
    return out;@@5
}`,
    java: `
// L[i] is the best subsequence *ending exactly at* i, not the best in the
// whole prefix. That restriction is what makes the recurrence work — and it
// is why the answer is the largest cell anywhere, not the last one.
static List<Integer> lis(int[] seq) {
    int n = seq.length;
    int[] L = new int[n], prev = new int[n];
    Arrays.fill(L, 1);
    Arrays.fill(prev, -1);@@0

    for (int i = 1; i < n; i++) {@@1
        for (int j = 0; j < i; j++) {@@2
            if (seq[j] < seq[i] && L[j] + 1 > L[i]) {@@3
                L[i] = L[j] + 1;@@4
                prev[i] = j;@@4
            }
        }
    }

    int best = 0;@@5
    for (int i = 1; i < n; i++) if (L[i] > L[best]) best = i;@@5
    LinkedList<Integer> out = new LinkedList<>();@@5
    for (int i = best; i >= 0; i = prev[i]) out.addFirst(seq[i]);@@5
    return out;@@5
}`,
    python: `
def lis(seq):
    """L[i] is the best subsequence *ending exactly at* i, not the best in the
    whole prefix. That restriction is what makes the recurrence work — and it
    is why the answer is the largest cell anywhere, not the last one."""
    n = len(seq)
    L = [1] * n@@0
    prev = [-1] * n@@0

    for i in range(1, n):@@1
        for j in range(i):@@2
            if seq[j] < seq[i] and L[j] + 1 > L[i]:@@3
                L[i] = L[j] + 1@@4
                prev[i] = j@@4

    best = max(range(n), key=lambda i: L[i])@@5
    out = []@@5
    while best >= 0:@@5
        out.append(seq[best])@@5
        best = prev[best]@@5
    return list(reversed(out))@@5`,
    javascript: `
// L[i] is the best subsequence *ending exactly at* i, not the best in the
// whole prefix. That restriction is what makes the recurrence work — and it
// is why the answer is the largest cell anywhere, not the last one.
function lis(seq) {
  const n = seq.length;
  const L = new Array(n).fill(1);@@0
  const prev = new Array(n).fill(-1);@@0

  for (let i = 1; i < n; i++) {@@1
    for (let j = 0; j < i; j++) {@@2
      if (seq[j] < seq[i] && L[j] + 1 > L[i]) {@@3
        L[i] = L[j] + 1;@@4
        prev[i] = j;@@4
      }
    }
  }

  let best = 0;@@5
  for (let i = 1; i < n; i++) if (L[i] > L[best]) best = i;@@5
  const out = [];@@5
  for (let i = best; i >= 0; i = prev[i]) out.push(seq[i]);@@5
  return out.reverse();@@5
}`,
  },

  matrixchain: {
    c: `
/* Matrix multiplication is associative but not equally cheap. m[i][j] is the
   cheapest way to multiply the run from matrix i to matrix j; the table is
   triangular because a run never goes backwards. */
int matrixChainOrder(int d[], int n, int s[][32]) {
    int m[n + 1][n + 1];

    for (int i = 1; i <= n; i++) m[i][i] = 0;@@0

    for (int len = 2; len <= n; len++) {@@1
        for (int i = 1; i <= n - len + 1; i++) {@@2
            int j = i + len - 1;@@2
            m[i][j] = INT_MAX;@@3

            for (int k = i; k < j; k++) {@@4
                int cost = m[i][k] + m[k + 1][j] + d[i - 1] * d[k] * d[j];@@5
                if (cost < m[i][j]) {@@6
                    m[i][j] = cost;@@6
                    s[i][j] = k;@@6
                }
            }
        }
    }
    /* s[i][j] says where to split; printing the brackets is a walk over it. */
    return m[1][n];@@7
}`,
    cpp: `
// Matrix multiplication is associative but not equally cheap. m[i][j] is the
// cheapest way to multiply the run from matrix i to matrix j; the table is
// triangular because a run never goes backwards.
int matrixChainOrder(const std::vector<int>& d,
                     std::vector<std::vector<int>>& s) {
    int n = d.size() - 1;
    std::vector<std::vector<int>> m(n + 1, std::vector<int>(n + 1, 0));
    s.assign(n + 1, std::vector<int>(n + 1, 0));

    for (int i = 1; i <= n; ++i) m[i][i] = 0;@@0

    for (int len = 2; len <= n; ++len) {@@1
        for (int i = 1; i <= n - len + 1; ++i) {@@2
            int j = i + len - 1;@@2
            m[i][j] = INT_MAX;@@3

            for (int k = i; k < j; ++k) {@@4
                int cost = m[i][k] + m[k + 1][j] + d[i - 1] * d[k] * d[j];@@5
                if (cost < m[i][j]) {@@6
                    m[i][j] = cost;@@6
                    s[i][j] = k;@@6
                }
            }
        }
    }
    // s[i][j] says where to split; printing the brackets is a walk over it.
    return m[1][n];@@7
}`,
    java: `
// Matrix multiplication is associative but not equally cheap. m[i][j] is the
// cheapest way to multiply the run from matrix i to matrix j; the table is
// triangular because a run never goes backwards.
static int matrixChainOrder(int[] d, int[][] s) {
    int n = d.length - 1;
    int[][] m = new int[n + 1][n + 1];

    for (int i = 1; i <= n; i++) m[i][i] = 0;@@0

    for (int len = 2; len <= n; len++) {@@1
        for (int i = 1; i <= n - len + 1; i++) {@@2
            int j = i + len - 1;@@2
            m[i][j] = Integer.MAX_VALUE;@@3

            for (int k = i; k < j; k++) {@@4
                int cost = m[i][k] + m[k + 1][j] + d[i - 1] * d[k] * d[j];@@5
                if (cost < m[i][j]) {@@6
                    m[i][j] = cost;@@6
                    s[i][j] = k;@@6
                }
            }
        }
    }
    // s[i][j] says where to split; printing the brackets is a walk over it.
    return m[1][n];@@7
}`,
    python: `
def matrix_chain_order(d):
    """Matrix multiplication is associative but not equally cheap. m[i][j] is
    the cheapest way to multiply the run from matrix i to matrix j; the table
    is triangular because a run never goes backwards."""
    n = len(d) - 1
    m = [[0] * (n + 1) for _ in range(n + 1)]
    s = [[0] * (n + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):@@0
        m[i][i] = 0@@0

    for length in range(2, n + 1):@@1
        for i in range(1, n - length + 2):@@2
            j = i + length - 1@@2
            m[i][j] = float("inf")@@3

            for k in range(i, j):@@4
                cost = m[i][k] + m[k + 1][j] + d[i - 1] * d[k] * d[j]@@5
                if cost < m[i][j]:@@6
                    m[i][j] = cost@@6
                    s[i][j] = k@@6

    # s[i][j] says where to split; printing the brackets is a walk over it.
    return m[1][n], s@@7`,
    javascript: `
// Matrix multiplication is associative but not equally cheap. m[i][j] is the
// cheapest way to multiply the run from matrix i to matrix j; the table is
// triangular because a run never goes backwards.
function matrixChainOrder(d) {
  const n = d.length - 1;
  const m = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const s = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= n; i++) m[i][i] = 0;@@0

  for (let len = 2; len <= n; len++) {@@1
    for (let i = 1; i <= n - len + 1; i++) {@@2
      const j = i + len - 1;@@2
      m[i][j] = Infinity;@@3

      for (let k = i; k < j; k++) {@@4
        const cost = m[i][k] + m[k + 1][j] + d[i - 1] * d[k] * d[j];@@5
        if (cost < m[i][j]) {@@6
          m[i][j] = cost;@@6
          s[i][j] = k;@@6
        }
      }
    }
  }
  // s[i][j] says where to split; printing the brackets is a walk over it.
  return { cost: m[1][n], split: s };@@7
}`,
  },
};
