/**
 * Sorting implementations, one per language, tagged with the pseudocode line
 * each source line implements — see `./index.js` for how the `@@n` markers
 * are read. The bodies match what the visualiser actually runs, including the
 * early exits and pivot rules, so the code and the animation agree.
 */
export default {
  bubble: {
    c: `
void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {@@0
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {@@1
            if (a[j] > a[j + 1]) {@@2
                int t = a[j];@@3
                a[j] = a[j + 1];@@3
                a[j + 1] = t;@@3
                swapped = 1;
            }
        }
        /* A pass with no swaps means the array is already in order. */
        if (!swapped) break;
    }
}`,
    cpp: `
void bubbleSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; ++i) {@@0
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; ++j) {@@1
            if (a[j] > a[j + 1]) {@@2
                std::swap(a[j], a[j + 1]);@@3
                swapped = true;
            }
        }
        // A pass with no swaps means the array is already in order.
        if (!swapped) break;
    }
}`,
    java: `
static void bubbleSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {@@0
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {@@1
            if (a[j] > a[j + 1]) {@@2
                int t = a[j];@@3
                a[j] = a[j + 1];@@3
                a[j + 1] = t;@@3
                swapped = true;
            }
        }
        // A pass with no swaps means the array is already in order.
        if (!swapped) break;
    }
}`,
    python: `
def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):@@0
        swapped = False
        for j in range(n - 1 - i):@@1
            if a[j] > a[j + 1]:@@2
                a[j], a[j + 1] = a[j + 1], a[j]@@3
                swapped = True
        # A pass with no swaps means the list is already in order.
        if not swapped:
            break
    return a`,
    javascript: `
function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {@@0
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {@@1
      if (a[j] > a[j + 1]) {@@2
        [a[j], a[j + 1]] = [a[j + 1], a[j]];@@3
        swapped = true;
      }
    }
    // A pass with no swaps means the array is already in order.
    if (!swapped) break;
  }
  return a;
}`,
  },

  selection: {
    c: `
void selectionSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {@@0
        int min = i;@@1
        for (int j = i + 1; j < n; j++) {@@2
            if (a[j] < a[min]) min = j;@@3
        }
        int t = a[i];@@4
        a[i] = a[min];@@4
        a[min] = t;@@4
    }
}`,
    cpp: `
void selectionSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; ++i) {@@0
        int min = i;@@1
        for (int j = i + 1; j < n; ++j) {@@2
            if (a[j] < a[min]) min = j;@@3
        }
        std::swap(a[i], a[min]);@@4
    }
}`,
    java: `
static void selectionSort(int[] a) {
    for (int i = 0; i < a.length - 1; i++) {@@0
        int min = i;@@1
        for (int j = i + 1; j < a.length; j++) {@@2
            if (a[j] < a[min]) min = j;@@3
        }
        int t = a[i];@@4
        a[i] = a[min];@@4
        a[min] = t;@@4
    }
}`,
    python: `
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):@@0
        lo = i@@1
        for j in range(i + 1, n):@@2
            if a[j] < a[lo]:@@3
                lo = j@@3
        a[i], a[lo] = a[lo], a[i]@@4
    return a`,
    javascript: `
function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {@@0
    let min = i;@@1
    for (let j = i + 1; j < n; j++) {@@2
      if (a[j] < a[min]) min = j;@@3
    }
    [a[i], a[min]] = [a[min], a[i]];@@4
  }
  return a;
}`,
  },

  insertion: {
    c: `
void insertionSort(int a[], int n) {
    for (int i = 1; i < n; i++) {@@0
        int j = i;@@1
        while (j > 0 && a[j - 1] > a[j]) {@@2
            int t = a[j - 1];@@3
            a[j - 1] = a[j];@@3
            a[j] = t;@@3
            j--;@@3
        }
    }
}`,
    cpp: `
void insertionSort(std::vector<int>& a) {
    for (int i = 1; i < (int)a.size(); ++i) {@@0
        int j = i;@@1
        while (j > 0 && a[j - 1] > a[j]) {@@2
            std::swap(a[j - 1], a[j]);@@3
            --j;@@3
        }
    }
}`,
    java: `
static void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {@@0
        int j = i;@@1
        while (j > 0 && a[j - 1] > a[j]) {@@2
            int t = a[j - 1];@@3
            a[j - 1] = a[j];@@3
            a[j] = t;@@3
            j--;@@3
        }
    }
}`,
    python: `
def insertion_sort(a):
    for i in range(1, len(a)):@@0
        j = i@@1
        while j > 0 and a[j - 1] > a[j]:@@2
            a[j - 1], a[j] = a[j], a[j - 1]@@3
            j -= 1@@3
    return a`,
    javascript: `
function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {@@0
    let j = i;@@1
    while (j > 0 && a[j - 1] > a[j]) {@@2
      [a[j - 1], a[j]] = [a[j], a[j - 1]];@@3
      j--;@@3
    }
  }
  return a;
}`,
  },

  merge: {
    c: `
static void merge(int a[], int l, int mid, int r) {@@5
    int nl = mid - l, nr = r - mid;
    int *L = malloc(nl * sizeof(int));
    int *R = malloc(nr * sizeof(int));
    for (int x = 0; x < nl; x++) L[x] = a[l + x];
    for (int x = 0; x < nr; x++) R[x] = a[mid + x];

    int i = 0, j = 0, k = l;
    while (i < nl && j < nr) {@@6
        /* <= rather than < is the whole of the stability guarantee. */
        if (L[i] <= R[j]) a[k++] = L[i++];@@7
        else a[k++] = R[j++];@@8
    }
    while (i < nl) a[k++] = L[i++];@@9
    while (j < nr) a[k++] = R[j++];@@9
    free(L);
    free(R);
}

void mergeSort(int a[], int l, int r) {@@0
    if (r - l <= 1) return;@@1
    int mid = (l + r) / 2;@@2
    mergeSort(a, l, mid);@@3
    mergeSort(a, mid, r);@@3
    merge(a, l, mid, r);@@4
}

/* The range is half-open: mergeSort(a, 0, n). */`,
    cpp: `
static void merge(std::vector<int>& a, int l, int mid, int r) {@@5
    std::vector<int> L(a.begin() + l, a.begin() + mid);
    std::vector<int> R(a.begin() + mid, a.begin() + r);

    size_t i = 0, j = 0;
    int k = l;
    while (i < L.size() && j < R.size()) {@@6
        // <= rather than < is the whole of the stability guarantee.
        if (L[i] <= R[j]) a[k++] = L[i++];@@7
        else a[k++] = R[j++];@@8
    }
    while (i < L.size()) a[k++] = L[i++];@@9
    while (j < R.size()) a[k++] = R[j++];@@9
}

void mergeSort(std::vector<int>& a, int l, int r) {@@0
    if (r - l <= 1) return;@@1
    int mid = (l + r) / 2;@@2
    mergeSort(a, l, mid);@@3
    mergeSort(a, mid, r);@@3
    merge(a, l, mid, r);@@4
}

// The range is half-open: mergeSort(a, 0, a.size()).`,
    java: `
static void merge(int[] a, int l, int mid, int r) {@@5
    int[] L = Arrays.copyOfRange(a, l, mid);
    int[] R = Arrays.copyOfRange(a, mid, r);

    int i = 0, j = 0, k = l;
    while (i < L.length && j < R.length) {@@6
        // <= rather than < is the whole of the stability guarantee.
        if (L[i] <= R[j]) a[k++] = L[i++];@@7
        else a[k++] = R[j++];@@8
    }
    while (i < L.length) a[k++] = L[i++];@@9
    while (j < R.length) a[k++] = R[j++];@@9
}

static void mergeSort(int[] a, int l, int r) {@@0
    if (r - l <= 1) return;@@1
    int mid = (l + r) / 2;@@2
    mergeSort(a, l, mid);@@3
    mergeSort(a, mid, r);@@3
    merge(a, l, mid, r);@@4
}

// The range is half-open: mergeSort(a, 0, a.length).`,
    python: `
def merge(a, l, mid, r):@@5
    left = a[l:mid]
    right = a[mid:r]

    i = j = 0
    k = l
    while i < len(left) and j < len(right):@@6
        # <= rather than < is the whole of the stability guarantee.
        if left[i] <= right[j]:@@7
            a[k] = left[i]@@7
            i += 1@@7
        else:@@8
            a[k] = right[j]@@8
            j += 1@@8
        k += 1
    while i < len(left):@@9
        a[k] = left[i]@@9
        i += 1@@9
        k += 1@@9
    while j < len(right):@@9
        a[k] = right[j]@@9
        j += 1@@9
        k += 1@@9


def merge_sort(a, l=0, r=None):@@0
    if r is None:
        r = len(a)
    if r - l <= 1:@@1
        return a@@1
    mid = (l + r) // 2@@2
    merge_sort(a, l, mid)@@3
    merge_sort(a, mid, r)@@3
    merge(a, l, mid, r)@@4
    return a`,
    javascript: `
function merge(a, l, mid, r) {@@5
  const L = a.slice(l, mid);
  const R = a.slice(mid, r);

  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) {@@6
    // <= rather than < is the whole of the stability guarantee.
    if (L[i] <= R[j]) a[k++] = L[i++];@@7
    else a[k++] = R[j++];@@8
  }
  while (i < L.length) a[k++] = L[i++];@@9
  while (j < R.length) a[k++] = R[j++];@@9
}

function mergeSort(a, l = 0, r = a.length) {@@0
  if (r - l <= 1) return a;@@1
  const mid = (l + r) >> 1;@@2
  mergeSort(a, l, mid);@@3
  mergeSort(a, mid, r);@@3
  merge(a, l, mid, r);@@4
  return a;
}`,
  },

  quick: {
    c: `
/* Median of the first, middle and last element: cheap insurance against the
   already-sorted input that makes a first-element pivot quadratic. */
static int choosePivot(int a[], int l, int r) {
    int m = l + (r - l) / 2;
    if ((a[l] <= a[m]) == (a[l] >= a[r])) return l;
    if ((a[m] <= a[l]) == (a[m] >= a[r])) return m;
    return r;
}

static void swp(int a[], int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}

void quickSort(int a[], int l, int r) {@@0
    if (l >= r) return;

    swp(a, choosePivot(a, l, r), r);@@1
    int pivot = a[r], i = l - 1;@@2

    for (int j = l; j < r; j++) {@@3
        if (a[j] < pivot) {@@4
            i++;@@5
            swp(a, i, j);@@5
        }
    }
    swp(a, i + 1, r);@@6

    quickSort(a, l, i);@@7
    quickSort(a, i + 2, r);@@7
}

/* The range is inclusive: quickSort(a, 0, n - 1). */`,
    cpp: `
// Median of the first, middle and last element: cheap insurance against the
// already-sorted input that makes a first-element pivot quadratic.
static int choosePivot(const std::vector<int>& a, int l, int r) {
    int m = l + (r - l) / 2;
    if ((a[l] <= a[m]) == (a[l] >= a[r])) return l;
    if ((a[m] <= a[l]) == (a[m] >= a[r])) return m;
    return r;
}

void quickSort(std::vector<int>& a, int l, int r) {@@0
    if (l >= r) return;

    std::swap(a[choosePivot(a, l, r)], a[r]);@@1
    int pivot = a[r], i = l - 1;@@2

    for (int j = l; j < r; ++j) {@@3
        if (a[j] < pivot) {@@4
            ++i;@@5
            std::swap(a[i], a[j]);@@5
        }
    }
    std::swap(a[i + 1], a[r]);@@6

    quickSort(a, l, i);@@7
    quickSort(a, i + 2, r);@@7
}

// The range is inclusive: quickSort(a, 0, a.size() - 1).`,
    java: `
// Median of the first, middle and last element: cheap insurance against the
// already-sorted input that makes a first-element pivot quadratic.
static int choosePivot(int[] a, int l, int r) {
    int m = l + (r - l) / 2;
    if ((a[l] <= a[m]) == (a[l] >= a[r])) return l;
    if ((a[m] <= a[l]) == (a[m] >= a[r])) return m;
    return r;
}

static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}

static void quickSort(int[] a, int l, int r) {@@0
    if (l >= r) return;

    swap(a, choosePivot(a, l, r), r);@@1
    int pivot = a[r], i = l - 1;@@2

    for (int j = l; j < r; j++) {@@3
        if (a[j] < pivot) {@@4
            i++;@@5
            swap(a, i, j);@@5
        }
    }
    swap(a, i + 1, r);@@6

    quickSort(a, l, i);@@7
    quickSort(a, i + 2, r);@@7
}

// The range is inclusive: quickSort(a, 0, a.length - 1).`,
    python: `
def choose_pivot(a, l, r):
    """Median of the first, middle and last element: cheap insurance against
    the already-sorted input that makes a first-element pivot quadratic."""
    m = l + (r - l) // 2
    if (a[l] <= a[m]) == (a[l] >= a[r]):
        return l
    if (a[m] <= a[l]) == (a[m] >= a[r]):
        return m
    return r


def quick_sort(a, l=0, r=None):@@0
    if r is None:
        r = len(a) - 1
    if l >= r:
        return a

    p = choose_pivot(a, l, r)@@1
    a[p], a[r] = a[r], a[p]@@1
    pivot, i = a[r], l - 1@@2

    for j in range(l, r):@@3
        if a[j] < pivot:@@4
            i += 1@@5
            a[i], a[j] = a[j], a[i]@@5
    a[i + 1], a[r] = a[r], a[i + 1]@@6

    quick_sort(a, l, i)@@7
    quick_sort(a, i + 2, r)@@7
    return a`,
    javascript: `
// Median of the first, middle and last element: cheap insurance against the
// already-sorted input that makes a first-element pivot quadratic.
function choosePivot(a, l, r) {
  const m = l + ((r - l) >> 1);
  if ((a[l] <= a[m]) === (a[l] >= a[r])) return l;
  if ((a[m] <= a[l]) === (a[m] >= a[r])) return m;
  return r;
}

function quickSort(a, l = 0, r = a.length - 1) {@@0
  if (l >= r) return a;

  const p = choosePivot(a, l, r);@@1
  [a[p], a[r]] = [a[r], a[p]];@@1
  const pivot = a[r];@@2
  let i = l - 1;@@2

  for (let j = l; j < r; j++) {@@3
    if (a[j] < pivot) {@@4
      i++;@@5
      [a[i], a[j]] = [a[j], a[i]];@@5
    }
  }
  [a[i + 1], a[r]] = [a[r], a[i + 1]];@@6

  quickSort(a, l, i);@@7
  quickSort(a, i + 2, r);@@7
  return a;
}`,
  },

  quick3: {
    c: `
static void swp(int a[], int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}

/* Three-way partitioning parks everything equal to the pivot in the middle
   band, so a run of duplicates is finished in one pass instead of being
   split and re-partitioned all the way down. */
void quickSort3Way(int a[], int lo, int hi) {
    if (lo >= hi) return;

    int m = lo + (hi - lo) / 2;
    if (a[m] < a[lo]) swp(a, m, lo);@@0
    if (a[hi] < a[lo]) swp(a, hi, lo);@@0
    if (a[hi] < a[m]) swp(a, hi, m);@@0
    swp(a, m, lo);@@0
    int pivot = a[lo];@@0

    int lt = lo, i = lo + 1, gt = hi;@@1
    while (i <= gt) {@@2
        if (a[i] < pivot) swp(a, lt++, i++);@@3
        else if (a[i] > pivot) swp(a, i, gt--);@@4
        else i++;@@5
    }

    quickSort3Way(a, lo, lt - 1);@@6
    quickSort3Way(a, gt + 1, hi);@@6
}`,
    cpp: `
// Three-way partitioning parks everything equal to the pivot in the middle
// band, so a run of duplicates is finished in one pass instead of being
// split and re-partitioned all the way down.
void quickSort3Way(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;

    int m = lo + (hi - lo) / 2;
    if (a[m] < a[lo]) std::swap(a[m], a[lo]);@@0
    if (a[hi] < a[lo]) std::swap(a[hi], a[lo]);@@0
    if (a[hi] < a[m]) std::swap(a[hi], a[m]);@@0
    std::swap(a[m], a[lo]);@@0
    int pivot = a[lo];@@0

    int lt = lo, i = lo + 1, gt = hi;@@1
    while (i <= gt) {@@2
        if (a[i] < pivot) std::swap(a[lt++], a[i++]);@@3
        else if (a[i] > pivot) std::swap(a[i], a[gt--]);@@4
        else ++i;@@5
    }

    quickSort3Way(a, lo, lt - 1);@@6
    quickSort3Way(a, gt + 1, hi);@@6
}`,
    java: `
static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}

// Three-way partitioning parks everything equal to the pivot in the middle
// band, so a run of duplicates is finished in one pass instead of being
// split and re-partitioned all the way down.
static void quickSort3Way(int[] a, int lo, int hi) {
    if (lo >= hi) return;

    int m = lo + (hi - lo) / 2;
    if (a[m] < a[lo]) swap(a, m, lo);@@0
    if (a[hi] < a[lo]) swap(a, hi, lo);@@0
    if (a[hi] < a[m]) swap(a, hi, m);@@0
    swap(a, m, lo);@@0
    int pivot = a[lo];@@0

    int lt = lo, i = lo + 1, gt = hi;@@1
    while (i <= gt) {@@2
        if (a[i] < pivot) swap(a, lt++, i++);@@3
        else if (a[i] > pivot) swap(a, i, gt--);@@4
        else i++;@@5
    }

    quickSort3Way(a, lo, lt - 1);@@6
    quickSort3Way(a, gt + 1, hi);@@6
}`,
    python: `
def quick_sort_3way(a, lo=0, hi=None):
    """Three-way partitioning parks everything equal to the pivot in the
    middle band, so a run of duplicates is finished in one pass instead of
    being split and re-partitioned all the way down."""
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:
        return a

    m = lo + (hi - lo) // 2
    if a[m] < a[lo]:@@0
        a[m], a[lo] = a[lo], a[m]@@0
    if a[hi] < a[lo]:@@0
        a[hi], a[lo] = a[lo], a[hi]@@0
    if a[hi] < a[m]:@@0
        a[hi], a[m] = a[m], a[hi]@@0
    a[m], a[lo] = a[lo], a[m]@@0
    pivot = a[lo]@@0

    lt, i, gt = lo, lo + 1, hi@@1
    while i <= gt:@@2
        if a[i] < pivot:@@3
            a[lt], a[i] = a[i], a[lt]@@3
            lt += 1@@3
            i += 1@@3
        elif a[i] > pivot:@@4
            a[i], a[gt] = a[gt], a[i]@@4
            gt -= 1@@4
        else:@@5
            i += 1@@5

    quick_sort_3way(a, lo, lt - 1)@@6
    quick_sort_3way(a, gt + 1, hi)@@6
    return a`,
    javascript: `
// Three-way partitioning parks everything equal to the pivot in the middle
// band, so a run of duplicates is finished in one pass instead of being
// split and re-partitioned all the way down.
function quickSort3Way(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;

  const m = lo + ((hi - lo) >> 1);
  if (a[m] < a[lo]) [a[m], a[lo]] = [a[lo], a[m]];@@0
  if (a[hi] < a[lo]) [a[hi], a[lo]] = [a[lo], a[hi]];@@0
  if (a[hi] < a[m]) [a[hi], a[m]] = [a[m], a[hi]];@@0
  [a[m], a[lo]] = [a[lo], a[m]];@@0
  const pivot = a[lo];@@0

  let lt = lo, i = lo + 1, gt = hi;@@1
  while (i <= gt) {@@2
    if (a[i] < pivot) {@@3
      [a[lt], a[i]] = [a[i], a[lt]];@@3
      lt++;@@3
      i++;@@3
    } else if (a[i] > pivot) {@@4
      [a[i], a[gt]] = [a[gt], a[i]];@@4
      gt--;@@4
    } else {@@5
      i++;@@5
    }
  }

  quickSort3Way(a, lo, lt - 1);@@6
  quickSort3Way(a, gt + 1, hi);@@6
  return a;
}`,
  },

  heap: {
    c: `
/* size is how much of the array is still heap; everything past it is
   already in its final place at the back. */
static void heapify(int a[], int i, int size) {@@4
    int largest = i;
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < size && a[l] > a[largest]) largest = l;@@5
    if (r < size && a[r] > a[largest]) largest = r;@@5

    if (largest != i) {@@6
        int t = a[i]; a[i] = a[largest]; a[largest] = t;@@7
        heapify(a, largest, size);@@7
    }
}

void heapSort(int a[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--) heapify(a, i, n);@@0

    for (int size = n - 1; size >= 1; size--) {@@1
        int t = a[0]; a[0] = a[size]; a[size] = t;@@2
        heapify(a, 0, size);@@3
    }
}`,
    cpp: `
// size is how much of the vector is still heap; everything past it is
// already in its final place at the back.
static void heapify(std::vector<int>& a, int i, int size) {@@4
    int largest = i;
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < size && a[l] > a[largest]) largest = l;@@5
    if (r < size && a[r] > a[largest]) largest = r;@@5

    if (largest != i) {@@6
        std::swap(a[i], a[largest]);@@7
        heapify(a, largest, size);@@7
    }
}

void heapSort(std::vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; --i) heapify(a, i, n);@@0

    for (int size = n - 1; size >= 1; --size) {@@1
        std::swap(a[0], a[size]);@@2
        heapify(a, 0, size);@@3
    }
}`,
    java: `
// size is how much of the array is still heap; everything past it is
// already in its final place at the back.
static void heapify(int[] a, int i, int size) {@@4
    int largest = i;
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < size && a[l] > a[largest]) largest = l;@@5
    if (r < size && a[r] > a[largest]) largest = r;@@5

    if (largest != i) {@@6
        int t = a[i]; a[i] = a[largest]; a[largest] = t;@@7
        heapify(a, largest, size);@@7
    }
}

static void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) heapify(a, i, n);@@0

    for (int size = n - 1; size >= 1; size--) {@@1
        int t = a[0]; a[0] = a[size]; a[size] = t;@@2
        heapify(a, 0, size);@@3
    }
}`,
    python: `
def heapify(a, i, size):@@4
    """size is how much of the list is still heap; everything past it is
    already in its final place at the back."""
    largest = i
    l, r = 2 * i + 1, 2 * i + 2
    if l < size and a[l] > a[largest]:@@5
        largest = l@@5
    if r < size and a[r] > a[largest]:@@5
        largest = r@@5

    if largest != i:@@6
        a[i], a[largest] = a[largest], a[i]@@7
        heapify(a, largest, size)@@7


def heap_sort(a):
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):@@0
        heapify(a, i, n)@@0

    for size in range(n - 1, 0, -1):@@1
        a[0], a[size] = a[size], a[0]@@2
        heapify(a, 0, size)@@3
    return a`,
    javascript: `
// size is how much of the array is still heap; everything past it is
// already in its final place at the back.
function heapify(a, i, size) {@@4
  let largest = i;
  const l = 2 * i + 1, r = 2 * i + 2;
  if (l < size && a[l] > a[largest]) largest = l;@@5
  if (r < size && a[r] > a[largest]) largest = r;@@5

  if (largest !== i) {@@6
    [a[i], a[largest]] = [a[largest], a[i]];@@7
    heapify(a, largest, size);@@7
  }
}

function heapSort(a) {
  const n = a.length;
  for (let i = (n >> 1) - 1; i >= 0; i--) heapify(a, i, n);@@0

  for (let size = n - 1; size >= 1; size--) {@@1
    [a[0], a[size]] = [a[size], a[0]];@@2
    heapify(a, 0, size);@@3
  }
  return a;
}`,
  },

  shell: {
    c: `
/* Shell's original gap sequence: halve until 1. The last pass is an
   ordinary insertion sort, which is what actually finishes the job; the
   wider gaps just get everything close to where it belongs first. */
void shellSort(int a[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {@@0
        for (int i = gap; i < n; i++) {@@1
            int j = i;
            while (j >= gap && a[j - gap] > a[j]) {@@2
                int t = a[j - gap];@@3
                a[j - gap] = a[j];@@3
                a[j] = t;@@3
                j -= gap;@@3
            }
        }
    }
}`,
    cpp: `
// Shell's original gap sequence: halve until 1. The last pass is an ordinary
// insertion sort, which is what actually finishes the job; the wider gaps
// just get everything close to where it belongs first.
void shellSort(std::vector<int>& a) {
    int n = a.size();
    for (int gap = n / 2; gap > 0; gap /= 2) {@@0
        for (int i = gap; i < n; ++i) {@@1
            int j = i;
            while (j >= gap && a[j - gap] > a[j]) {@@2
                std::swap(a[j - gap], a[j]);@@3
                j -= gap;@@3
            }
        }
    }
}`,
    java: `
// Shell's original gap sequence: halve until 1. The last pass is an ordinary
// insertion sort, which is what actually finishes the job; the wider gaps
// just get everything close to where it belongs first.
static void shellSort(int[] a) {
    int n = a.length;
    for (int gap = n / 2; gap > 0; gap /= 2) {@@0
        for (int i = gap; i < n; i++) {@@1
            int j = i;
            while (j >= gap && a[j - gap] > a[j]) {@@2
                int t = a[j - gap];@@3
                a[j - gap] = a[j];@@3
                a[j] = t;@@3
                j -= gap;@@3
            }
        }
    }
}`,
    python: `
def shell_sort(a):
    """Shell's original gap sequence: halve until 1. The last pass is an
    ordinary insertion sort, which is what actually finishes the job; the
    wider gaps just get everything close to where it belongs first."""
    n = len(a)
    gap = n // 2
    while gap > 0:@@0
        for i in range(gap, n):@@1
            j = i
            while j >= gap and a[j - gap] > a[j]:@@2
                a[j - gap], a[j] = a[j], a[j - gap]@@3
                j -= gap@@3
        gap //= 2@@0
    return a`,
    javascript: `
// Shell's original gap sequence: halve until 1. The last pass is an ordinary
// insertion sort, which is what actually finishes the job; the wider gaps
// just get everything close to where it belongs first.
function shellSort(a) {
  const n = a.length;
  for (let gap = n >> 1; gap > 0; gap >>= 1) {@@0
    for (let i = gap; i < n; i++) {@@1
      let j = i;
      while (j >= gap && a[j - gap] > a[j]) {@@2
        [a[j - gap], a[j]] = [a[j], a[j - gap]];@@3
        j -= gap;@@3
      }
    }
  }
  return a;
}`,
  },

  comb: {
    c: `
/* 1.3 is the shrink factor from the original paper. The loop cannot stop
   merely because the gap reached 1: a gap-1 pass is an ordinary bubble
   pass, and one of those proves nothing until it sweeps without swapping. */
void combSort(int a[], int n) {
    int gap = n, swapped = 1;@@0

    while (gap > 1 || swapped) {@@1
        gap = (int)(gap / 1.3);@@2
        if (gap < 1) gap = 1;@@2
        swapped = 0;@@2

        for (int i = 0; i + gap < n; i++) {@@3
            if (a[i] > a[i + gap]) {@@3
                int t = a[i]; a[i] = a[i + gap]; a[i + gap] = t;@@3
                swapped = 1;@@3
            }
        }
    }
}`,
    cpp: `
// 1.3 is the shrink factor from the original paper. The loop cannot stop
// merely because the gap reached 1: a gap-1 pass is an ordinary bubble pass,
// and one of those proves nothing until it sweeps without swapping.
void combSort(std::vector<int>& a) {
    int n = a.size();
    int gap = n;
    bool swapped = true;@@0

    while (gap > 1 || swapped) {@@1
        gap = std::max(1, (int)(gap / 1.3));@@2
        swapped = false;@@2

        for (int i = 0; i + gap < n; ++i) {@@3
            if (a[i] > a[i + gap]) {@@3
                std::swap(a[i], a[i + gap]);@@3
                swapped = true;@@3
            }
        }
    }
}`,
    java: `
// 1.3 is the shrink factor from the original paper. The loop cannot stop
// merely because the gap reached 1: a gap-1 pass is an ordinary bubble pass,
// and one of those proves nothing until it sweeps without swapping.
static void combSort(int[] a) {
    int n = a.length;
    int gap = n;
    boolean swapped = true;@@0

    while (gap > 1 || swapped) {@@1
        gap = Math.max(1, (int) (gap / 1.3));@@2
        swapped = false;@@2

        for (int i = 0; i + gap < n; i++) {@@3
            if (a[i] > a[i + gap]) {@@3
                int t = a[i]; a[i] = a[i + gap]; a[i + gap] = t;@@3
                swapped = true;@@3
            }
        }
    }
}`,
    python: `
def comb_sort(a):
    """1.3 is the shrink factor from the original paper. The loop cannot stop
    merely because the gap reached 1: a gap-1 pass is an ordinary bubble pass,
    and one of those proves nothing until it sweeps without swapping."""
    n = len(a)
    gap, swapped = n, True@@0

    while gap > 1 or swapped:@@1
        gap = max(1, int(gap / 1.3))@@2
        swapped = False@@2

        for i in range(n - gap):@@3
            if a[i] > a[i + gap]:@@3
                a[i], a[i + gap] = a[i + gap], a[i]@@3
                swapped = True@@3
    return a`,
    javascript: `
// 1.3 is the shrink factor from the original paper. The loop cannot stop
// merely because the gap reached 1: a gap-1 pass is an ordinary bubble pass,
// and one of those proves nothing until it sweeps without swapping.
function combSort(a) {
  const n = a.length;
  let gap = n;
  let swapped = true;@@0

  while (gap > 1 || swapped) {@@1
    gap = Math.max(1, Math.floor(gap / 1.3));@@2
    swapped = false;@@2

    for (let i = 0; i + gap < n; i++) {@@3
      if (a[i] > a[i + gap]) {@@3
        [a[i], a[i + gap]] = [a[i + gap], a[i]];@@3
        swapped = true;@@3
      }
    }
  }
  return a;
}`,
  },

  cycle: {
    c: `
/* Cycle sort writes every element exactly once, which is the point: it is
   the sort you want when a write is expensive (EEPROM, flash) even though
   it does a quadratic number of comparisons to find each destination. */
void cycleSort(int a[], int n) {
    for (int start = 0; start < n - 1; start++) {@@0
        int item = a[start];@@1

        int pos = start;@@2
        for (int i = start + 1; i < n; i++)@@2
            if (a[i] < item) pos++;@@2
        if (pos == start) continue;

        while (item == a[pos]) pos++;@@3

        int t = a[pos]; a[pos] = item; item = t;@@4

        /* Keep placing whatever was displaced until the cycle closes. */
        while (pos != start) {@@4
            pos = start;@@2
            for (int i = start + 1; i < n; i++)@@2
                if (a[i] < item) pos++;@@2
            while (item == a[pos]) pos++;@@3
            t = a[pos]; a[pos] = item; item = t;@@4
        }
    }
}`,
    cpp: `
// Cycle sort writes every element exactly once, which is the point: it is
// the sort you want when a write is expensive (EEPROM, flash) even though it
// does a quadratic number of comparisons to find each destination.
void cycleSort(std::vector<int>& a) {
    int n = a.size();
    for (int start = 0; start < n - 1; ++start) {@@0
        int item = a[start];@@1

        int pos = start;@@2
        for (int i = start + 1; i < n; ++i)@@2
            if (a[i] < item) ++pos;@@2
        if (pos == start) continue;

        while (item == a[pos]) ++pos;@@3
        std::swap(item, a[pos]);@@4

        // Keep placing whatever was displaced until the cycle closes.
        while (pos != start) {@@4
            pos = start;@@2
            for (int i = start + 1; i < n; ++i)@@2
                if (a[i] < item) ++pos;@@2
            while (item == a[pos]) ++pos;@@3
            std::swap(item, a[pos]);@@4
        }
    }
}`,
    java: `
// Cycle sort writes every element exactly once, which is the point: it is
// the sort you want when a write is expensive (EEPROM, flash) even though it
// does a quadratic number of comparisons to find each destination.
static void cycleSort(int[] a) {
    int n = a.length;
    for (int start = 0; start < n - 1; start++) {@@0
        int item = a[start];@@1

        int pos = start;@@2
        for (int i = start + 1; i < n; i++)@@2
            if (a[i] < item) pos++;@@2
        if (pos == start) continue;

        while (item == a[pos]) pos++;@@3

        int t = a[pos]; a[pos] = item; item = t;@@4

        // Keep placing whatever was displaced until the cycle closes.
        while (pos != start) {@@4
            pos = start;@@2
            for (int i = start + 1; i < n; i++)@@2
                if (a[i] < item) pos++;@@2
            while (item == a[pos]) pos++;@@3
            t = a[pos]; a[pos] = item; item = t;@@4
        }
    }
}`,
    python: `
def cycle_sort(a):
    """Cycle sort writes every element exactly once, which is the point: it is
    the sort you want when a write is expensive (EEPROM, flash) even though it
    does a quadratic number of comparisons to find each destination."""
    n = len(a)
    for start in range(n - 1):@@0
        item = a[start]@@1

        pos = start@@2
        for i in range(start + 1, n):@@2
            if a[i] < item:@@2
                pos += 1@@2
        if pos == start:
            continue

        while item == a[pos]:@@3
            pos += 1@@3
        a[pos], item = item, a[pos]@@4

        # Keep placing whatever was displaced until the cycle closes.
        while pos != start:@@4
            pos = start@@2
            for i in range(start + 1, n):@@2
                if a[i] < item:@@2
                    pos += 1@@2
            while item == a[pos]:@@3
                pos += 1@@3
            a[pos], item = item, a[pos]@@4
    return a`,
    javascript: `
// Cycle sort writes every element exactly once, which is the point: it is
// the sort you want when a write is expensive (EEPROM, flash) even though it
// does a quadratic number of comparisons to find each destination.
function cycleSort(a) {
  const n = a.length;
  for (let start = 0; start < n - 1; start++) {@@0
    let item = a[start];@@1

    let pos = start;@@2
    for (let i = start + 1; i < n; i++)@@2
      if (a[i] < item) pos++;@@2
    if (pos === start) continue;

    while (item === a[pos]) pos++;@@3
    [a[pos], item] = [item, a[pos]];@@4

    // Keep placing whatever was displaced until the cycle closes.
    while (pos !== start) {@@4
      pos = start;@@2
      for (let i = start + 1; i < n; i++)@@2
        if (a[i] < item) pos++;@@2
      while (item === a[pos]) pos++;@@3
      [a[pos], item] = [item, a[pos]];@@4
    }
  }
  return a;
}`,
  },

  counting: {
    c: `
/* Not a comparison sort: it never asks which of two values is larger, so the
   n log n lower bound does not apply. The price is a count array as wide as
   the range of the data. */
void countingSort(int a[], int n, int k) {
    int *count = calloc(k + 1, sizeof(int));
    int *out = malloc(n * sizeof(int));

    for (int i = 0; i < n; i++) count[a[i]]++;@@0

    for (int v = 1; v <= k; v++) count[v] += count[v - 1];@@1

    /* Walking backwards is what makes it stable: the last equal element is
       placed last, so equal values keep their original order. */
    for (int i = n - 1; i >= 0; i--) out[--count[a[i]]] = a[i];@@2

    for (int i = 0; i < n; i++) a[i] = out[i];
    free(count);
    free(out);
}`,
    cpp: `
// Not a comparison sort: it never asks which of two values is larger, so the
// n log n lower bound does not apply. The price is a count array as wide as
// the range of the data.
void countingSort(std::vector<int>& a, int k) {
    int n = a.size();
    std::vector<int> count(k + 1, 0), out(n);

    for (int i = 0; i < n; ++i) count[a[i]]++;@@0

    for (int v = 1; v <= k; ++v) count[v] += count[v - 1];@@1

    // Walking backwards is what makes it stable: the last equal element is
    // placed last, so equal values keep their original order.
    for (int i = n - 1; i >= 0; --i) out[--count[a[i]]] = a[i];@@2

    a = out;
}`,
    java: `
// Not a comparison sort: it never asks which of two values is larger, so the
// n log n lower bound does not apply. The price is a count array as wide as
// the range of the data.
static void countingSort(int[] a, int k) {
    int n = a.length;
    int[] count = new int[k + 1];
    int[] out = new int[n];

    for (int i = 0; i < n; i++) count[a[i]]++;@@0

    for (int v = 1; v <= k; v++) count[v] += count[v - 1];@@1

    // Walking backwards is what makes it stable: the last equal element is
    // placed last, so equal values keep their original order.
    for (int i = n - 1; i >= 0; i--) out[--count[a[i]]] = a[i];@@2

    System.arraycopy(out, 0, a, 0, n);
}`,
    python: `
def counting_sort(a):
    """Not a comparison sort: it never asks which of two values is larger, so
    the n log n lower bound does not apply. The price is a count array as wide
    as the range of the data."""
    if not a:
        return a
    k = max(a)
    count = [0] * (k + 1)
    out = [0] * len(a)

    for x in a:@@0
        count[x] += 1@@0

    for v in range(1, k + 1):@@1
        count[v] += count[v - 1]@@1

    # Walking backwards is what makes it stable: the last equal element is
    # placed last, so equal values keep their original order.
    for i in range(len(a) - 1, -1, -1):@@2
        count[a[i]] -= 1@@2
        out[count[a[i]]] = a[i]@@2

    a[:] = out
    return a`,
    javascript: `
// Not a comparison sort: it never asks which of two values is larger, so the
// n log n lower bound does not apply. The price is a count array as wide as
// the range of the data.
function countingSort(a) {
  if (a.length === 0) return a;
  const k = Math.max(...a);
  const count = new Array(k + 1).fill(0);
  const out = new Array(a.length);

  for (const x of a) count[x]++;@@0

  for (let v = 1; v <= k; v++) count[v] += count[v - 1];@@1

  // Walking backwards is what makes it stable: the last equal element is
  // placed last, so equal values keep their original order.
  for (let i = a.length - 1; i >= 0; i--) out[--count[a[i]]] = a[i];@@2

  for (let i = 0; i < a.length; i++) a[i] = out[i];
  return a;
}`,
  },

  comparisonCounting: {
    c: `
/* Counts, for every element, how many elements belong in front of it — that
   count is its final index. Quadratic, but it computes each destination
   independently, so the whole thing parallelises trivially. */
void comparisonCountingSort(int a[], int n) {
    int *count = malloc(n * sizeof(int));
    int *out = malloc(n * sizeof(int));

    for (int i = 0; i < n; i++) {@@0
        count[i] = 0;@@1
        for (int j = 0; j < n; j++) {@@2
            /* The tie-break on index is what keeps it stable: of two equal
               values, the earlier one is counted as smaller. */
            if (a[j] < a[i] || (a[j] == a[i] && j < i))@@3
                count[i]++;@@4
        }
    }

    for (int i = 0; i < n; i++)@@5
        out[count[i]] = a[i];@@6

    for (int i = 0; i < n; i++) a[i] = out[i];
    free(count);
    free(out);
}`,
    cpp: `
// Counts, for every element, how many elements belong in front of it — that
// count is its final index. Quadratic, but it computes each destination
// independently, so the whole thing parallelises trivially.
void comparisonCountingSort(std::vector<int>& a) {
    int n = a.size();
    std::vector<int> count(n, 0), out(n);

    for (int i = 0; i < n; ++i) {@@0
        count[i] = 0;@@1
        for (int j = 0; j < n; ++j) {@@2
            // The tie-break on index is what keeps it stable: of two equal
            // values, the earlier one is counted as smaller.
            if (a[j] < a[i] || (a[j] == a[i] && j < i))@@3
                count[i]++;@@4
        }
    }

    for (int i = 0; i < n; ++i)@@5
        out[count[i]] = a[i];@@6

    a = out;
}`,
    java: `
// Counts, for every element, how many elements belong in front of it — that
// count is its final index. Quadratic, but it computes each destination
// independently, so the whole thing parallelises trivially.
static void comparisonCountingSort(int[] a) {
    int n = a.length;
    int[] count = new int[n];
    int[] out = new int[n];

    for (int i = 0; i < n; i++) {@@0
        count[i] = 0;@@1
        for (int j = 0; j < n; j++) {@@2
            // The tie-break on index is what keeps it stable: of two equal
            // values, the earlier one is counted as smaller.
            if (a[j] < a[i] || (a[j] == a[i] && j < i))@@3
                count[i]++;@@4
        }
    }

    for (int i = 0; i < n; i++)@@5
        out[count[i]] = a[i];@@6

    System.arraycopy(out, 0, a, 0, n);
}`,
    python: `
def comparison_counting_sort(a):
    """Counts, for every element, how many elements belong in front of it —
    that count is its final index. Quadratic, but it computes each destination
    independently, so the whole thing parallelises trivially."""
    n = len(a)
    count = [0] * n
    out = [0] * n

    for i in range(n):@@0
        count[i] = 0@@1
        for j in range(n):@@2
            # The tie-break on index is what keeps it stable: of two equal
            # values, the earlier one is counted as smaller.
            if a[j] < a[i] or (a[j] == a[i] and j < i):@@3
                count[i] += 1@@4

    for i in range(n):@@5
        out[count[i]] = a[i]@@6

    a[:] = out
    return a`,
    javascript: `
// Counts, for every element, how many elements belong in front of it — that
// count is its final index. Quadratic, but it computes each destination
// independently, so the whole thing parallelises trivially.
function comparisonCountingSort(a) {
  const n = a.length;
  const count = new Array(n).fill(0);
  const out = new Array(n);

  for (let i = 0; i < n; i++) {@@0
    count[i] = 0;@@1
    for (let j = 0; j < n; j++) {@@2
      // The tie-break on index is what keeps it stable: of two equal values,
      // the earlier one is counted as smaller.
      if (a[j] < a[i] || (a[j] === a[i] && j < i))@@3
        count[i]++;@@4
    }
  }

  for (let i = 0; i < n; i++)@@5
    out[count[i]] = a[i];@@6

  for (let i = 0; i < n; i++) a[i] = out[i];
  return a;
}`,
  },

  radix: {
    c: `
/* Least-significant digit first. The passes only work in that order because
   each one is stable: a later pass on a higher digit leaves elements with
   equal digits in the order the earlier passes put them. */
void radixSort(int a[], int n) {
    int max = a[0];
    for (int i = 1; i < n; i++) if (a[i] > max) max = a[i];

    int *out = malloc(n * sizeof(int));

    for (int exp = 1; max / exp > 0; exp *= 10) {@@0
        int count[10] = {0};

        for (int i = 0; i < n; i++) count[(a[i] / exp) % 10]++;@@1
        for (int d = 1; d < 10; d++) count[d] += count[d - 1];@@1

        for (int i = n - 1; i >= 0; i--)@@2
            out[--count[(a[i] / exp) % 10]] = a[i];@@2

        for (int i = 0; i < n; i++) a[i] = out[i];@@2
    }
    free(out);
}`,
    cpp: `
// Least-significant digit first. The passes only work in that order because
// each one is stable: a later pass on a higher digit leaves elements with
// equal digits in the order the earlier passes put them.
void radixSort(std::vector<int>& a) {
    int n = a.size();
    int max = *std::max_element(a.begin(), a.end());
    std::vector<int> out(n);

    for (int exp = 1; max / exp > 0; exp *= 10) {@@0
        std::vector<int> count(10, 0);

        for (int i = 0; i < n; ++i) count[(a[i] / exp) % 10]++;@@1
        for (int d = 1; d < 10; ++d) count[d] += count[d - 1];@@1

        for (int i = n - 1; i >= 0; --i)@@2
            out[--count[(a[i] / exp) % 10]] = a[i];@@2

        a = out;@@2
    }
}`,
    java: `
// Least-significant digit first. The passes only work in that order because
// each one is stable: a later pass on a higher digit leaves elements with
// equal digits in the order the earlier passes put them.
static void radixSort(int[] a) {
    int n = a.length;
    int max = Arrays.stream(a).max().getAsInt();
    int[] out = new int[n];

    for (int exp = 1; max / exp > 0; exp *= 10) {@@0
        int[] count = new int[10];

        for (int i = 0; i < n; i++) count[(a[i] / exp) % 10]++;@@1
        for (int d = 1; d < 10; d++) count[d] += count[d - 1];@@1

        for (int i = n - 1; i >= 0; i--)@@2
            out[--count[(a[i] / exp) % 10]] = a[i];@@2

        System.arraycopy(out, 0, a, 0, n);@@2
    }
}`,
    python: `
def radix_sort(a):
    """Least-significant digit first. The passes only work in that order
    because each one is stable: a later pass on a higher digit leaves elements
    with equal digits in the order the earlier passes put them."""
    if not a:
        return a
    largest = max(a)
    exp = 1

    while largest // exp > 0:@@0
        buckets = [[] for _ in range(10)]

        for x in a:@@1
            buckets[(x // exp) % 10].append(x)@@1

        a[:] = [x for bucket in buckets for x in bucket]@@2
        exp *= 10@@0
    return a`,
    javascript: `
// Least-significant digit first. The passes only work in that order because
// each one is stable: a later pass on a higher digit leaves elements with
// equal digits in the order the earlier passes put them.
function radixSort(a) {
  if (a.length === 0) return a;
  const largest = Math.max(...a);

  for (let exp = 1; Math.floor(largest / exp) > 0; exp *= 10) {@@0
    const buckets = Array.from({ length: 10 }, () => []);

    for (const x of a) buckets[Math.floor(x / exp) % 10].push(x);@@1

    let k = 0;@@2
    for (const bucket of buckets) for (const x of bucket) a[k++] = x;@@2
  }
  return a;
}`,
  },

  bucket: {
    c: `
/* Linear only when the values spread evenly across the buckets: the sort
   itself does almost nothing, and the distribution of the data — not its
   size — decides how much work the per-bucket insertion sorts do. */
void bucketSort(int a[], int n) {
    if (n <= 0) return;
    int k = n / 2 > 0 ? n / 2 : 1;

    int min = a[0], max = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < min) min = a[i];
        if (a[i] > max) max = a[i];
    }
    /* +1 so a constant array still spans a range of at least one. */
    int span = max - min + 1;

    int *sizes = calloc(k, sizeof(int));
    int **buckets = malloc(k * sizeof(int *));
    for (int b = 0; b < k; b++) buckets[b] = malloc(n * sizeof(int));

    for (int i = 0; i < n; i++) {@@0
        long idx = (long)(a[i] - min) * k / span;@@0
        if (idx > k - 1) idx = k - 1;@@0
        buckets[idx][sizes[idx]++] = a[i];@@0
    }

    int write = 0;
    for (int b = 0; b < k; b++) {@@1
        /* Buckets are meant to be short, and on a short arbitrary list
           nothing beats insertion sort. */
        for (int i = 1; i < sizes[b]; i++) {@@2
            int held = buckets[b][i];@@2
            int j = i - 1;@@2
            while (j >= 0 && buckets[b][j] > held) {@@2
                buckets[b][j + 1] = buckets[b][j];@@2
                j--;@@2
            }
            buckets[b][j + 1] = held;@@2
        }
        for (int i = 0; i < sizes[b]; i++) a[write++] = buckets[b][i];@@3
        free(buckets[b]);
    }
    free(buckets);
    free(sizes);
}`,
    cpp: `
// Linear only when the values spread evenly across the buckets: the sort
// itself does almost nothing, and the distribution of the data — not its
// size — decides how much work the per-bucket insertion sorts do.
void bucketSort(std::vector<int>& a) {
    int n = a.size();
    if (n == 0) return;
    int k = std::max(1, n / 2);

    int min = *std::min_element(a.begin(), a.end());
    int max = *std::max_element(a.begin(), a.end());
    // +1 so a constant array still spans a range of at least one.
    int span = max - min + 1;

    std::vector<std::vector<int>> buckets(k);
    for (int i = 0; i < n; ++i) {@@0
        int idx = std::min(k - 1, (int)((long long)(a[i] - min) * k / span));@@0
        buckets[idx].push_back(a[i]);@@0
    }

    int write = 0;
    for (int b = 0; b < k; ++b) {@@1
        // Buckets are meant to be short, and on a short arbitrary list
        // nothing beats insertion sort.
        for (size_t i = 1; i < buckets[b].size(); ++i) {@@2
            int held = buckets[b][i];@@2
            int j = (int)i - 1;@@2
            while (j >= 0 && buckets[b][j] > held) {@@2
                buckets[b][j + 1] = buckets[b][j];@@2
                --j;@@2
            }
            buckets[b][j + 1] = held;@@2
        }
        for (int x : buckets[b]) a[write++] = x;@@3
    }
}`,
    java: `
// Linear only when the values spread evenly across the buckets: the sort
// itself does almost nothing, and the distribution of the data — not its
// size — decides how much work the per-bucket insertion sorts do.
static void bucketSort(int[] a) {
    int n = a.length;
    if (n == 0) return;
    int k = Math.max(1, n / 2);

    int min = Arrays.stream(a).min().getAsInt();
    int max = Arrays.stream(a).max().getAsInt();
    // +1 so a constant array still spans a range of at least one.
    int span = max - min + 1;

    List<List<Integer>> buckets = new ArrayList<>();
    for (int b = 0; b < k; b++) buckets.add(new ArrayList<>());

    for (int i = 0; i < n; i++) {@@0
        int idx = Math.min(k - 1, (int) ((long) (a[i] - min) * k / span));@@0
        buckets.get(idx).add(a[i]);@@0
    }

    int write = 0;
    for (int b = 0; b < k; b++) {@@1
        List<Integer> bucket = buckets.get(b);
        // Buckets are meant to be short, and on a short arbitrary list
        // nothing beats insertion sort.
        for (int i = 1; i < bucket.size(); i++) {@@2
            int held = bucket.get(i);@@2
            int j = i - 1;@@2
            while (j >= 0 && bucket.get(j) > held) {@@2
                bucket.set(j + 1, bucket.get(j));@@2
                j--;@@2
            }
            bucket.set(j + 1, held);@@2
        }
        for (int x : bucket) a[write++] = x;@@3
    }
}`,
    python: `
def bucket_sort(a):
    """Linear only when the values spread evenly across the buckets: the sort
    itself does almost nothing, and the distribution of the data — not its
    size — decides how much work the per-bucket insertion sorts do."""
    n = len(a)
    if n == 0:
        return a
    k = max(1, n // 2)

    low, high = min(a), max(a)
    # +1 so a constant list still spans a range of at least one.
    span = high - low + 1

    buckets = [[] for _ in range(k)]
    for x in a:@@0
        idx = min(k - 1, (x - low) * k // span)@@0
        buckets[idx].append(x)@@0

    write = 0
    for bucket in buckets:@@1
        # Buckets are meant to be short, and on a short arbitrary list
        # nothing beats insertion sort.
        for i in range(1, len(bucket)):@@2
            held = bucket[i]@@2
            j = i - 1@@2
            while j >= 0 and bucket[j] > held:@@2
                bucket[j + 1] = bucket[j]@@2
                j -= 1@@2
            bucket[j + 1] = held@@2
        for x in bucket:@@3
            a[write] = x@@3
            write += 1@@3
    return a`,
    javascript: `
// Linear only when the values spread evenly across the buckets: the sort
// itself does almost nothing, and the distribution of the data — not its
// size — decides how much work the per-bucket insertion sorts do.
function bucketSort(a) {
  const n = a.length;
  if (n === 0) return a;
  const k = Math.max(1, n >> 1);

  const low = Math.min(...a);
  const high = Math.max(...a);
  // +1 so a constant array still spans a range of at least one.
  const span = high - low + 1;

  const buckets = Array.from({ length: k }, () => []);
  for (const x of a) {@@0
    const idx = Math.min(k - 1, Math.floor(((x - low) / span) * k));@@0
    buckets[idx].push(x);@@0
  }

  let write = 0;
  for (const bucket of buckets) {@@1
    // Buckets are meant to be short, and on a short arbitrary list nothing
    // beats insertion sort.
    for (let i = 1; i < bucket.length; i++) {@@2
      const held = bucket[i];@@2
      let j = i - 1;@@2
      while (j >= 0 && bucket[j] > held) {@@2
        bucket[j + 1] = bucket[j];@@2
        j--;@@2
      }
      bucket[j + 1] = held;@@2
    }
    for (const x of bucket) a[write++] = x;@@3
  }
  return a;
}`,
  },

  bitonic: {
    c: `
/* The comparisons are fixed in advance — which pairs get compared never
   depends on the data — which is what makes this the sort you build in
   hardware or run on a GPU. The power-of-two split below is the trick that
   lets it work for any length, not just powers of two. */
static int greatestPowerOfTwoLessThan(int n) {
    int k = 1;
    while (k < n) k <<= 1;
    return k >> 1;
}

static void bitonicMerge(int a[], int lo, int len, int dir) {@@2
    if (len <= 1) return;
    int m = greatestPowerOfTwoLessThan(len);@@2

    for (int i = lo; i < lo + len - m; i++) {@@3
        if ((a[i] > a[i + m]) == dir) {@@3
            int t = a[i]; a[i] = a[i + m]; a[i + m] = t;@@3
        }
    }

    bitonicMerge(a, lo, m, dir);@@4
    bitonicMerge(a, lo + m, len - m, dir);@@4
}

void bitonicSort(int a[], int lo, int len, int dir) {@@0
    if (len <= 1) return;
    int m = len / 2;
    /* One half ascending and the other descending is what makes the whole
       range bitonic, which is the only thing the merge needs. */
    bitonicSort(a, lo, m, !dir);@@0
    bitonicSort(a, lo + m, len - m, dir);@@0
    bitonicMerge(a, lo, len, dir);@@1
}

/* Ascending over the whole array: bitonicSort(a, 0, n, 1). */`,
    cpp: `
// The comparisons are fixed in advance — which pairs get compared never
// depends on the data — which is what makes this the sort you build in
// hardware or run on a GPU. The power-of-two split below is the trick that
// lets it work for any length, not just powers of two.
static int greatestPowerOfTwoLessThan(int n) {
    int k = 1;
    while (k < n) k <<= 1;
    return k >> 1;
}

static void bitonicMerge(std::vector<int>& a, int lo, int len, bool dir) {@@2
    if (len <= 1) return;
    int m = greatestPowerOfTwoLessThan(len);@@2

    for (int i = lo; i < lo + len - m; ++i) {@@3
        if ((a[i] > a[i + m]) == dir) std::swap(a[i], a[i + m]);@@3
    }

    bitonicMerge(a, lo, m, dir);@@4
    bitonicMerge(a, lo + m, len - m, dir);@@4
}

void bitonicSort(std::vector<int>& a, int lo, int len, bool dir) {@@0
    if (len <= 1) return;
    int m = len / 2;
    // One half ascending and the other descending is what makes the whole
    // range bitonic, which is the only thing the merge needs.
    bitonicSort(a, lo, m, !dir);@@0
    bitonicSort(a, lo + m, len - m, dir);@@0
    bitonicMerge(a, lo, len, dir);@@1
}

// Ascending over the whole vector: bitonicSort(a, 0, a.size(), true).`,
    java: `
// The comparisons are fixed in advance — which pairs get compared never
// depends on the data — which is what makes this the sort you build in
// hardware or run on a GPU. The power-of-two split below is the trick that
// lets it work for any length, not just powers of two.
static int greatestPowerOfTwoLessThan(int n) {
    int k = 1;
    while (k < n) k <<= 1;
    return k >> 1;
}

static void bitonicMerge(int[] a, int lo, int len, boolean dir) {@@2
    if (len <= 1) return;
    int m = greatestPowerOfTwoLessThan(len);@@2

    for (int i = lo; i < lo + len - m; i++) {@@3
        if ((a[i] > a[i + m]) == dir) {@@3
            int t = a[i]; a[i] = a[i + m]; a[i + m] = t;@@3
        }
    }

    bitonicMerge(a, lo, m, dir);@@4
    bitonicMerge(a, lo + m, len - m, dir);@@4
}

static void bitonicSort(int[] a, int lo, int len, boolean dir) {@@0
    if (len <= 1) return;
    int m = len / 2;
    // One half ascending and the other descending is what makes the whole
    // range bitonic, which is the only thing the merge needs.
    bitonicSort(a, lo, m, !dir);@@0
    bitonicSort(a, lo + m, len - m, dir);@@0
    bitonicMerge(a, lo, len, dir);@@1
}

// Ascending over the whole array: bitonicSort(a, 0, a.length, true).`,
    python: `
def greatest_power_of_two_less_than(n):
    k = 1
    while k < n:
        k <<= 1
    return k >> 1


def bitonic_merge(a, lo, length, ascending):@@2
    if length <= 1:
        return
    m = greatest_power_of_two_less_than(length)@@2

    for i in range(lo, lo + length - m):@@3
        if (a[i] > a[i + m]) == ascending:@@3
            a[i], a[i + m] = a[i + m], a[i]@@3

    bitonic_merge(a, lo, m, ascending)@@4
    bitonic_merge(a, lo + m, length - m, ascending)@@4


def bitonic_sort(a, lo=0, length=None, ascending=True):@@0
    """The comparisons are fixed in advance — which pairs get compared never
    depends on the data — which is what makes this the sort you build in
    hardware or run on a GPU."""
    if length is None:
        length = len(a)
    if length <= 1:
        return a
    m = length // 2
    # One half ascending and the other descending is what makes the whole
    # range bitonic, which is the only thing the merge needs.
    bitonic_sort(a, lo, m, not ascending)@@0
    bitonic_sort(a, lo + m, length - m, ascending)@@0
    bitonic_merge(a, lo, length, ascending)@@1
    return a`,
    javascript: `
// The comparisons are fixed in advance — which pairs get compared never
// depends on the data — which is what makes this the sort you build in
// hardware or run on a GPU. The power-of-two split below is the trick that
// lets it work for any length, not just powers of two.
function greatestPowerOfTwoLessThan(n) {
  let k = 1;
  while (k < n) k <<= 1;
  return k >> 1;
}

function bitonicMerge(a, lo, len, dir) {@@2
  if (len <= 1) return;
  const m = greatestPowerOfTwoLessThan(len);@@2

  for (let i = lo; i < lo + len - m; i++) {@@3
    if ((a[i] > a[i + m]) === dir) [a[i], a[i + m]] = [a[i + m], a[i]];@@3
  }

  bitonicMerge(a, lo, m, dir);@@4
  bitonicMerge(a, lo + m, len - m, dir);@@4
}

function bitonicSort(a, lo = 0, len = a.length, dir = true) {@@0
  if (len <= 1) return a;
  const m = len >> 1;
  // One half ascending and the other descending is what makes the whole
  // range bitonic, which is the only thing the merge needs.
  bitonicSort(a, lo, m, !dir);@@0
  bitonicSort(a, lo + m, len - m, dir);@@0
  bitonicMerge(a, lo, len, dir);@@1
  return a;
}`,
  },

  intro: {
    c: `
/* What std::sort actually is: quicksort until it misbehaves, then a
   guaranteed O(n log n) fallback. Two escape hatches — a depth limit that
   switches to heapsort, and a size floor that leaves short ranges to one
   final insertion pass. */
#define SMALL 8

static int partition(int a[], int lo, int hi) {@@3
    int mid = lo + (hi - lo) / 2;
    /* Median of three, moved to the end as the pivot. */
    if (a[mid] < a[lo]) { int t = a[mid]; a[mid] = a[lo]; a[lo] = t; }
    if (a[hi] < a[lo]) { int t = a[hi]; a[hi] = a[lo]; a[lo] = t; }
    if (a[hi] < a[mid]) { int t = a[hi]; a[hi] = a[mid]; a[mid] = t; }
    int t = a[mid]; a[mid] = a[hi]; a[hi] = t;

    int pivot = a[hi], i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {@@4
            i++;
            int s = a[i]; a[i] = a[j]; a[j] = s;@@5
        }
    }
    int s = a[i + 1]; a[i + 1] = a[hi]; a[hi] = s;@@5
    return i + 1;
}

static void introsort(int a[], int lo, int hi, int depthLimit) {
    while (hi - lo + 1 > SMALL) {@@0
        if (depthLimit == 0) {@@1
            heapSortRange(a, lo, hi);@@1
            return;@@1
        }
        depthLimit--;@@2

        int p = partition(a, lo, hi);@@3
        /* Recurse into the smaller side, loop on the larger: that caps the
           call stack at O(log n) whatever the pivots do. */
        if (p - lo < hi - p) {
            introsort(a, lo, p - 1, depthLimit);
            lo = p + 1;
        } else {
            introsort(a, p + 1, hi, depthLimit);
            hi = p - 1;
        }
    }
}

void introSort(int a[], int n) {
    int depthLimit = 2 * (int)log2((double)n);
    introsort(a, 0, n - 1, depthLimit);

    /* Every remaining range is short and already close to home, so one pass
       over the whole array is cheaper than sorting each range separately. */
    insertionSort(a, n);@@6
}`,
    cpp: `
// What std::sort actually is: quicksort until it misbehaves, then a
// guaranteed O(n log n) fallback. Two escape hatches — a depth limit that
// switches to heapsort, and a size floor that leaves short ranges to one
// final insertion pass.
static const int SMALL = 8;

static int partition(std::vector<int>& a, int lo, int hi) {@@3
    int mid = lo + (hi - lo) / 2;
    // Median of three, moved to the end as the pivot.
    if (a[mid] < a[lo]) std::swap(a[mid], a[lo]);
    if (a[hi] < a[lo]) std::swap(a[hi], a[lo]);
    if (a[hi] < a[mid]) std::swap(a[hi], a[mid]);
    std::swap(a[mid], a[hi]);

    int pivot = a[hi], i = lo - 1;
    for (int j = lo; j < hi; ++j) {
        if (a[j] < pivot) {@@4
            std::swap(a[++i], a[j]);@@5
        }
    }
    std::swap(a[i + 1], a[hi]);@@5
    return i + 1;
}

static void introsort(std::vector<int>& a, int lo, int hi, int depthLimit) {
    while (hi - lo + 1 > SMALL) {@@0
        if (depthLimit == 0) {@@1
            std::make_heap(a.begin() + lo, a.begin() + hi + 1);@@1
            std::sort_heap(a.begin() + lo, a.begin() + hi + 1);@@1
            return;@@1
        }
        --depthLimit;@@2

        int p = partition(a, lo, hi);@@3
        // Recurse into the smaller side, loop on the larger: that caps the
        // call stack at O(log n) whatever the pivots do.
        if (p - lo < hi - p) {
            introsort(a, lo, p - 1, depthLimit);
            lo = p + 1;
        } else {
            introsort(a, p + 1, hi, depthLimit);
            hi = p - 1;
        }
    }
}

void introSort(std::vector<int>& a) {
    int n = a.size();
    introsort(a, 0, n - 1, 2 * (int)std::log2(n));

    // Every remaining range is short and already close to home, so one pass
    // over the whole vector is cheaper than sorting each range separately.
    insertionSort(a);@@6
}`,
    java: `
// What Arrays.sort on primitives is built around: quicksort until it
// misbehaves, then a guaranteed O(n log n) fallback. Two escape hatches — a
// depth limit that switches to heapsort, and a size floor that leaves short
// ranges to one final insertion pass.
static final int SMALL = 8;

static int partition(int[] a, int lo, int hi) {@@3
    int mid = lo + (hi - lo) / 2;
    // Median of three, moved to the end as the pivot.
    if (a[mid] < a[lo]) swap(a, mid, lo);
    if (a[hi] < a[lo]) swap(a, hi, lo);
    if (a[hi] < a[mid]) swap(a, hi, mid);
    swap(a, mid, hi);

    int pivot = a[hi], i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {@@4
            swap(a, ++i, j);@@5
        }
    }
    swap(a, i + 1, hi);@@5
    return i + 1;
}

static void introsort(int[] a, int lo, int hi, int depthLimit) {
    while (hi - lo + 1 > SMALL) {@@0
        if (depthLimit == 0) {@@1
            heapSortRange(a, lo, hi);@@1
            return;@@1
        }
        depthLimit--;@@2

        int p = partition(a, lo, hi);@@3
        // Recurse into the smaller side, loop on the larger: that caps the
        // call stack at O(log n) whatever the pivots do.
        if (p - lo < hi - p) {
            introsort(a, lo, p - 1, depthLimit);
            lo = p + 1;
        } else {
            introsort(a, p + 1, hi, depthLimit);
            hi = p - 1;
        }
    }
}

static void introSort(int[] a) {
    int n = a.length;
    introsort(a, 0, n - 1, 2 * (int) (Math.log(n) / Math.log(2)));

    // Every remaining range is short and already close to home, so one pass
    // over the whole array is cheaper than sorting each range separately.
    insertionSort(a);@@6
}`,
    python: `
import math

# Quicksort until it misbehaves, then a guaranteed O(n log n) fallback. Two
# escape hatches — a depth limit that switches to heapsort, and a size floor
# that leaves short ranges to one final insertion pass.
SMALL = 8


def partition(a, lo, hi):@@3
    mid = lo + (hi - lo) // 2
    # Median of three, moved to the end as the pivot.
    if a[mid] < a[lo]:
        a[mid], a[lo] = a[lo], a[mid]
    if a[hi] < a[lo]:
        a[hi], a[lo] = a[lo], a[hi]
    if a[hi] < a[mid]:
        a[hi], a[mid] = a[mid], a[hi]
    a[mid], a[hi] = a[hi], a[mid]

    pivot, i = a[hi], lo - 1
    for j in range(lo, hi):
        if a[j] < pivot:@@4
            i += 1
            a[i], a[j] = a[j], a[i]@@5
    a[i + 1], a[hi] = a[hi], a[i + 1]@@5
    return i + 1


def introsort(a, lo, hi, depth_limit):
    while hi - lo + 1 > SMALL:@@0
        if depth_limit == 0:@@1
            heap_sort_range(a, lo, hi)@@1
            return@@1
        depth_limit -= 1@@2

        p = partition(a, lo, hi)@@3
        # Recurse into the smaller side, loop on the larger: that caps the
        # call stack at O(log n) whatever the pivots do.
        if p - lo < hi - p:
            introsort(a, lo, p - 1, depth_limit)
            lo = p + 1
        else:
            introsort(a, p + 1, hi, depth_limit)
            hi = p - 1


def intro_sort(a):
    n = len(a)
    introsort(a, 0, n - 1, 2 * int(math.log2(n or 1)))

    # Every remaining range is short and already close to home, so one pass
    # over the whole list is cheaper than sorting each range separately.
    insertion_sort(a)@@6
    return a`,
    javascript: `
// Quicksort until it misbehaves, then a guaranteed O(n log n) fallback. Two
// escape hatches — a depth limit that switches to heapsort, and a size floor
// that leaves short ranges to one final insertion pass.
const SMALL = 8;

function partition(a, lo, hi) {@@3
  const mid = lo + ((hi - lo) >> 1);
  // Median of three, moved to the end as the pivot.
  if (a[mid] < a[lo]) [a[mid], a[lo]] = [a[lo], a[mid]];
  if (a[hi] < a[lo]) [a[hi], a[lo]] = [a[lo], a[hi]];
  if (a[hi] < a[mid]) [a[hi], a[mid]] = [a[mid], a[hi]];
  [a[mid], a[hi]] = [a[hi], a[mid]];

  const pivot = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {@@4
      i++;
      [a[i], a[j]] = [a[j], a[i]];@@5
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];@@5
  return i + 1;
}

function introsort(a, lo, hi, depthLimit) {
  while (hi - lo + 1 > SMALL) {@@0
    if (depthLimit === 0) {@@1
      heapSortRange(a, lo, hi);@@1
      return;@@1
    }
    depthLimit--;@@2

    const p = partition(a, lo, hi);@@3
    // Recurse into the smaller side, loop on the larger: that caps the call
    // stack at O(log n) whatever the pivots do.
    if (p - lo < hi - p) {
      introsort(a, lo, p - 1, depthLimit);
      lo = p + 1;
    } else {
      introsort(a, p + 1, hi, depthLimit);
      hi = p - 1;
    }
  }
}

function introSort(a) {
  introsort(a, 0, a.length - 1, 2 * Math.floor(Math.log2(a.length || 1)));

  // Every remaining range is short and already close to home, so one pass
  // over the whole array is cheaper than sorting each range separately.
  insertionSort(a);@@6
  return a;
}`,
  },

  tim: {
    c: `
/* Timsort starts from an observation about real data: it is rarely random.
   It finds stretches that are already ordered instead of ignoring them, so a
   sorted array costs one linear scan. */
static int minRunLength(int n) {
    /* Pick minrun in [32, 64] so n/minrun is at or just below a power of
       two — that is what keeps the merges balanced. */
    int r = 0;
    while (n >= 64) { r |= n & 1; n >>= 1; }
    return n + r;
}

void timSort(int a[], int n) {
    int minrun = minRunLength(n);
    int runStart[64], runLen[64], top = 0;

    int lo = 0;
    while (lo < n) {
        int hi = lo + 1;
        if (hi < n && a[hi] < a[hi - 1]) {
            while (hi < n && a[hi] < a[hi - 1]) hi++;@@0
            reverseRange(a, lo, hi - 1);@@1
        } else {
            while (hi < n && a[hi] >= a[hi - 1]) hi++;@@0
        }
        int len = hi - lo;

        /* A natural run shorter than minrun is padded out by insertion
           sort, so the run stack never fills up with tiny runs. */
        if (len < minrun) {@@2
            int end = lo + minrun - 1 < n - 1 ? lo + minrun - 1 : n - 1;@@2
            insertionSortRange(a, lo, end);@@2
            len = end - lo + 1;@@2
        }

        runStart[top] = lo; runLen[top] = len; top++;@@3
        /* Invariants X > Y + Z and Y > Z keep merged runs comparable. */
        while (top > 1) {@@3
            int z = top - 1;
            if ((top >= 3 && runLen[z - 2] <= runLen[z - 1] + runLen[z]) ||
                (top >= 2 && runLen[z - 1] <= runLen[z])) {
                int i = (top >= 3 && runLen[z - 2] < runLen[z]) ? z - 2 : z - 1;
                mergeRuns(a, runStart[i], runStart[i] + runLen[i] - 1,
                          runStart[i + 1] + runLen[i + 1] - 1);@@5
                runLen[i] += runLen[i + 1];
                for (int k = i + 1; k < top - 1; k++) {
                    runStart[k] = runStart[k + 1];
                    runLen[k] = runLen[k + 1];
                }
                top--;
            } else break;
        }
        lo += len;
    }

    /* Whatever the invariants left standing gets merged from the top down. */
    while (top > 1) {
        mergeRuns(a, runStart[top - 2], runStart[top - 2] + runLen[top - 2] - 1,
                  runStart[top - 1] + runLen[top - 1] - 1);@@5
        runLen[top - 2] += runLen[top - 1];
        top--;
    }
}`,
    cpp: `
// Timsort starts from an observation about real data: it is rarely random.
// It finds stretches that are already ordered instead of ignoring them, so a
// sorted vector costs one linear scan.
struct Run { int start, len; };

static int minRunLength(int n) {
    // Pick minrun in [32, 64] so n/minrun is at or just below a power of
    // two — that is what keeps the merges balanced.
    int r = 0;
    while (n >= 64) { r |= n & 1; n >>= 1; }
    return n + r;
}

void timSort(std::vector<int>& a) {
    int n = a.size();
    int minrun = minRunLength(n);
    std::vector<Run> stack;

    int lo = 0;
    while (lo < n) {
        int hi = lo + 1;
        if (hi < n && a[hi] < a[hi - 1]) {
            while (hi < n && a[hi] < a[hi - 1]) ++hi;@@0
            std::reverse(a.begin() + lo, a.begin() + hi);@@1
        } else {
            while (hi < n && a[hi] >= a[hi - 1]) ++hi;@@0
        }
        int len = hi - lo;

        // A natural run shorter than minrun is padded out by insertion sort,
        // so the run stack never fills up with tiny runs.
        if (len < minrun) {@@2
            int end = std::min(n - 1, lo + minrun - 1);@@2
            insertionSortRange(a, lo, end);@@2
            len = end - lo + 1;@@2
        }

        stack.push_back({lo, len});@@3
        // Invariants X > Y + Z and Y > Z keep merged runs comparable.
        while (stack.size() > 1) {@@3
            size_t z = stack.size() - 1;
            bool violated =
                (stack.size() >= 3 && stack[z - 2].len <= stack[z - 1].len + stack[z].len) ||
                stack[z - 1].len <= stack[z].len;
            if (!violated) break;
            size_t i = (stack.size() >= 3 && stack[z - 2].len < stack[z].len) ? z - 2 : z - 1;
            mergeRuns(a, stack[i].start, stack[i].start + stack[i].len - 1,
                      stack[i + 1].start + stack[i + 1].len - 1);@@5
            stack[i].len += stack[i + 1].len;
            stack.erase(stack.begin() + i + 1);
        }
        lo += len;
    }

    // Whatever the invariants left standing gets merged from the top down.
    while (stack.size() > 1) {
        size_t z = stack.size() - 1;
        mergeRuns(a, stack[z - 1].start, stack[z - 1].start + stack[z - 1].len - 1,
                  stack[z].start + stack[z].len - 1);@@5
        stack[z - 1].len += stack[z].len;
        stack.pop_back();
    }
}`,
    java: `
// Timsort starts from an observation about real data: it is rarely random.
// It finds stretches that are already ordered instead of ignoring them, so a
// sorted array costs one linear scan. This is what Arrays.sort on objects is.
static int minRunLength(int n) {
    // Pick minrun in [32, 64] so n/minrun is at or just below a power of
    // two — that is what keeps the merges balanced.
    int r = 0;
    while (n >= 64) { r |= n & 1; n >>= 1; }
    return n + r;
}

static void timSort(int[] a) {
    int n = a.length;
    int minrun = minRunLength(n);
    List<int[]> stack = new ArrayList<>();   // each entry is {start, len}

    int lo = 0;
    while (lo < n) {
        int hi = lo + 1;
        if (hi < n && a[hi] < a[hi - 1]) {
            while (hi < n && a[hi] < a[hi - 1]) hi++;@@0
            reverseRange(a, lo, hi - 1);@@1
        } else {
            while (hi < n && a[hi] >= a[hi - 1]) hi++;@@0
        }
        int len = hi - lo;

        // A natural run shorter than minrun is padded out by insertion sort,
        // so the run stack never fills up with tiny runs.
        if (len < minrun) {@@2
            int end = Math.min(n - 1, lo + minrun - 1);@@2
            insertionSortRange(a, lo, end);@@2
            len = end - lo + 1;@@2
        }

        stack.add(new int[] {lo, len});@@3
        // Invariants X > Y + Z and Y > Z keep merged runs comparable.
        while (stack.size() > 1) {@@3
            int z = stack.size() - 1;
            boolean violated =
                (stack.size() >= 3 && stack.get(z - 2)[1] <= stack.get(z - 1)[1] + stack.get(z)[1])
                || stack.get(z - 1)[1] <= stack.get(z)[1];
            if (!violated) break;
            int i = (stack.size() >= 3 && stack.get(z - 2)[1] < stack.get(z)[1]) ? z - 2 : z - 1;
            int[] left = stack.get(i), right = stack.get(i + 1);
            mergeRuns(a, left[0], left[0] + left[1] - 1, right[0] + right[1] - 1);@@5
            left[1] += right[1];
            stack.remove(i + 1);
        }
        lo += len;
    }

    // Whatever the invariants left standing gets merged from the top down.
    while (stack.size() > 1) {
        int z = stack.size() - 1;
        int[] left = stack.get(z - 1), right = stack.get(z);
        mergeRuns(a, left[0], left[0] + left[1] - 1, right[0] + right[1] - 1);@@5
        left[1] += right[1];
        stack.remove(z);
    }
}`,
    python: `
def min_run_length(n):
    """Pick minrun in [32, 64] so n/minrun is at or just below a power of
    two — that is what keeps the merges balanced."""
    r = 0
    while n >= 64:
        r |= n & 1
        n >>= 1
    return n + r


def tim_sort(a):
    """Timsort starts from an observation about real data: it is rarely
    random. It finds stretches that are already ordered instead of ignoring
    them, so a sorted list costs one linear scan. This is CPython's sort."""
    n = len(a)
    minrun = min_run_length(n)
    stack = []          # each entry is [start, length]

    lo = 0
    while lo < n:
        hi = lo + 1
        if hi < n and a[hi] < a[hi - 1]:
            while hi < n and a[hi] < a[hi - 1]:@@0
                hi += 1@@0
            a[lo:hi] = reversed(a[lo:hi])@@1
        else:
            while hi < n and a[hi] >= a[hi - 1]:@@0
                hi += 1@@0
        length = hi - lo

        # A natural run shorter than minrun is padded out by insertion sort,
        # so the run stack never fills up with tiny runs.
        if length < minrun:@@2
            end = min(n - 1, lo + minrun - 1)@@2
            insertion_sort_range(a, lo, end)@@2
            length = end - lo + 1@@2

        stack.append([lo, length])@@3
        # Invariants X > Y + Z and Y > Z keep merged runs comparable.
        while len(stack) > 1:@@3
            z = len(stack) - 1
            violated = (len(stack) >= 3 and stack[z - 2][1] <= stack[z - 1][1] + stack[z][1]) \\
                or stack[z - 1][1] <= stack[z][1]
            if not violated:
                break
            i = z - 2 if len(stack) >= 3 and stack[z - 2][1] < stack[z][1] else z - 1
            left, right = stack[i], stack[i + 1]
            merge_runs(a, left[0], left[0] + left[1] - 1, right[0] + right[1] - 1)@@5
            left[1] += right[1]
            stack.pop(i + 1)
        lo += length

    # Whatever the invariants left standing gets merged from the top down.
    while len(stack) > 1:
        right = stack.pop()
        left = stack[-1]
        merge_runs(a, left[0], left[0] + left[1] - 1, right[0] + right[1] - 1)@@5
        left[1] += right[1]
    return a`,
    javascript: `
// Timsort starts from an observation about real data: it is rarely random.
// It finds stretches that are already ordered instead of ignoring them, so a
// sorted array costs one linear scan.
function minRunLength(n) {
  // Pick minrun in [32, 64] so n/minrun is at or just below a power of two —
  // that is what keeps the merges balanced.
  let r = 0;
  while (n >= 64) {
    r |= n & 1;
    n >>= 1;
  }
  return n + r;
}

function timSort(a) {
  const n = a.length;
  const minrun = minRunLength(n);
  const stack = []; // each entry is { start, len }

  let lo = 0;
  while (lo < n) {
    let hi = lo + 1;
    if (hi < n && a[hi] < a[hi - 1]) {
      while (hi < n && a[hi] < a[hi - 1]) hi++;@@0
      reverseRange(a, lo, hi - 1);@@1
    } else {
      while (hi < n && a[hi] >= a[hi - 1]) hi++;@@0
    }
    let len = hi - lo;

    // A natural run shorter than minrun is padded out by insertion sort, so
    // the run stack never fills up with tiny runs.
    if (len < minrun) {@@2
      const end = Math.min(n - 1, lo + minrun - 1);@@2
      insertionSortRange(a, lo, end);@@2
      len = end - lo + 1;@@2
    }

    stack.push({ start: lo, len });@@3
    // Invariants X > Y + Z and Y > Z keep merged runs comparable.
    while (stack.length > 1) {@@3
      const z = stack.length - 1;
      const violated =
        (stack.length >= 3 && stack[z - 2].len <= stack[z - 1].len + stack[z].len) ||
        stack[z - 1].len <= stack[z].len;
      if (!violated) break;
      const i = stack.length >= 3 && stack[z - 2].len < stack[z].len ? z - 2 : z - 1;
      const left = stack[i], right = stack[i + 1];
      mergeRuns(a, left.start, left.start + left.len - 1, right.start + right.len - 1);@@5
      left.len += right.len;
      stack.splice(i + 1, 1);
    }
    lo += len;
  }

  // Whatever the invariants left standing gets merged from the top down.
  while (stack.length > 1) {
    const right = stack.pop();
    const left = stack[stack.length - 1];
    mergeRuns(a, left.start, left.start + left.len - 1, right.start + right.len - 1);@@5
    left.len += right.len;
  }
  return a;
}`,
  },
};
