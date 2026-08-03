# 🚀 DSA Visualizer

An interactive **Data Structures & Algorithms Visualizer** built with **React + Vite**. The application provides animated visualizations for algorithms and core data structures, helping students and developers understand how operations execute step by step.

---

## ✨ Features

### 🔢 Algorithms

#### Sorting Algorithms
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Heap Sort

#### Searching Algorithms
- Linear Search
- Binary Search

---

### 📚 Data Structures

The visualizer also supports interactive operations for:

- 🌳 Trees
- 🔗 Linked Lists
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
│   ├── sorting/
│   ├── searching/
│   ├── stepUtils.js
│   └── index.js
│
├── dataStructures/
│   ├── graph/
│   ├── linkedList/
│   ├── polynomial/
│   ├── queue/
│   ├── stack/
│   └── tree/
│
├── components/
│   ├── Canvas/
│   ├── Sidebar/
│   ├── Controls/
│   ├── InfoPanel/
│   └── ...
│
├── hooks/
│
├── utils/
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🎯 Current Functionalities

### Sorting

- Generate random arrays
- Custom array input
- Adjustable array size
- Speed controls
- Step-by-step execution
- Pause, Resume and Reset
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

- Stack operations
  - Push
  - Pop
  - Peek

- Queue operations
  - Enqueue
  - Dequeue
  - Front

- Linked List
  - Insert
  - Delete
  - Traverse

- Trees
  - Insertion
  - Traversals
  - Node visualization

- Graphs
  - Vertex creation
  - Edge creation
  - Graph traversal visualization

- Polynomial
  - Polynomial representation
  - Polynomial operations and visualization

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
