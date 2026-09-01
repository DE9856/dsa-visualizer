/**
 * String-matching implementations, tagged with the line of the algorithm each
 * source line implements — see `./index.js` for how the `@@n` markers are
 * read.
 */
export default {
  kmp: {
    c: `
/* The failure function is the whole idea: pi[i] is the length of the longest
   proper prefix of the pattern that is also a suffix of P[0..i], so on a
   mismatch the pattern slides by as much as is provably safe and the text
   index never goes backwards. */
void buildFailure(const char *P, int m, int pi[]) {@@0
    pi[0] = 0;@@1
    int k = 0;@@1

    for (int i = 1; i < m; i++) {@@2
        while (k > 0 && P[i] != P[k]) k = pi[k - 1];@@3
        if (P[i] == P[k]) k = k + 1;@@4
        pi[i] = k;@@5
    }
}

void kmpSearch(const char *T, int n, const char *P, int m) {@@6
    int pi[m];
    buildFailure(P, m, pi);

    int j = 0;@@7
    for (int i = 0; i < n; i++) {@@8
        while (j > 0 && T[i] != P[j]) j = pi[j - 1];@@9
        if (T[i] == P[j]) j = j + 1;@@10
        if (j == m) { reportMatch(i - m + 1); j = pi[j - 1]; }@@11
    }
}`,
    cpp: `
// The failure function is the whole idea: pi[i] is the length of the longest
// proper prefix of the pattern that is also a suffix of P[0..i], so on a
// mismatch the pattern slides by as much as is provably safe and the text
// index never goes backwards.
std::vector<int> buildFailure(const std::string& P) {@@0
    std::vector<int> pi(P.size(), 0);
    pi[0] = 0;@@1
    int k = 0;@@1

    for (size_t i = 1; i < P.size(); ++i) {@@2
        while (k > 0 && P[i] != P[k]) k = pi[k - 1];@@3
        if (P[i] == P[k]) k = k + 1;@@4
        pi[i] = k;@@5
    }
    return pi;
}

std::vector<int> kmpSearch(const std::string& T, const std::string& P) {@@6
    std::vector<int> pi = buildFailure(P), hits;
    int m = P.size();

    int j = 0;@@7
    for (size_t i = 0; i < T.size(); ++i) {@@8
        while (j > 0 && T[i] != P[j]) j = pi[j - 1];@@9
        if (T[i] == P[j]) j = j + 1;@@10
        if (j == m) { hits.push_back((int)i - m + 1); j = pi[j - 1]; }@@11
    }
    return hits;
}`,
    java: `
// The failure function is the whole idea: pi[i] is the length of the longest
// proper prefix of the pattern that is also a suffix of P[0..i], so on a
// mismatch the pattern slides by as much as is provably safe and the text
// index never goes backwards.
static int[] buildFailure(String P) {@@0
    int m = P.length();
    int[] pi = new int[m];
    pi[0] = 0;@@1
    int k = 0;@@1

    for (int i = 1; i < m; i++) {@@2
        while (k > 0 && P.charAt(i) != P.charAt(k)) k = pi[k - 1];@@3
        if (P.charAt(i) == P.charAt(k)) k = k + 1;@@4
        pi[i] = k;@@5
    }
    return pi;
}

static List<Integer> kmpSearch(String T, String P) {@@6
    int[] pi = buildFailure(P);
    int m = P.length();
    List<Integer> hits = new ArrayList<>();

    int j = 0;@@7
    for (int i = 0; i < T.length(); i++) {@@8
        while (j > 0 && T.charAt(i) != P.charAt(j)) j = pi[j - 1];@@9
        if (T.charAt(i) == P.charAt(j)) j = j + 1;@@10
        if (j == m) { hits.add(i - m + 1); j = pi[j - 1]; }@@11
    }
    return hits;
}`,
    python: `
def build_failure(p):@@0
    """pi[i] is the length of the longest proper prefix of the pattern that is
    also a suffix of p[:i+1], so on a mismatch the pattern slides by as much as
    is provably safe and the text index never goes backwards."""
    pi = [0] * len(p)@@1
    k = 0@@1

    for i in range(1, len(p)):@@2
        while k > 0 and p[i] != p[k]:@@3
            k = pi[k - 1]@@3
        if p[i] == p[k]:@@4
            k = k + 1@@4
        pi[i] = k@@5
    return pi


def kmp_search(text, pattern):@@6
    pi = build_failure(pattern)
    m = len(pattern)
    hits = []

    j = 0@@7
    for i, ch in enumerate(text):@@8
        while j > 0 and ch != pattern[j]:@@9
            j = pi[j - 1]@@9
        if ch == pattern[j]:@@10
            j = j + 1@@10
        if j == m:@@11
            hits.append(i - m + 1)@@11
            j = pi[j - 1]@@11
    return hits`,
    javascript: `
// The failure function is the whole idea: pi[i] is the length of the longest
// proper prefix of the pattern that is also a suffix of P[0..i], so on a
// mismatch the pattern slides by as much as is provably safe and the text
// index never goes backwards.
function buildFailure(P) {@@0
  const pi = new Array(P.length).fill(0);
  pi[0] = 0;@@1
  let k = 0;@@1

  for (let i = 1; i < P.length; i++) {@@2
    while (k > 0 && P[i] !== P[k]) k = pi[k - 1];@@3
    if (P[i] === P[k]) k = k + 1;@@4
    pi[i] = k;@@5
  }
  return pi;
}

function kmpSearch(T, P) {@@6
  const pi = buildFailure(P);
  const m = P.length;
  const hits = [];

  let j = 0;@@7
  for (let i = 0; i < T.length; i++) {@@8
    while (j > 0 && T[i] !== P[j]) j = pi[j - 1];@@9
    if (T[i] === P[j]) j = j + 1;@@10
    if (j === m) { hits.push(i - m + 1); j = pi[j - 1]; }@@11
  }
  return hits;
}`,
  },

  z: {
    c: `
/* z[i] is how far s agrees with itself starting at i. Gluing the pattern to
   the text with a separator that appears in neither turns matching into one
   question: where does z reach the pattern's length? */
void zSearch(const char *P, int m, const char *T, int n) {
    int len = m + 1 + n;
    char s[len + 1];
    sprintf(s, "%s$%s", P, T);@@0

    int z[len];
    z[0] = len;@@1
    int l = 0, r = 0;@@1

    for (int i = 1; i < len; i++) {@@2
        z[i] = 0;
        /* Inside a known window, the mirror already answers the question —
           up to where the window ends, which is the only safe part. */
        if (i < r) z[i] = (r - i < z[i - l]) ? r - i : z[i - l];@@3

        while (i + z[i] < len && s[z[i]] == s[i + z[i]]) z[i]++;@@4

        if (i + z[i] > r) { l = i; r = i + z[i]; }@@5

        if (z[i] == m) reportMatch(i - m - 1);@@6
    }
}`,
    cpp: `
// z[i] is how far s agrees with itself starting at i. Gluing the pattern to
// the text with a separator that appears in neither turns matching into one
// question: where does z reach the pattern's length?
std::vector<int> zSearch(const std::string& P, const std::string& T) {
    std::string s = P + "$" + T;@@0
    int len = s.size(), m = P.size();

    std::vector<int> z(len, 0), hits;
    z[0] = len;@@1
    int l = 0, r = 0;@@1

    for (int i = 1; i < len; ++i) {@@2
        // Inside a known window, the mirror already answers the question —
        // up to where the window ends, which is the only safe part.
        if (i < r) z[i] = std::min(r - i, z[i - l]);@@3

        while (i + z[i] < len && s[z[i]] == s[i + z[i]]) ++z[i];@@4

        if (i + z[i] > r) { l = i; r = i + z[i]; }@@5

        if (z[i] == m) hits.push_back(i - m - 1);@@6
    }
    return hits;
}`,
    java: `
// z[i] is how far s agrees with itself starting at i. Gluing the pattern to
// the text with a separator that appears in neither turns matching into one
// question: where does z reach the pattern's length?
static List<Integer> zSearch(String P, String T) {
    String s = P + "$" + T;@@0
    int len = s.length(), m = P.length();

    int[] z = new int[len];
    List<Integer> hits = new ArrayList<>();
    z[0] = len;@@1
    int l = 0, r = 0;@@1

    for (int i = 1; i < len; i++) {@@2
        // Inside a known window, the mirror already answers the question —
        // up to where the window ends, which is the only safe part.
        if (i < r) z[i] = Math.min(r - i, z[i - l]);@@3

        while (i + z[i] < len && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;@@4

        if (i + z[i] > r) { l = i; r = i + z[i]; }@@5

        if (z[i] == m) hits.add(i - m - 1);@@6
    }
    return hits;
}`,
    python: `
def z_search(pattern, text):
    """z[i] is how far s agrees with itself starting at i. Gluing the pattern
    to the text with a separator that appears in neither turns matching into
    one question: where does z reach the pattern's length?"""
    s = pattern + "$" + text@@0
    n, m = len(s), len(pattern)

    z = [0] * n
    z[0] = n@@1
    l = r = 0@@1
    hits = []

    for i in range(1, n):@@2
        # Inside a known window, the mirror already answers the question —
        # up to where the window ends, which is the only safe part.
        if i < r:@@3
            z[i] = min(r - i, z[i - l])@@3

        while i + z[i] < n and s[z[i]] == s[i + z[i]]:@@4
            z[i] += 1@@4

        if i + z[i] > r:@@5
            l, r = i, i + z[i]@@5

        if z[i] == m:@@6
            hits.append(i - m - 1)@@6
    return hits`,
    javascript: `
// z[i] is how far s agrees with itself starting at i. Gluing the pattern to
// the text with a separator that appears in neither turns matching into one
// question: where does z reach the pattern's length?
function zSearch(P, T) {
  const s = P + "$" + T;@@0
  const len = s.length, m = P.length;

  const z = new Array(len).fill(0);
  const hits = [];
  z[0] = len;@@1
  let l = 0, r = 0;@@1

  for (let i = 1; i < len; i++) {@@2
    // Inside a known window, the mirror already answers the question — up to
    // where the window ends, which is the only safe part.
    if (i < r) z[i] = Math.min(r - i, z[i - l]);@@3

    while (i + z[i] < len && s[z[i]] === s[i + z[i]]) z[i]++;@@4

    if (i + z[i] > r) { l = i; r = i + z[i]; }@@5

    if (z[i] === m) hits.push(i - m - 1);@@6
  }
  return hits;
}`,
  },

  rabinkarp: {
    c: `
/* Gives up on characters entirely and compares numbers. The rolling hash is
   the point: the next window's hash comes from this one in constant time, so
   the whole scan costs one pass — as long as the hashes rarely collide, and
   the character check on a hit is what keeps it correct when they do. */
#define BASE 256
#define MOD 1000000007

void rabinKarp(const char *T, int n, const char *P, int m) {
    long long h = 1;
    for (int i = 0; i < m - 1; i++) h = h * BASE % MOD;@@0

    long long hp = 0, hw = 0;
    for (int i = 0; i < m; i++) {@@1
        hp = (hp * BASE + P[i]) % MOD;@@1
        hw = (hw * BASE + T[i]) % MOD;@@1
    }

    for (int i = 0; i + m <= n; i++) {@@2
        if (hw == hp) {@@3
            int equal = 1;
            for (int k = 0; k < m; k++)@@4
                if (T[i + k] != P[k]) { equal = 0; break; }@@4
            if (equal) reportMatch(i);@@5
        }

        if (i + m < n) {@@6
            hw = (hw - T[i] * h % MOD + MOD) % MOD;@@7
            hw = (hw * BASE + T[i + m]) % MOD;@@8
        }
    }
}`,
    cpp: `
// Gives up on characters entirely and compares numbers. The rolling hash is
// the point: the next window's hash comes from this one in constant time, so
// the whole scan costs one pass — as long as the hashes rarely collide, and
// the character check on a hit is what keeps it correct when they do.
static const long long BASE = 256, MOD = 1000000007;

std::vector<int> rabinKarp(const std::string& T, const std::string& P) {
    int n = T.size(), m = P.size();
    std::vector<int> hits;

    long long h = 1;
    for (int i = 0; i < m - 1; ++i) h = h * BASE % MOD;@@0

    long long hp = 0, hw = 0;
    for (int i = 0; i < m; ++i) {@@1
        hp = (hp * BASE + P[i]) % MOD;@@1
        hw = (hw * BASE + T[i]) % MOD;@@1
    }

    for (int i = 0; i + m <= n; ++i) {@@2
        if (hw == hp) {@@3
            if (T.compare(i, m, P) == 0)@@4
                hits.push_back(i);@@5
        }

        if (i + m < n) {@@6
            hw = (hw - T[i] * h % MOD + MOD) % MOD;@@7
            hw = (hw * BASE + T[i + m]) % MOD;@@8
        }
    }
    return hits;
}`,
    java: `
// Gives up on characters entirely and compares numbers. The rolling hash is
// the point: the next window's hash comes from this one in constant time, so
// the whole scan costs one pass — as long as the hashes rarely collide, and
// the character check on a hit is what keeps it correct when they do.
static final long BASE = 256, MOD = 1000000007L;

static List<Integer> rabinKarp(String T, String P) {
    int n = T.length(), m = P.length();
    List<Integer> hits = new ArrayList<>();

    long h = 1;
    for (int i = 0; i < m - 1; i++) h = h * BASE % MOD;@@0

    long hp = 0, hw = 0;
    for (int i = 0; i < m; i++) {@@1
        hp = (hp * BASE + P.charAt(i)) % MOD;@@1
        hw = (hw * BASE + T.charAt(i)) % MOD;@@1
    }

    for (int i = 0; i + m <= n; i++) {@@2
        if (hw == hp) {@@3
            if (T.startsWith(P, i))@@4
                hits.add(i);@@5
        }

        if (i + m < n) {@@6
            hw = (hw - T.charAt(i) * h % MOD + MOD) % MOD;@@7
            hw = (hw * BASE + T.charAt(i + m)) % MOD;@@8
        }
    }
    return hits;
}`,
    python: `
BASE = 256
MOD = 1000000007


def rabin_karp(text, pattern):
    """Gives up on characters entirely and compares numbers. The rolling hash
    is the point: the next window's hash comes from this one in constant time,
    so the whole scan costs one pass — as long as the hashes rarely collide,
    and the character check on a hit is what keeps it correct when they do."""
    n, m = len(text), len(pattern)
    hits = []

    h = pow(BASE, m - 1, MOD)@@0

    hp = hw = 0
    for i in range(m):@@1
        hp = (hp * BASE + ord(pattern[i])) % MOD@@1
        hw = (hw * BASE + ord(text[i])) % MOD@@1

    for i in range(n - m + 1):@@2
        if hw == hp:@@3
            if text[i:i + m] == pattern:@@4
                hits.append(i)@@5

        if i + m < n:@@6
            hw = (hw - ord(text[i]) * h) % MOD@@7
            hw = (hw * BASE + ord(text[i + m])) % MOD@@8
    return hits`,
    javascript: `
// Gives up on characters entirely and compares numbers. The rolling hash is
// the point: the next window's hash comes from this one in constant time, so
// the whole scan costs one pass — as long as the hashes rarely collide, and
// the character check on a hit is what keeps it correct when they do.
const BASE = 256n;
const MOD = 1000000007n;

function rabinKarp(T, P) {
  const n = T.length, m = P.length;
  const hits = [];

  let h = 1n;
  for (let i = 0; i < m - 1; i++) h = (h * BASE) % MOD;@@0

  let hp = 0n, hw = 0n;
  for (let i = 0; i < m; i++) {@@1
    hp = (hp * BASE + BigInt(P.charCodeAt(i))) % MOD;@@1
    hw = (hw * BASE + BigInt(T.charCodeAt(i))) % MOD;@@1
  }

  for (let i = 0; i + m <= n; i++) {@@2
    if (hw === hp) {@@3
      if (T.slice(i, i + m) === P)@@4
        hits.push(i);@@5
    }

    if (i + m < n) {@@6
      hw = (hw - (BigInt(T.charCodeAt(i)) * h) % MOD + MOD) % MOD;@@7
      hw = (hw * BASE + BigInt(T.charCodeAt(i + m))) % MOD;@@8
    }
  }
  return hits;
}`,
  },

  manacher: {
    c: `
/* The separators turn every palindrome into an odd-length one, so a single
   loop handles both cases. Sentinels at the ends let the expansion run
   without a bounds check, because a mismatch is guaranteed there. */
int longestPalindrome(const char *s, int n) {
    int len = 2 * n + 3;
    char t[len + 1];
    int k = 0;
    t[k++] = '^';
    for (int i = 0; i < n; i++) { t[k++] = '#'; t[k++] = s[i]; }
    t[k++] = '#';
    t[k++] = '$';
    t[k] = 0;@@0

    int p[len];
    int C = 0, R = 0, best = 0;

    for (int i = 1; i < len - 1; i++) {@@1
        p[i] = 0;
        /* Inside a known palindrome, the mirror is an answer already — but
           only as far as the enclosing one reaches. */
        if (i < R) p[i] = (R - i < p[2 * C - i]) ? R - i : p[2 * C - i];@@2

        while (t[i - p[i] - 1] == t[i + p[i] + 1]) p[i]++;@@3

        if (i + p[i] > R) { C = i; R = i + p[i]; }@@4

        if (p[i] > p[best]) best = i;@@5
    }
    return p[best];   /* the length in the original string */@@5
}`,
    cpp: `
// The separators turn every palindrome into an odd-length one, so a single
// loop handles both cases. Sentinels at the ends let the expansion run
// without a bounds check, because a mismatch is guaranteed there.
std::string longestPalindrome(const std::string& s) {
    std::string t = "^";
    for (char c : s) { t += '#'; t += c; }
    t += "#$";@@0

    int len = t.size();
    std::vector<int> p(len, 0);
    int C = 0, R = 0, best = 0;

    for (int i = 1; i < len - 1; ++i) {@@1
        // Inside a known palindrome, the mirror is an answer already — but
        // only as far as the enclosing one reaches.
        if (i < R) p[i] = std::min(R - i, p[2 * C - i]);@@2

        while (t[i - p[i] - 1] == t[i + p[i] + 1]) ++p[i];@@3

        if (i + p[i] > R) { C = i; R = i + p[i]; }@@4

        if (p[i] > p[best]) best = i;@@5
    }
    int start = (best - p[best]) / 2;@@5
    return s.substr(start, p[best]);@@5
}`,
    java: `
// The separators turn every palindrome into an odd-length one, so a single
// loop handles both cases. Sentinels at the ends let the expansion run
// without a bounds check, because a mismatch is guaranteed there.
static String longestPalindrome(String s) {
    StringBuilder sb = new StringBuilder("^");
    for (char c : s.toCharArray()) sb.append('#').append(c);
    sb.append("#$");
    String t = sb.toString();@@0

    int len = t.length();
    int[] p = new int[len];
    int C = 0, R = 0, best = 0;

    for (int i = 1; i < len - 1; i++) {@@1
        // Inside a known palindrome, the mirror is an answer already — but
        // only as far as the enclosing one reaches.
        if (i < R) p[i] = Math.min(R - i, p[2 * C - i]);@@2

        while (t.charAt(i - p[i] - 1) == t.charAt(i + p[i] + 1)) p[i]++;@@3

        if (i + p[i] > R) { C = i; R = i + p[i]; }@@4

        if (p[i] > p[best]) best = i;@@5
    }
    int start = (best - p[best]) / 2;@@5
    return s.substring(start, start + p[best]);@@5
}`,
    python: `
def longest_palindrome(s):
    """The separators turn every palindrome into an odd-length one, so a single
    loop handles both cases. Sentinels at the ends let the expansion run
    without a bounds check, because a mismatch is guaranteed there."""
    t = "^#" + "#".join(s) + "#$"@@0

    n = len(t)
    p = [0] * n
    centre = right = best = 0

    for i in range(1, n - 1):@@1
        # Inside a known palindrome, the mirror is an answer already — but
        # only as far as the enclosing one reaches.
        if i < right:@@2
            p[i] = min(right - i, p[2 * centre - i])@@2

        while t[i - p[i] - 1] == t[i + p[i] + 1]:@@3
            p[i] += 1@@3

        if i + p[i] > right:@@4
            centre, right = i, i + p[i]@@4

        if p[i] > p[best]:@@5
            best = i@@5

    start = (best - p[best]) // 2@@5
    return s[start:start + p[best]]@@5`,
    javascript: `
// The separators turn every palindrome into an odd-length one, so a single
// loop handles both cases. Sentinels at the ends let the expansion run
// without a bounds check, because a mismatch is guaranteed there.
function longestPalindrome(s) {
  const t = "^#" + s.split("").join("#") + "#$";@@0

  const n = t.length;
  const p = new Array(n).fill(0);
  let centre = 0, right = 0, best = 0;

  for (let i = 1; i < n - 1; i++) {@@1
    // Inside a known palindrome, the mirror is an answer already — but only
    // as far as the enclosing one reaches.
    if (i < right) p[i] = Math.min(right - i, p[2 * centre - i]);@@2

    while (t[i - p[i] - 1] === t[i + p[i] + 1]) p[i]++;@@3

    if (i + p[i] > right) { centre = i; right = i + p[i]; }@@4

    if (p[i] > p[best]) best = i;@@5
  }

  const start = (best - p[best]) / 2;@@5
  return s.slice(start, start + p[best]);@@5
}`,
  },
};
