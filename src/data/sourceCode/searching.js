/**
 * Searching implementations, tagged with the pseudocode line each source line
 * implements — see `./index.js` for how the `@@n` markers are read.
 *
 * Every one of these but the linear scan needs the array sorted first; the
 * visualiser sorts a copy before it runs them, and so should you.
 */
export default {
  linear: {
    c: `
int linearSearch(int a[], int n, int target) {
    for (int i = 0; i < n; i++) {@@0
        if (a[i] == target) {@@1
            return i;@@2
        }
    }
    return -1;@@3
}`,
    cpp: `
int linearSearch(const std::vector<int>& a, int target) {
    for (size_t i = 0; i < a.size(); ++i) {@@0
        if (a[i] == target) {@@1
            return (int)i;@@2
        }
    }
    return -1;@@3
}`,
    java: `
static int linearSearch(int[] a, int target) {
    for (int i = 0; i < a.length; i++) {@@0
        if (a[i] == target) {@@1
            return i;@@2
        }
    }
    return -1;@@3
}`,
    python: `
def linear_search(a, target):
    for i, value in enumerate(a):@@0
        if value == target:@@1
            return i@@2
    return -1@@3`,
    javascript: `
function linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {@@0
    if (a[i] === target) {@@1
      return i;@@2
    }
  }
  return -1;@@3
}`,
  },

  binary: {
    c: `
/* The array must be sorted. lo + (hi - lo) / 2 rather than (lo + hi) / 2
   because the sum can overflow on a large array — the bug that sat in the
   JDK's binary search for nine years. */
int binarySearch(int a[], int n, int target) {
    int lo = 0, hi = n - 1;@@0

    while (lo <= hi) {@@1
        int mid = lo + (hi - lo) / 2;@@2

        if (a[mid] == target) return mid;@@3
        else if (a[mid] < target) lo = mid + 1;@@4
        else hi = mid - 1;@@5
    }
    return -1;@@6
}`,
    cpp: `
// The vector must be sorted. lo + (hi - lo) / 2 rather than (lo + hi) / 2
// because the sum can overflow on a large array — the bug that sat in the
// JDK's binary search for nine years.
int binarySearch(const std::vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;@@0

    while (lo <= hi) {@@1
        int mid = lo + (hi - lo) / 2;@@2

        if (a[mid] == target) return mid;@@3
        else if (a[mid] < target) lo = mid + 1;@@4
        else hi = mid - 1;@@5
    }
    return -1;@@6
}`,
    java: `
// The array must be sorted. lo + (hi - lo) / 2 rather than (lo + hi) / 2
// because the sum can overflow on a large array — the bug that sat in the
// JDK's own binary search for nine years.
static int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;@@0

    while (lo <= hi) {@@1
        int mid = lo + (hi - lo) / 2;@@2

        if (a[mid] == target) return mid;@@3
        else if (a[mid] < target) lo = mid + 1;@@4
        else hi = mid - 1;@@5
    }
    return -1;@@6
}`,
    python: `
def binary_search(a, target):
    """The list must be sorted."""
    lo, hi = 0, len(a) - 1@@0

    while lo <= hi:@@1
        mid = (lo + hi) // 2@@2

        if a[mid] == target:@@3
            return mid@@3
        elif a[mid] < target:@@4
            lo = mid + 1@@4
        else:@@5
            hi = mid - 1@@5
    return -1@@6`,
    javascript: `
// The array must be sorted.
function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;@@0

  while (lo <= hi) {@@1
    const mid = (lo + hi) >> 1;@@2

    if (a[mid] === target) return mid;@@3
    else if (a[mid] < target) lo = mid + 1;@@4
    else hi = mid - 1;@@5
  }
  return -1;@@6
}`,
  },

  jump: {
    c: `
/* Fixed-size hops to find the block the target must be in, then a linear
   scan inside it. sqrt(n) is the block size that balances the two: any
   larger and the scan dominates, any smaller and the hops do. */
int jumpSearch(int a[], int n, int target) {
    int step = (int)sqrt((double)n);@@0
    if (step < 1) step = 1;@@0

    int prev = 0;
    while (a[(step < n ? step : n) - 1] < target) {@@1
        prev = step;@@2
        step += (int)sqrt((double)n);@@2
        if (prev >= n) return -1;@@2
    }

    while (prev < (step < n ? step : n) && a[prev] < target) prev++;@@3

    return (prev < n && a[prev] == target) ? prev : -1;@@4
}`,
    cpp: `
// Fixed-size hops to find the block the target must be in, then a linear
// scan inside it. sqrt(n) is the block size that balances the two: any
// larger and the scan dominates, any smaller and the hops do.
int jumpSearch(const std::vector<int>& a, int target) {
    int n = a.size();
    int block = std::max(1, (int)std::sqrt((double)n));
    int step = block;@@0

    int prev = 0;
    while (a[std::min(step, n) - 1] < target) {@@1
        prev = step;@@2
        step += block;@@2
        if (prev >= n) return -1;@@2
    }

    while (prev < std::min(step, n) && a[prev] < target) ++prev;@@3

    return (prev < n && a[prev] == target) ? prev : -1;@@4
}`,
    java: `
// Fixed-size hops to find the block the target must be in, then a linear
// scan inside it. sqrt(n) is the block size that balances the two: any
// larger and the scan dominates, any smaller and the hops do.
static int jumpSearch(int[] a, int target) {
    int n = a.length;
    int block = Math.max(1, (int) Math.sqrt(n));
    int step = block;@@0

    int prev = 0;
    while (a[Math.min(step, n) - 1] < target) {@@1
        prev = step;@@2
        step += block;@@2
        if (prev >= n) return -1;@@2
    }

    while (prev < Math.min(step, n) && a[prev] < target) prev++;@@3

    return (prev < n && a[prev] == target) ? prev : -1;@@4
}`,
    python: `
import math


def jump_search(a, target):
    """Fixed-size hops to find the block the target must be in, then a linear
    scan inside it. sqrt(n) is the block size that balances the two: any
    larger and the scan dominates, any smaller and the hops do."""
    n = len(a)
    block = max(1, int(math.sqrt(n)))
    step = block@@0

    prev = 0
    while a[min(step, n) - 1] < target:@@1
        prev = step@@2
        step += block@@2
        if prev >= n:@@2
            return -1@@2

    while prev < min(step, n) and a[prev] < target:@@3
        prev += 1@@3

    return prev if prev < n and a[prev] == target else -1@@4`,
    javascript: `
// Fixed-size hops to find the block the target must be in, then a linear
// scan inside it. sqrt(n) is the block size that balances the two: any
// larger and the scan dominates, any smaller and the hops do.
function jumpSearch(a, target) {
  const n = a.length;
  const block = Math.max(1, Math.floor(Math.sqrt(n)));
  let step = block;@@0

  let prev = 0;
  while (a[Math.min(step, n) - 1] < target) {@@1
    prev = step;@@2
    step += block;@@2
    if (prev >= n) return -1;@@2
  }

  while (prev < Math.min(step, n) && a[prev] < target) prev++;@@3

  return prev < n && a[prev] === target ? prev : -1;@@4
}`,
  },

  interpolation: {
    c: `
/* Binary search guesses the middle; this one guesses where the value should
   be if the data were evenly spread. On uniform data that is O(log log n);
   on clustered data it degrades all the way to O(n). */
int interpolationSearch(int a[], int n, int target) {
    int lo = 0, hi = n - 1;@@0

    while (lo <= hi && target >= a[lo] && target <= a[hi]) {@@1
        /* A flat range would divide by zero — and there is nothing to
           interpolate between two equal endpoints anyway. */
        if (a[hi] == a[lo]) return a[lo] == target ? lo : -1;

        int pos = lo + (int)(((long)(target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));@@2

        if (a[pos] == target) return pos;@@3
        else if (a[pos] < target) lo = pos + 1;@@4
        else hi = pos - 1;@@5
    }
    return -1;@@6
}`,
    cpp: `
// Binary search guesses the middle; this one guesses where the value should
// be if the data were evenly spread. On uniform data that is O(log log n);
// on clustered data it degrades all the way to O(n).
int interpolationSearch(const std::vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;@@0

    while (lo <= hi && target >= a[lo] && target <= a[hi]) {@@1
        // A flat range would divide by zero — and there is nothing to
        // interpolate between two equal endpoints anyway.
        if (a[hi] == a[lo]) return a[lo] == target ? lo : -1;

        int pos = lo + (int)(((long long)(target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));@@2

        if (a[pos] == target) return pos;@@3
        else if (a[pos] < target) lo = pos + 1;@@4
        else hi = pos - 1;@@5
    }
    return -1;@@6
}`,
    java: `
// Binary search guesses the middle; this one guesses where the value should
// be if the data were evenly spread. On uniform data that is O(log log n);
// on clustered data it degrades all the way to O(n).
static int interpolationSearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;@@0

    while (lo <= hi && target >= a[lo] && target <= a[hi]) {@@1
        // A flat range would divide by zero — and there is nothing to
        // interpolate between two equal endpoints anyway.
        if (a[hi] == a[lo]) return a[lo] == target ? lo : -1;

        int pos = lo + (int) (((long) (target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));@@2

        if (a[pos] == target) return pos;@@3
        else if (a[pos] < target) lo = pos + 1;@@4
        else hi = pos - 1;@@5
    }
    return -1;@@6
}`,
    python: `
def interpolation_search(a, target):
    """Binary search guesses the middle; this one guesses where the value
    should be if the data were evenly spread. On uniform data that is
    O(log log n); on clustered data it degrades all the way to O(n)."""
    lo, hi = 0, len(a) - 1@@0

    while lo <= hi and a[lo] <= target <= a[hi]:@@1
        # A flat range would divide by zero — and there is nothing to
        # interpolate between two equal endpoints anyway.
        if a[hi] == a[lo]:
            return lo if a[lo] == target else -1

        pos = lo + (target - a[lo]) * (hi - lo) // (a[hi] - a[lo])@@2

        if a[pos] == target:@@3
            return pos@@3
        elif a[pos] < target:@@4
            lo = pos + 1@@4
        else:@@5
            hi = pos - 1@@5
    return -1@@6`,
    javascript: `
// Binary search guesses the middle; this one guesses where the value should
// be if the data were evenly spread. On uniform data that is O(log log n);
// on clustered data it degrades all the way to O(n).
function interpolationSearch(a, target) {
  let lo = 0, hi = a.length - 1;@@0

  while (lo <= hi && target >= a[lo] && target <= a[hi]) {@@1
    // A flat range would divide by zero — and there is nothing to
    // interpolate between two equal endpoints anyway.
    if (a[hi] === a[lo]) return a[lo] === target ? lo : -1;

    const pos = lo + Math.floor(((target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));@@2

    if (a[pos] === target) return pos;@@3
    else if (a[pos] < target) lo = pos + 1;@@4
    else hi = pos - 1;@@5
  }
  return -1;@@6
}`,
  },

  exponential: {
    c: `
/* Doubling a bound until it passes the target, then binary searching inside
   it. The point is that the cost depends on where the answer is, not on how
   long the array is — which is what you want for an unbounded or streamed
   sequence whose length you cannot ask for. */
int exponentialSearch(int a[], int n, int target) {
    if (a[0] == target) return 0;@@0

    int bound = 1;@@1
    while (bound < n && a[bound] <= target) {@@2
        bound *= 2;@@3
    }

    int lo = bound / 2;@@4
    int hi = bound < n - 1 ? bound : n - 1;@@4

    while (lo <= hi) {@@5
        int mid = lo + (hi - lo) / 2;@@6
        if (a[mid] == target) return mid;@@7
        else if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;@@8
}`,
    cpp: `
// Doubling a bound until it passes the target, then binary searching inside
// it. The point is that the cost depends on where the answer is, not on how
// long the array is — which is what you want for an unbounded or streamed
// sequence whose length you cannot ask for.
int exponentialSearch(const std::vector<int>& a, int target) {
    int n = a.size();
    if (a[0] == target) return 0;@@0

    int bound = 1;@@1
    while (bound < n && a[bound] <= target) {@@2
        bound *= 2;@@3
    }

    int lo = bound / 2;@@4
    int hi = std::min(bound, n - 1);@@4

    while (lo <= hi) {@@5
        int mid = lo + (hi - lo) / 2;@@6
        if (a[mid] == target) return mid;@@7
        else if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;@@8
}`,
    java: `
// Doubling a bound until it passes the target, then binary searching inside
// it. The point is that the cost depends on where the answer is, not on how
// long the array is — which is what you want for an unbounded or streamed
// sequence whose length you cannot ask for.
static int exponentialSearch(int[] a, int target) {
    int n = a.length;
    if (a[0] == target) return 0;@@0

    int bound = 1;@@1
    while (bound < n && a[bound] <= target) {@@2
        bound *= 2;@@3
    }

    int lo = bound / 2;@@4
    int hi = Math.min(bound, n - 1);@@4

    while (lo <= hi) {@@5
        int mid = lo + (hi - lo) / 2;@@6
        if (a[mid] == target) return mid;@@7
        else if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;@@8
}`,
    python: `
def exponential_search(a, target):
    """Doubling a bound until it passes the target, then binary searching
    inside it. The cost depends on where the answer is, not on how long the
    list is — which is what you want for an unbounded or streamed sequence
    whose length you cannot ask for."""
    n = len(a)
    if a[0] == target:@@0
        return 0@@0

    bound = 1@@1
    while bound < n and a[bound] <= target:@@2
        bound *= 2@@3

    lo = bound // 2@@4
    hi = min(bound, n - 1)@@4

    while lo <= hi:@@5
        mid = (lo + hi) // 2@@6
        if a[mid] == target:@@7
            return mid@@7
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1@@8`,
    javascript: `
// Doubling a bound until it passes the target, then binary searching inside
// it. The point is that the cost depends on where the answer is, not on how
// long the array is — which is what you want for an unbounded or streamed
// sequence whose length you cannot ask for.
function exponentialSearch(a, target) {
  const n = a.length;
  if (a[0] === target) return 0;@@0

  let bound = 1;@@1
  while (bound < n && a[bound] <= target) {@@2
    bound *= 2;@@3
  }

  let lo = bound >> 1;@@4
  let hi = Math.min(bound, n - 1);@@4

  while (lo <= hi) {@@5
    const mid = (lo + hi) >> 1;@@6
    if (a[mid] === target) return mid;@@7
    else if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;@@8
}`,
  },
};
