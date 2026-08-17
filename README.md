# 🚀 DSA Visualizer

An interactive **Data Structures & Algorithms Visualizer** built with **React + Vite**. The application provides animated visualizations for algorithms and core data structures, helping students and developers understand how operations execute step by step.

📖 **[Full documentation →](DOCS.md)** — setup, keyboard shortcuts, input formats, architecture and extension guide.
📝 **[Changelog →](CHANGELOG.md)**

---

## ✨ Features

### 🔢 Algorithms

#### Sorting Algorithms
- Bubble Sort
- Selection Sort
- Insertion Sort
- Shell Sort
- Merge Sort
- Quick Sort
- Heap Sort
- Counting Sort (Comparison)
- Radix Sort

#### Searching Algorithms
- Linear Search
- Binary Search
- Jump Search
- Interpolation Search
- Exponential Search

---

### 📚 Data Structures

The visualizer also supports interactive operations for:

- 🌳 Trees (Binary Tree, BST, AVL, Threaded)
- 🌲 2-3 Trees
- ⛰️ Heaps (max & min, sift up/down)
- 🔤 Tries (prefix tree & autocomplete)
- 🔗 Linked Lists (singly, doubly, circular)
- 🗂️ Hash Tables (separate chaining, linear & quadratic probing)
- 📊 Graphs
- 🧩 Union-Find (disjoint sets with path compression)
- 📦 Stacks
- 📥 Queues
- ➗ Polynomial Operations

Each module provides its own visualization with animations that demonstrate how the underlying data structure changes after every operation.

---

## 🛠️ Tech Stack

- React
- Vite
- JavaScript (ES6+)
- CSS3

---

## 🚀 Getting Started

> Requires **Node.js 18+**. See [DOCS.md](DOCS.md#running-it-locally) for the full guide.

Clone the repository

```bash
git clone <repository-url>
cd dsa-visualizer
```

Install dependencies

```bash
npm install
```

Run the development server

```bash
npm run dev
```

Create a production build

```bash
npm run build
```

Preview the production build

```bash
npm run preview
```

---

## 📁 Project Structure

```
src/
│
├── algorithms/
│   ├── sorting/            one file per sorting algorithm
│   ├── searching/          one file per searching algorithm
│   ├── stepUtils.js
│   └── index.js            algorithm registry
│
├── dataStructures/
│   ├── graph/
│   ├── hashTable/
│   ├── heap/
│   ├── linkedList/
│   ├── polynomial/
│   ├── queue/
│   ├── stack/
│   ├── tree/
│   ├── trie/
│   ├── twoThreeTree/
│   └── unionFind/
│
├── components/             Canvas, Sidebar, Controls, InfoPanel, ...
│
├── hooks/
│   ├── useStepPlayer.js         shared playback engine
│   ├── useKeyboardShortcuts.js
│   └── use<Structure>.js        one per visualizer view
│
├── data/                   categories + topic write-ups
├── utils/
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause (replays from the start when finished) |
| `←` / `→` | Step back / forward |
| `Home` / `End` | Jump to the first / last step |
| `R` | Reset to the first step |
| `S` | Shuffle — new random data |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo the last edit (every structure keeps its own history) |
| `Ctrl+C` / `Ctrl+V` | Copy / paste — on the graph, a vertex or the whole graph |
| `?` | Toggle the in-app shortcut help |
| `Enter` | Run the selected operation (from any sidebar input) |
| `Esc` | Close an open top-bar menu |

Shortcuts are ignored while you're typing in a field. Full details in [DOCS.md](DOCS.md#keyboard-shortcuts).

---

## 🔗 Sharing

The address bar always holds a link to what's on screen, and **SHARE** in the top bar
copies it. Open a link and you land straight in the visualizer with the data loaded:

```
#v=tree&type=avl&a=30,20,10,25,40,50
#v=graph&w=1&g=A,B,C,D&e=A-B(5),B-C(2),C-D(7),A-D
#v=graph&g=A,B,C&e=A-B,B-C&xy=A:0.2:0.15,C:0.75:0.8
```

Custom arrays, lists, stacks, queues, trees, heaps, tries, hash tables, union-finds,
graphs and polynomials all round-trip exactly — including a graph you have rearranged by
hand. See [DOCS.md](DOCS.md#sharing-a-setup) for the full format.

---

## 📱 On a phone

The app is built for small screens too, not just scaled down for them. Below 760px the
visualization takes the whole screen, the sidebar becomes a bottom sheet, and a fixed
action bar keeps play/pause, the controls sheet and shuffle within thumb reach. Graphs
lay out in a portrait ring, connect by tapping two vertices, and rearrange or grow by
holding one and dragging it or holding empty canvas; trees stay readable and scroll
sideways. See
[DOCS.md](DOCS.md#on-a-phone) for the details.

---

## 🎯 Current Functionalities

### Sorting

- Generate random arrays
- Custom array input
- Adjustable array size
- Speed controls with a live steps-per-second read-out
- Step-by-step execution and a draggable timeline to scrub anywhere in a run
- Live pseudocode — the line the current step is executing is highlighted
- A recursion tree under the bars for merge and quick sort, with everything outside the
  active partition dimmed
- Pause, Resume, Reset and Replay
- Live comparison and swap counters
- Complexity information
- Pseudocode display

### Searching

- Target value selection
- Animated traversal
- Binary search range visualization
- Live comparisons
- Complexity analysis

### Data Structures

Interactive visualizations for:

- Stack (capacity 8)
  - Push, Pop, Peek / Top
  - Search, Size, isEmpty, isFull, Clear

- Queue (capacity 8)
  - Enqueue, Dequeue, Peek / Front
  - Search, Size, isEmpty, isFull, Clear

- Linked List — singly, doubly, circular
  - Insert at head / tail / position
  - Delete by value / position, Update node
  - Search & traverse, Reverse, Sort, Count length
  - Concatenate, Merge sorted lists, Clear

- Trees — Binary Tree, BST, AVL, Threaded (single or double)
  - Insert, Delete, Search
  - Inorder, Preorder, Postorder, DFS, BFS (level order)
  - Height, Size, Clear
  - On a threaded tree: Threaded Inorder and Reverse Inorder (no stack, no recursion),
    Inorder Successor

- 2-3 Tree
  - Insert (with node splits), Delete, Search
  - Inorder, Height, Size, Clear

- Heap — max-heap, min-heap
  - Insert (sift up), Extract root (sift down), Peek
  - Build heap bottom-up in O(n), Search, Height, Size, Clear
  - The tree and the array it lives in, highlighted together, with the index arithmetic
  - Switch max/min to re-heapify the same values

- Trie — prefix tree over a–z
  - Insert (creating only the nodes a word needs), Delete (pruning only what nothing needs)
  - Search (exact word vs. bare prefix), Autocomplete, List words, Size, Clear

- Union-Find — union by size with path compression
  - Union, Find, Connected?, Components, Add element, Reset
  - The forest and the parent array side by side, with compression animated pointer by pointer
  - The same implementation Kruskal's MST uses for its cycle check

- Hash Table — separate chaining, linear probing, quadratic probing
  - Insert, Search, Delete (tombstones under open addressing)
  - Load factor read-out, List keys in hash order
  - Automatic resize + rehash when the load factor crosses its limit, or on demand
  - Switch the collision strategy to replay the same keys into a new table

- Graphs — directed/undirected, weighted/unweighted
  - Add / remove vertex and edge from the sidebar, or build the graph on the canvas
    itself: click two vertices to connect them, double-click empty space to add one,
    triple-click a vertex to delete it
  - Drag the vertices anywhere — hold first on a phone — to lay the graph out yourself
    instead of leaving it on the default ring
  - Neighbours, Degree, Is-adjacent
  - BFS, DFS, Topological sort
  - Dijkstra, Floyd–Warshall, Prim's MST, Kruskal's MST
  - Adjacency list and adjacency matrix views — type into a matrix cell to reweight, add
    or remove that edge

- Polynomial
  - Linked-list representation
  - Add, Multiply, Evaluate P(x)

---

## ➕ Adding New Algorithms

1. Create a new file inside

```
src/algorithms/sorting/
```

or

```
src/algorithms/searching/
```

2. Export an object similar to the existing implementations.

3. Implement the required

```javascript
run(array)
```

or

```javascript
run(array, target)
```

method.

4. Register the algorithm inside

```
src/algorithms/index.js
```

The algorithm will automatically appear in the application.

---

## ➕ Adding New Data Structures

Create a new folder inside

```
src/dataStructures/
```

and implement:

- Visualization component
- Operation handlers
- State management
- Animation logic

The modular architecture allows new data structures to be added independently without affecting existing modules.

---

## 🎓 Purpose

This project is designed for:

- Students learning Data Structures & Algorithms
- Classroom demonstrations
- Coding interview preparation
- Interactive algorithm visualization
- Understanding algorithm execution step-by-step

---

## 📄 License

This project is available for educational purposes.
