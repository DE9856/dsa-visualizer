/**
 * Huffman coding, tagged with the line of the algorithm each source line
 * implements — see `./index.js` for how the `@@n` markers are read.
 *
 * It lives in its own chunk rather than with the sorts because the view it
 * belongs to is a data-structure view; the algorithm is registered under the
 * key `huffman` all the same.
 */
export default {
  huffman: {
    c: `
/* The greedy choice is that the two rarest symbols can always be siblings at
   the deepest level — swapping either for anything more common would make
   the total longer. Everything else follows from repeating that. */
typedef struct Node {
    int weight;
    char symbol;              /* only meaningful on a leaf */
    struct Node *left, *right;
} Node;

Node *buildHuffmanTree(const char *text) {
    int freq[256] = {0};
    for (const char *c = text; *c; c++) freq[(unsigned char)*c]++;@@0

    MinHeap *queue = newMinHeap();
    for (int i = 0; i < 256; i++)@@1
        if (freq[i]) push(queue, newLeaf(i, freq[i]));@@1

    while (queue->size > 1) {@@2
        Node *a = pop(queue);@@3
        Node *b = pop(queue);@@3

        Node *parent = newNode(a->weight + b->weight);@@4
        parent->left = a;@@4
        parent->right = b;@@4

        push(queue, parent);@@5
    }
    return pop(queue);
}

/* Left is 0, right is 1; a leaf's code is the path that reached it. No code
   is a prefix of another, which is what makes the stream decodable. */
void assignCodes(Node *node, char *path, int depth) {@@6
    if (!node->left && !node->right) { path[depth] = 0; record(node->symbol, path); return; }@@6
    path[depth] = '0'; assignCodes(node->left, path, depth + 1);@@6
    path[depth] = '1'; assignCodes(node->right, path, depth + 1);@@6
}`,
    cpp: `
// The greedy choice is that the two rarest symbols can always be siblings at
// the deepest level — swapping either for anything more common would make
// the total longer. Everything else follows from repeating that.
struct Node {
    int weight;
    char symbol;                          // only meaningful on a leaf
    Node *left = nullptr, *right = nullptr;
};

struct Heavier {
    bool operator()(Node* a, Node* b) const { return a->weight > b->weight; }
};

Node* buildHuffmanTree(const std::string& text) {
    std::map<char, int> freq;
    for (char c : text) freq[c]++;@@0

    std::priority_queue<Node*, std::vector<Node*>, Heavier> queue;
    for (auto& [symbol, weight] : freq)@@1
        queue.push(new Node{weight, symbol});@@1

    while (queue.size() > 1) {@@2
        Node* a = queue.top(); queue.pop();@@3
        Node* b = queue.top(); queue.pop();@@3

        Node* parent = new Node{a->weight + b->weight, 0};@@4
        parent->left = a;@@4
        parent->right = b;@@4

        queue.push(parent);@@5
    }
    return queue.top();
}

// Left is 0, right is 1; a leaf's code is the path that reached it. No code
// is a prefix of another, which is what makes the stream decodable.
void assignCodes(Node* node, std::string path, std::map<char, std::string>& codes) {@@6
    if (!node->left && !node->right) { codes[node->symbol] = path; return; }@@6
    assignCodes(node->left, path + "0", codes);@@6
    assignCodes(node->right, path + "1", codes);@@6
}`,
    java: `
// The greedy choice is that the two rarest symbols can always be siblings at
// the deepest level — swapping either for anything more common would make
// the total longer. Everything else follows from repeating that.
static class Node {
    int weight;
    char symbol;              // only meaningful on a leaf
    Node left, right;
    Node(int weight, char symbol) { this.weight = weight; this.symbol = symbol; }
}

static Node buildHuffmanTree(String text) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : text.toCharArray()) freq.merge(c, 1, Integer::sum);@@0

    PriorityQueue<Node> queue = new PriorityQueue<>(Comparator.comparingInt(n -> n.weight));
    for (var entry : freq.entrySet())@@1
        queue.add(new Node(entry.getValue(), entry.getKey()));@@1

    while (queue.size() > 1) {@@2
        Node a = queue.poll();@@3
        Node b = queue.poll();@@3

        Node parent = new Node(a.weight + b.weight, '\\0');@@4
        parent.left = a;@@4
        parent.right = b;@@4

        queue.add(parent);@@5
    }
    return queue.poll();
}

// Left is 0, right is 1; a leaf's code is the path that reached it. No code
// is a prefix of another, which is what makes the stream decodable.
static void assignCodes(Node node, String path, Map<Character, String> codes) {@@6
    if (node.left == null && node.right == null) { codes.put(node.symbol, path); return; }@@6
    assignCodes(node.left, path + "0", codes);@@6
    assignCodes(node.right, path + "1", codes);@@6
}`,
    python: `
import heapq
from collections import Counter


def build_huffman_tree(text):
    """The greedy choice is that the two rarest symbols can always be siblings
    at the deepest level — swapping either for anything more common would make
    the total longer. Everything else follows from repeating that."""
    freq = Counter(text)@@0

    # Each entry is [weight, tiebreak, node]; the tiebreak keeps the heap from
    # ever having to compare two nodes.
    queue = [[weight, i, (symbol, None, None)]@@1
             for i, (symbol, weight) in enumerate(freq.items())]@@1
    heapq.heapify(queue)
    counter = len(queue)

    while len(queue) > 1:@@2
        wa, _, a = heapq.heappop(queue)@@3
        wb, _, b = heapq.heappop(queue)@@3

        parent = (None, a, b)@@4
        heapq.heappush(queue, [wa + wb, counter, parent])@@5
        counter += 1

    return queue[0][2]


def assign_codes(node, path="", codes=None):@@6
    """Left is 0, right is 1; a leaf's code is the path that reached it. No
    code is a prefix of another, which is what makes the stream decodable."""
    codes = {} if codes is None else codes
    symbol, left, right = node
    if left is None and right is None:@@6
        codes[symbol] = path or "0"@@6
        return codes@@6
    assign_codes(left, path + "0", codes)@@6
    assign_codes(right, path + "1", codes)@@6
    return codes`,
    javascript: `
// The greedy choice is that the two rarest symbols can always be siblings at
// the deepest level — swapping either for anything more common would make
// the total longer. Everything else follows from repeating that.
function buildHuffmanTree(text) {
  const freq = new Map();
  for (const c of text) freq.set(c, (freq.get(c) || 0) + 1);@@0

  // A sorted array stands in for the priority queue: the forest is small, and
  // keeping it ordered makes "the two lightest" the first two entries.
  const queue = [...freq].map(([symbol, weight]) => ({ symbol, weight }));@@1
  queue.sort((x, y) => x.weight - y.weight);@@1

  while (queue.length > 1) {@@2
    const a = queue.shift();@@3
    const b = queue.shift();@@3

    const parent = { weight: a.weight + b.weight, left: a, right: b };@@4

    // Insert in weight order, after any equal weight already there.
    let at = queue.findIndex((node) => node.weight > parent.weight);@@5
    queue.splice(at === -1 ? queue.length : at, 0, parent);@@5
  }
  return queue[0];
}

// Left is 0, right is 1; a leaf's code is the path that reached it. No code
// is a prefix of another, which is what makes the stream decodable.
function assignCodes(node, path = "", codes = new Map()) {@@6
  if (!node.left && !node.right) { codes.set(node.symbol, path || "0"); return codes; }@@6
  assignCodes(node.left, path + "0", codes);@@6
  assignCodes(node.right, path + "1", codes);@@6
  return codes;@@6
}`,
  },
};
