import { bubbleSort } from "./bubbleSort";
import { selectionSort } from "./selectionSort";
import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import { quickSort3Way } from "./quickSort3Way";
import { introSort } from "./introSort";
import { timSort } from "./timSort";
import { heapSort } from "./heapSort";
import { comparisonCountingSort } from "./comparisonCountingSort";
import { countingSort } from "./countingSort";
import { shellSort } from "./shellSort";
import { combSort } from "./combSort";
import { cycleSort } from "./cycleSort";
import { bitonicSort } from "./bitonicSort";
import { bucketSort } from "./bucketSort";
import { radixSort } from "./radixSort";

// Roughly by family: the quadratic ones first, then the gapped variants of
// them, then divide-and-conquer, then the hybrids real libraries ship, then
// the non-comparison sorts and the network.
export const sortingAlgorithms = [
  bubbleSort,
  selectionSort,
  insertionSort,
  cycleSort,
  shellSort,
  combSort,
  mergeSort,
  quickSort,
  quickSort3Way,
  heapSort,
  introSort,
  timSort,
  comparisonCountingSort,
  countingSort,
  bucketSort,
  radixSort,
  bitonicSort,
];
