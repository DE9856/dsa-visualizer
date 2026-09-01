/**
 * Greedy and number-theory implementations, tagged with the line of the
 * algorithm each source line implements — see `./index.js` for how the `@@n`
 * markers are read.
 */
export default {
  activity: {
    c: `
/* Sorting by *finish* time is the whole algorithm. Sorting by start time, or
   by duration, gives the wrong answer; finishing earliest leaves the most
   room for everything that follows, and that is provably optimal. */
typedef struct { int start, finish; } Activity;

static int byFinish(const void *x, const void *y) {
    return ((const Activity *)x)->finish - ((const Activity *)y)->finish;
}

int selectActivities(Activity act[], int n, int chosen[]) {
    qsort(act, n, sizeof(Activity), byFinish);@@0

    int last = INT_MIN, count = 0;@@1

    for (int i = 0; i < n; i++) {@@2
        if (act[i].start >= last) {@@3
            chosen[count++] = i;@@4
            last = act[i].finish;@@5
        } else {@@6
            continue;   /* overlaps what we already hold */@@7
        }
    }
    return count;
}`,
    cpp: `
// Sorting by *finish* time is the whole algorithm. Sorting by start time, or
// by duration, gives the wrong answer; finishing earliest leaves the most
// room for everything that follows, and that is provably optimal.
struct Activity { int start, finish; };

std::vector<int> selectActivities(std::vector<Activity> act) {
    std::sort(act.begin(), act.end(),
              [](const Activity& x, const Activity& y) { return x.finish < y.finish; });@@0

    int last = INT_MIN;@@1
    std::vector<int> chosen;@@1

    for (size_t i = 0; i < act.size(); ++i) {@@2
        if (act[i].start >= last) {@@3
            chosen.push_back((int)i);@@4
            last = act[i].finish;@@5
        } else {@@6
            continue;   // overlaps what we already hold@@7
        }
    }
    return chosen;
}`,
    java: `
// Sorting by *finish* time is the whole algorithm. Sorting by start time, or
// by duration, gives the wrong answer; finishing earliest leaves the most
// room for everything that follows, and that is provably optimal.
record Activity(int start, int finish) {}

static List<Activity> selectActivities(List<Activity> act) {
    act.sort(Comparator.comparingInt(Activity::finish));@@0

    int last = Integer.MIN_VALUE;@@1
    List<Activity> chosen = new ArrayList<>();@@1

    for (Activity a : act) {@@2
        if (a.start() >= last) {@@3
            chosen.add(a);@@4
            last = a.finish();@@5
        } else {@@6
            continue;   // overlaps what we already hold@@7
        }
    }
    return chosen;
}`,
    python: `
def select_activities(activities):
    """Sorting by *finish* time is the whole algorithm. Sorting by start time,
    or by duration, gives the wrong answer; finishing earliest leaves the most
    room for everything that follows, and that is provably optimal."""
    activities = sorted(activities, key=lambda a: a[1])@@0

    last = float("-inf")@@1
    chosen = []@@1

    for start, finish in activities:@@2
        if start >= last:@@3
            chosen.append((start, finish))@@4
            last = finish@@5
        else:@@6
            continue    # overlaps what we already hold@@7
    return chosen`,
    javascript: `
// Sorting by *finish* time is the whole algorithm. Sorting by start time, or
// by duration, gives the wrong answer; finishing earliest leaves the most
// room for everything that follows, and that is provably optimal.
function selectActivities(activities) {
  const sorted = [...activities].sort((x, y) => x.finish - y.finish);@@0

  let last = -Infinity;@@1
  const chosen = [];@@1

  for (const activity of sorted) {@@2
    if (activity.start >= last) {@@3
      chosen.push(activity);@@4
      last = activity.finish;@@5
    } else {@@6
      continue; // overlaps what we already hold@@7
    }
  }
  return chosen;
}`,
  },

  fracknap: {
    c: `
/* Greedy is correct here and wrong for the 0/1 knapsack, and the only
   difference is that an item can be cut in half. Being able to take a
   fraction is what lets the last item fill the sack exactly. */
typedef struct { double weight, value; } Item;

static int byDensity(const void *x, const void *y) {
    const Item *a = x, *b = y;
    double da = a->value / a->weight, db = b->value / b->weight;
    return (db > da) - (db < da);
}

double fractionalKnapsack(Item item[], int n, double capacity) {
    qsort(item, n, sizeof(Item), byDensity);@@0

    double room = capacity, total = 0;@@1

    for (int i = 0; i < n; i++) {@@2
        if (item[i].weight <= room) {@@3
            room -= item[i].weight;@@4
            total += item[i].value;@@4
        } else {@@5
            total += item[i].value * (room / item[i].weight);@@6
            room = 0;@@7
            break;@@7
        }
    }
    return total;
}`,
    cpp: `
// Greedy is correct here and wrong for the 0/1 knapsack, and the only
// difference is that an item can be cut in half. Being able to take a
// fraction is what lets the last item fill the sack exactly.
struct Item { double weight, value; };

double fractionalKnapsack(std::vector<Item> items, double capacity) {
    std::sort(items.begin(), items.end(), [](const Item& a, const Item& b) {
        return a.value / a.weight > b.value / b.weight;
    });@@0

    double room = capacity, total = 0;@@1

    for (const Item& item : items) {@@2
        if (item.weight <= room) {@@3
            room -= item.weight;@@4
            total += item.value;@@4
        } else {@@5
            total += item.value * (room / item.weight);@@6
            room = 0;@@7
            break;@@7
        }
    }
    return total;
}`,
    java: `
// Greedy is correct here and wrong for the 0/1 knapsack, and the only
// difference is that an item can be cut in half. Being able to take a
// fraction is what lets the last item fill the sack exactly.
record Item(double weight, double value) {}

static double fractionalKnapsack(List<Item> items, double capacity) {
    items.sort(Comparator.comparingDouble((Item i) -> i.value() / i.weight()).reversed());@@0

    double room = capacity, total = 0;@@1

    for (Item item : items) {@@2
        if (item.weight() <= room) {@@3
            room -= item.weight();@@4
            total += item.value();@@4
        } else {@@5
            total += item.value() * (room / item.weight());@@6
            room = 0;@@7
            break;@@7
        }
    }
    return total;
}`,
    python: `
def fractional_knapsack(items, capacity):
    """Greedy is correct here and wrong for the 0/1 knapsack, and the only
    difference is that an item can be cut in half. Being able to take a
    fraction is what lets the last item fill the sack exactly."""
    items = sorted(items, key=lambda it: it[1] / it[0], reverse=True)@@0

    room, total = capacity, 0.0@@1

    for weight, value in items:@@2
        if weight <= room:@@3
            room -= weight@@4
            total += value@@4
        else:@@5
            total += value * (room / weight)@@6
            room = 0@@7
            break@@7
    return total`,
    javascript: `
// Greedy is correct here and wrong for the 0/1 knapsack, and the only
// difference is that an item can be cut in half. Being able to take a
// fraction is what lets the last item fill the sack exactly.
function fractionalKnapsack(items, capacity) {
  const sorted = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);@@0

  let room = capacity, total = 0;@@1

  for (const item of sorted) {@@2
    if (item.weight <= room) {@@3
      room -= item.weight;@@4
      total += item.value;@@4
    } else {@@5
      total += item.value * (room / item.weight);@@6
      room = 0;@@7
      break;@@7
    }
  }
  return total;
}`,
  },

  sieve: {
    c: `
/* Starting the inner loop at p*p, not 2*p, is the optimisation that matters:
   every smaller multiple of p has a smaller prime factor and was already
   crossed out by it. That is also why the outer loop stops at sqrt(n). */
void sieve(int n, int prime[]) {
    for (int i = 2; i <= n; i++) prime[i] = 1;@@0

    for (int p = 2; p * p <= n; p++) {@@1
        if (prime[p]) {@@2
            for (int m = p * p; m <= n; m += p) {@@3
                prime[m] = 0;@@4
            }
        }
    }
    /* Whatever is still marked is prime. */@@5
}`,
    cpp: `
// Starting the inner loop at p*p, not 2*p, is the optimisation that matters:
// every smaller multiple of p has a smaller prime factor and was already
// crossed out by it. That is also why the outer loop stops at sqrt(n).
std::vector<int> sieve(int n) {
    std::vector<bool> prime(n + 1, true);
    prime[0] = prime[1] = false;@@0

    for (int p = 2; p * p <= n; ++p) {@@1
        if (prime[p]) {@@2
            for (int m = p * p; m <= n; m += p) {@@3
                prime[m] = false;@@4
            }
        }
    }

    std::vector<int> primes;
    for (int i = 2; i <= n; ++i) if (prime[i]) primes.push_back(i);@@5
    return primes;
}`,
    java: `
// Starting the inner loop at p*p, not 2*p, is the optimisation that matters:
// every smaller multiple of p has a smaller prime factor and was already
// crossed out by it. That is also why the outer loop stops at sqrt(n).
static List<Integer> sieve(int n) {
    boolean[] prime = new boolean[n + 1];
    Arrays.fill(prime, 2, n + 1, true);@@0

    for (int p = 2; p * p <= n; p++) {@@1
        if (prime[p]) {@@2
            for (int m = p * p; m <= n; m += p) {@@3
                prime[m] = false;@@4
            }
        }
    }

    List<Integer> primes = new ArrayList<>();
    for (int i = 2; i <= n; i++) if (prime[i]) primes.add(i);@@5
    return primes;
}`,
    python: `
def sieve(n):
    """Starting the inner loop at p*p, not 2*p, is the optimisation that
    matters: every smaller multiple of p has a smaller prime factor and was
    already crossed out by it. That is also why the outer loop stops at
    sqrt(n)."""
    prime = [True] * (n + 1)@@0
    prime[0] = prime[1] = False@@0

    p = 2
    while p * p <= n:@@1
        if prime[p]:@@2
            for m in range(p * p, n + 1, p):@@3
                prime[m] = False@@4
        p += 1@@1

    return [i for i in range(2, n + 1) if prime[i]]@@5`,
    javascript: `
// Starting the inner loop at p*p, not 2*p, is the optimisation that matters:
// every smaller multiple of p has a smaller prime factor and was already
// crossed out by it. That is also why the outer loop stops at sqrt(n).
function sieve(n) {
  const prime = new Array(n + 1).fill(true);@@0
  prime[0] = prime[1] = false;@@0

  for (let p = 2; p * p <= n; p++) {@@1
    if (prime[p]) {@@2
      for (let m = p * p; m <= n; m += p) {@@3
        prime[m] = false;@@4
      }
    }
  }

  return prime.flatMap((isPrime, i) => (isPrime && i >= 2 ? [i] : []));@@5
}`,
  },

  fastpow: {
    c: `
/* Squaring the base and halving the exponent turns n multiplications into
   log n of them. This is why RSA — which raises numbers to enormous powers —
   runs in milliseconds rather than centuries. */
long long fastPower(long long base, long long exp, long long mod) {
    long long result = 1, b = base % mod, e = exp;@@0

    while (e > 0) {@@1
        if (e & 1) {@@2
            result = result * b % mod;@@3
        }
        b = b * b % mod;@@4
        e >>= 1;@@5
    }
    return result;@@6
}`,
    cpp: `
// Squaring the base and halving the exponent turns n multiplications into
// log n of them. This is why RSA — which raises numbers to enormous powers —
// runs in milliseconds rather than centuries.
long long fastPower(long long base, long long exp, long long mod) {
    long long result = 1, b = base % mod, e = exp;@@0

    while (e > 0) {@@1
        if (e & 1) {@@2
            result = result * b % mod;@@3
        }
        b = b * b % mod;@@4
        e >>= 1;@@5
    }
    return result;@@6
}`,
    java: `
// Squaring the base and halving the exponent turns n multiplications into
// log n of them. This is why RSA — which raises numbers to enormous powers —
// runs in milliseconds rather than centuries.
static long fastPower(long base, long exp, long mod) {
    long result = 1, b = base % mod, e = exp;@@0

    while (e > 0) {@@1
        if ((e & 1) == 1) {@@2
            result = result * b % mod;@@3
        }
        b = b * b % mod;@@4
        e >>= 1;@@5
    }
    return result;@@6
}`,
    python: `
def fast_power(base, exp, mod=None):
    """Squaring the base and halving the exponent turns n multiplications into
    log n of them. This is why RSA — which raises numbers to enormous powers —
    runs in milliseconds rather than centuries."""
    result, b, e = 1, base, exp@@0

    while e > 0:@@1
        if e & 1:@@2
            result = result * b if mod is None else result * b % mod@@3
        b = b * b if mod is None else b * b % mod@@4
        e >>= 1@@5
    return result@@6`,
    javascript: `
// Squaring the base and halving the exponent turns n multiplications into
// log n of them. This is why RSA — which raises numbers to enormous powers —
// runs in milliseconds rather than centuries. BigInt because the intermediate
// squares outgrow a double almost immediately.
function fastPower(base, exp, mod) {
  let result = 1n, b = BigInt(base) % mod, e = BigInt(exp);@@0

  while (e > 0n) {@@1
    if (e & 1n) {@@2
      result = (result * b) % mod;@@3
    }
    b = (b * b) % mod;@@4
    e >>= 1n;@@5
  }
  return result;@@6
}`,
  },

  gcd: {
    c: `
/* The oldest algorithm still in daily use. Each step replaces (a, b) with
   (b, a mod b), and the remainder shrinks fast enough that the number of
   steps is logarithmic — worst case, consecutive Fibonacci numbers. */
int gcd(int a, int b) {
    while (b != 0) {@@0
        int q = a / b;@@1
        int r = a - q * b;@@2
        a = b;@@3
        b = r;@@3
    }
    return a;@@4
}`,
    cpp: `
// The oldest algorithm still in daily use. Each step replaces (a, b) with
// (b, a mod b), and the remainder shrinks fast enough that the number of
// steps is logarithmic — worst case, consecutive Fibonacci numbers.
int gcd(int a, int b) {
    while (b != 0) {@@0
        int q = a / b;@@1
        int r = a - q * b;@@2
        a = b;@@3
        b = r;@@3
    }
    return a;@@4
}`,
    java: `
// The oldest algorithm still in daily use. Each step replaces (a, b) with
// (b, a mod b), and the remainder shrinks fast enough that the number of
// steps is logarithmic — worst case, consecutive Fibonacci numbers.
static int gcd(int a, int b) {
    while (b != 0) {@@0
        int q = a / b;@@1
        int r = a - q * b;@@2
        a = b;@@3
        b = r;@@3
    }
    return a;@@4
}`,
    python: `
def gcd(a, b):
    """The oldest algorithm still in daily use. Each step replaces (a, b) with
    (b, a mod b), and the remainder shrinks fast enough that the number of
    steps is logarithmic — worst case, consecutive Fibonacci numbers."""
    while b != 0:@@0
        q = a // b@@1
        r = a - q * b@@2
        a, b = b, r@@3
    return a@@4`,
    javascript: `
// The oldest algorithm still in daily use. Each step replaces (a, b) with
// (b, a mod b), and the remainder shrinks fast enough that the number of
// steps is logarithmic — worst case, consecutive Fibonacci numbers.
function gcd(a, b) {
  while (b !== 0) {@@0
    const q = Math.floor(a / b);@@1
    const r = a - q * b;@@2
    a = b;@@3
    b = r;@@3
  }
  return a;@@4
}`,
  },
};
