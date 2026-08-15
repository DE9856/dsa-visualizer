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

- 🌳 Trees (Binary Tree, BST, AVL)
- 🌲 2-3 Trees
- 🔗 Linked Lists (singly, doubly, circular)
- 📊 Graphs
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
│   ├── linkedList/
│   ├── polynomial/
│   ├── queue/
│   ├── stack/
│   ├── tree/
│   └── twoThreeTree/
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
| `?` | Toggle the in-app shortcut help |
| `Enter` | Run the selected operation (from any sidebar input) |
| `Esc` | Close an open top-bar menu |

Shortcuts are ignored while you're typing in a field. Full details in [DOCS.md](DOCS.md#keyboard-shortcuts).

---

## 📱 On a phone

The app is built for small screens too, not just scaled down for them. Below 760px the
visualization takes the whole screen, the sidebar becomes a bottom sheet, and a fixed
action bar keeps play/pause, the controls sheet and shuffle within thumb reach. Graphs
lay out in a portrait ring and connect by tapping two vertices; trees stay readable and
scroll sideways. See [DOCS.md](DOCS.md#on-a-phone) for the details.

---

## 🎯 Current Functionalities

### Sorting

- Generate random arrays
- Custom array input
- Adjustable array size
- Speed controls with a live steps-per-second read-out
- Step-by-step execution and a draggable timeline to scrub anywhere in a run
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

- Trees — Binary Tree, BST, AVL
  - Insert, Delete, Search
  - Inorder, Preorder, Postorder, DFS, BFS (level order)
  - Height, Size, Clear

- 2-3 Tree
  - Insert (with node splits), Delete, Search
  - Inorder, Height, Size, Clear

- Graphs — directed/undirected, weighted/unweighted
  - Add / remove vertex and edge, drag-to-connect on the canvas
  - Neighbours, Degree, Is-adjacent
  - BFS, DFS, Topological sort
  - Dijkstra, Floyd–Warshall, Prim's MST, Kruskal's MST
  - Adjacency list and adjacency matrix views

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
