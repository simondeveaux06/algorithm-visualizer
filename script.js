/* ============================================================
   Sorting & Searching Algorithm Visualizer
   Each algorithm is a generator function that mutates the array
   and yields "events" (compare, swap, call, return, ...). The
   animation loop pulls events one at a time and renders them.
   ============================================================ */

// ---------- Algorithm metadata ----------
const ALGORITHMS = {
  bubble: {
    name: "Bubble Sort", kind: "sort", fn: bubbleSort,
    desc: "Repeatedly steps through the list, swapping adjacent elements that are out of order. The largest unsorted value 'bubbles' to the end on each pass.",
    c: ["O(n)", "O(n²)", "O(n²)", "O(1)"],
  },
  insertion: {
    name: "Insertion Sort", kind: "sort", fn: insertionSort,
    desc: "Builds a sorted prefix one element at a time, sliding each new element left until it reaches its place. Very fast on nearly sorted data.",
    c: ["O(n)", "O(n²)", "O(n²)", "O(1)"],
  },
  selection: {
    name: "Selection Sort", kind: "sort", fn: selectionSort,
    desc: "Finds the minimum of the unsorted region (purple) and swaps it to the front. Always does the same number of comparisons.",
    c: ["O(n²)", "O(n²)", "O(n²)", "O(1)"],
  },
  merge: {
    name: "Merge Sort", kind: "sort", fn: mergeSort,
    desc: "Divide and conquer: recursively split the array in half, sort each half, then merge them. Watch the call stack grow to log₂(n) and the active range shrink.",
    c: ["O(n log n)", "O(n log n)", "O(n log n)", "O(n)"],
  },
  quick: {
    name: "Quick Sort", kind: "sort", fn: quickSort,
    desc: "Divide and conquer: pick a pivot (purple), partition smaller values to its left and larger to its right, then recurse on each side.",
    c: ["O(n log n)", "O(n log n)", "O(n²)", "O(log n)"],
  },
  heap: {
    name: "Heap Sort", kind: "sort", fn: heapSort,
    desc: "Builds a max-heap (teal region), then repeatedly swaps the root (largest) to the end and re-heapifies. Heapify recursion is shown in the call stack.",
    c: ["O(n log n)", "O(n log n)", "O(n log n)", "O(1)"],
  },
    shell: {
    name: "Shell Sort", kind: "sort", fn: shellSort,
    desc: "A faster insertion sort: first sorts elements far apart (the gap), then shrinks the gap until it's 1. Large values move long distances early.",
    c: ["O(n log n)", "O(n^1.5)", "O(n²)", "O(1)"],
  },
  jump: {
    name: "Jump Search", kind: "search", fn: jumpSearch, needsSorted: true,
    desc: "Requires sorted data. Jumps ahead √n elements at a time until it passes the target, then scans that block one by one.",
    c: ["O(1)", "O(√n)", "O(√n)", "O(1)"],
  },
  linear: {
    name: "Linear Search", kind: "search", fn: linearSearch,
    desc: "Checks every element from left to right until it finds the target (dashed line). Works on unsorted data.",
    c: ["O(1)", "O(n)", "O(n)", "O(1)"],
  },
  binary: {
    name: "Binary Search", kind: "search", fn: binarySearch, needsSorted: true
    desc: "Requires sorted data. Compares the middle element to the target and discards half of the range each step (recursive version).",
    c: ["O(1)", "O(log n)", "O(log n)", "O(log n)"],
  },
};

// ---------- Sorting algorithms ----------
function swap(a, i, j) { [a[i], a[j]] = [a[j], a[i]]; }

function* bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: "compare", i: j, j: j + 1 };
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
        swapped = true;
        yield { type: "swap", i: j, j: j + 1 };
      }
    }
    yield { type: "sorted", i: n - 1 - i };
    if (!swapped) return; // already sorted, early exit
  }
}

function* insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      yield { type: "compare", i: j - 1, j };
      if (a[j - 1] <= a[j]) break;
      swap(a, j - 1, j);
      yield { type: "swap", i: j - 1, j };
      j--;
    }
  }
}

function* selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    yield { type: "mark", i: min };
    for (let j = i + 1; j < n; j++) {
      yield { type: "compare", i: min, j };
      if (a[j] < a[min]) {
        min = j;
        yield { type: "mark", i: min };
      }
    }
    if (min !== i) {
      swap(a, i, min);
      yield { type: "swap", i, j: min };
    }
    yield { type: "sorted", i };
  }
}

function* mergeSort(a) {
  yield* mergeSortRec(a, 0, a.length - 1);
}

function* mergeSortRec(a, lo, hi) {
  yield { type: "call", label: `mergeSort(${lo}, ${hi})`, lo, hi };
  if (lo < hi) {
    const mid = (lo + hi) >> 1;
    yield* mergeSortRec(a, lo, mid);
    yield* mergeSortRec(a, mid + 1, hi);
    yield* merge(a, lo, mid, hi);
  }
  yield { type: "return" };
}

function* merge(a, lo, mid, hi) {
  const left = a.slice(lo, mid + 1);
  const right = a.slice(mid + 1, hi + 1);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    // the unconsumed right element still sits at mid + 1 + j
    yield { type: "compare", i: k, j: mid + 1 + j };
    a[k] = left[i] <= right[j] ? left[i++] : right[j++];
    yield { type: "write", i: k };
    k++;
  }
  while (i < left.length) { a[k] = left[i++]; yield { type: "write", i: k++ }; }
  while (j < right.length) { a[k] = right[j++]; yield { type: "write", i: k++ }; }
}

function* quickSort(a) {
  yield* quickSortRec(a, 0, a.length - 1);
}

function* quickSortRec(a, lo, hi) {
  yield { type: "call", label: `quickSort(${lo}, ${hi})`, lo, hi };
  if (lo < hi) {
    const p = yield* partition(a, lo, hi);
    yield* quickSortRec(a, lo, p - 1);
    yield* quickSortRec(a, p + 1, hi);
  } else if (lo === hi) {
    yield { type: "sorted", i: lo };
  }
  yield { type: "return" };
}

// Lomuto partition using the middle element as pivot (avoids O(n²) on sorted input)
function* partition(a, lo, hi) {
  const mid = (lo + hi) >> 1;
  if (mid !== hi) {
    swap(a, mid, hi);
    yield { type: "swap", i: mid, j: hi };
  }
  const pivot = a[hi];
  yield { type: "pivot", i: hi };
  let i = lo;
  for (let j = lo; j < hi; j++) {
    yield { type: "compare", i: j, j: hi };
    if (a[j] < pivot) {
      if (i !== j) {
        swap(a, i, j);
        yield { type: "swap", i, j };
      }
      i++;
    }
  }
  if (i !== hi) {
    swap(a, i, hi);
    yield { type: "swap", i, j: hi };
  }
  yield { type: "pivot", i: -1 };
  yield { type: "sorted", i };
  return i;
}

function* heapSort(a) {
  const n = a.length;
  yield { type: "heap", size: n };
  yield { type: "status", text: "Building max-heap…" };
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(a, i, n);
  }
  yield { type: "status", text: "Extracting max elements…" };
  for (let end = n - 1; end > 0; end--) {
    swap(a, 0, end);
    yield { type: "swap", i: 0, j: end };
    yield { type: "sorted", i: end };
    yield { type: "heap", size: end };
    yield* heapify(a, 0, end);
  }
}

function* heapify(a, i, size) {
  yield { type: "call", label: `heapify(${i}, size=${size})`, lo: 0, hi: size - 1 };
  let largest = i;
  const l = 2 * i + 1, r = 2 * i + 2;
  if (l < size) {
    yield { type: "compare", i: l, j: largest };
    if (a[l] > a[largest]) largest = l;
  }
  if (r < size) {
    yield { type: "compare", i: r, j: largest };
    if (a[r] > a[largest]) largest = r;
  }
  if (largest !== i) {
    swap(a, i, largest);
    yield { type: "swap", i, j: largest };
    yield* heapify(a, largest, size);
  }
  yield { type: "return" };
}

// ---------- Searching algorithms ----------
function* linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    yield { type: "compare", i, j: -1 };
    if (a[i] === target) {
      yield { type: "found", i };
      return;
    }
  }
  yield { type: "notfound" };
}

function* binarySearch(a, target) {
  const idx = yield* binarySearchRec(a, target, 0, a.length - 1);
  yield idx === -1 ? { type: "notfound" } : { type: "found", i: idx };
}

function* binarySearchRec(a, target, lo, hi) {
  yield { type: "call", label: `binarySearch(${lo}, ${hi})`, lo, hi };
  let result = -1;
  if (lo <= hi) {
    const mid = (lo + hi) >> 1;
    yield { type: "compare", i: mid, j: -1 };
    if (a[mid] === target) result = mid;
    else if (a[mid] < target) result = yield* binarySearchRec(a, target, mid + 1, hi);
    else result = yield* binarySearchRec(a, target, lo, mid - 1);
  }
  yield { type: "return" };
  return result;
}

// Shell Sort: insertion sort on elements "gap" apart, shrinking the gap each pass
function* shellSort(a) {
  const n = a.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    yield { type: "status", text: `Gap = ${gap}` };
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        yield { type: "compare", i: j - gap, j };
        if (a[j - gap] <= a[j]) break;
        swap(a, j - gap, j);
        yield { type: "swap", i: j - gap, j };
        j -= gap;
      }
    }
  }
}

// Jump Search: jump ahead in blocks of √n, then scan the block linearly
function* jumpSearch(a, target) {
  const n = a.length, step = Math.floor(Math.sqrt(n)) || 1;
  let prev = 0, curr = step;
  while (curr < n && a[curr - 1] < target) {
    yield { type: "compare", i: curr - 1, j: -1 };
    yield { type: "range", lo: curr, hi: Math.min(curr + step, n) - 1 };
    prev = curr;
    curr += step;
  }
  yield { type: "range", lo: prev, hi: Math.min(curr, n) - 1 };
  for (let i = prev; i < Math.min(curr, n); i++) {
    yield { type: "compare", i, j: -1 };
    if (a[i] === target) { yield { type: "found", i }; return; }
    if (a[i] > target) break;
  }
  yield { type: "notfound" };
}


//new-sorts
//
//
//
//

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const el = {
  bars: $("bars"), targetLine: $("targetLine"),
  algorithm: $("algorithm"), input: $("input"),
  size: $("size"), sizeValue: $("sizeValue"), speed: $("speed"),
  target: $("target"), targetControl: $("targetControl"), randomTarget: $("randomTarget"),
  newArray: $("newArray"), step: $("step"), start: $("start"),
  status: $("status"),
  comparisons: $("comparisons"), swaps: $("swaps"), depth: $("depth"), maxDepth: $("maxDepth"),
  callStack: $("callStack"),
  algoName: $("algoName"), algoDesc: $("algoDesc"),
  cBest: $("cBest"), cAvg: $("cAvg"), cWorst: $("cWorst"), cSpace: $("cSpace"),
};

// ---------- State ----------
let arr = [];
let barEls = [];
let gen = null;        // active generator
let running = false;
let timer = null;
let vis;               // visual state, reset per run

function freshVisState() {
  return {
    compare: [], swap: [], mark: [],
    pivot: -1, found: -1,
    sorted: new Set(),
    range: null, heapSize: 0,
    stack: [], maxDepth: 0,
    comparisons: 0, swaps: 0,
  };
}

// ---------- Array generation ----------
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function generateArray() {
  const n = +el.size.value;
  const type = el.input.value;
  let a;
  switch (type) {
    case "nearly":
      a = Array.from({ length: n }, (_, i) => Math.round(5 + (95 * i) / (n - 1)));
      for (let k = 0; k < Math.max(1, n / 10); k++) swap(a, randInt(0, n - 1), randInt(0, n - 1));
      break;
    case "reversed":
      a = Array.from({ length: n }, (_, i) => Math.round(100 - (95 * i) / (n - 1)));
      break;
    case "few": {
      const vals = [15, 35, 55, 75, 95];
      a = Array.from({ length: n }, () => vals[randInt(0, vals.length - 1)]);
      break;
    }
    default:
      a = Array.from({ length: n }, () => randInt(5, 100));
  }
  return a;
}

function buildBars() {
  el.bars.querySelectorAll(".bar").forEach((b) => b.remove());
  const showLabels = arr.length <= 30;
  barEls = arr.map(() => {
    const b = document.createElement("div");
    b.className = "bar";
    if (showLabels) b.appendChild(document.createElement("span"));
    el.bars.appendChild(b);
    return b;
  });
}

// ---------- Rendering ----------
function render() {
  const t = new Set(vis.compare), s = new Set(vis.swap), m = new Set(vis.mark);
  for (let i = 0; i < arr.length; i++) {
    const b = barEls[i];
    b.style.height = arr[i] + "%";
    if (b.firstChild) b.firstChild.textContent = arr[i];

    let cls = "bar";
    if (i === vis.found) cls += " found";
    else if (s.has(i)) cls += " swap";
    else if (t.has(i)) cls += " compare";
    else if (i === vis.pivot || m.has(i)) cls += " pivot";
    else if (vis.sorted.has(i)) cls += " sorted";
    else if (i < vis.heapSize) cls += " heap";

    if (vis.range && (i < vis.range[0] || i > vis.range[1]) && i !== vis.found) cls += " dim";
    if (b.className !== cls) b.className = cls;
  }

  el.comparisons.textContent = vis.comparisons.toLocaleString();
  el.swaps.textContent = vis.swaps.toLocaleString();
  el.depth.textContent = vis.stack.length;
  el.maxDepth.textContent = vis.maxDepth;
  renderCallStack();
}

let lastStackKey = "";
function renderCallStack() {
  const key = vis.stack.map((f) => f.label).join("|");
  if (key === lastStackKey) return;
  lastStackKey = key;

  const MAX = 10;
  const frames = vis.stack;
  el.callStack.innerHTML = "";
  if (!frames.length) {
    el.callStack.innerHTML = '<li class="empty">empty</li>';
    return;
  }
  const start = Math.max(0, frames.length - MAX);
  if (start > 0) {
    const li = document.createElement("li");
    li.className = "more";
    li.textContent = `… ${start} more frame${start > 1 ? "s" : ""} below`;
    el.callStack.appendChild(li);
  }
  for (let d = start; d < frames.length; d++) {
    const li = document.createElement("li");
    li.textContent = frames[d].label;
    li.style.marginLeft = Math.min(d, 12) * 8 + "px";
    if (d === frames.length - 1) li.className = "top";
    el.callStack.appendChild(li);
  }
}

function updateTargetLine() {
  const isSearch = ALGORITHMS[el.algorithm.value].kind === "search";
  const t = +el.target.value;
  if (!isSearch || !t) { el.targetLine.classList.add("hidden"); return; }
  el.targetLine.classList.remove("hidden");
  el.targetLine.style.bottom = Math.min(100, t) + "%";
}

// ---------- Event handling ----------
function apply(ev) {
  vis.compare = []; vis.swap = []; vis.mark = [];
  switch (ev.type) {
    case "compare":
      vis.comparisons++;
      vis.compare = [ev.i, ev.j].filter((x) => x >= 0);
      break;
    case "swap":
      vis.swaps++;
      vis.swap = [ev.i, ev.j];
      break;
    case "range":  
        vis.range = [ev.lo, ev.hi]; 
        break;
    case "write":
      vis.swaps++;
      vis.swap = [ev.i];
      break;
    case "mark":   vis.mark = [ev.i]; break;
    case "pivot":  vis.pivot = ev.i; break;
    case "sorted": vis.sorted.add(ev.i); break;
    case "heap":   vis.heapSize = ev.size; break;
    case "call":
      vis.stack.push(ev);
      vis.maxDepth = Math.max(vis.maxDepth, vis.stack.length);
      vis.range = [ev.lo, ev.hi];
      break;
    case "return": {
      vis.stack.pop();
      const top = vis.stack[vis.stack.length - 1];
      vis.range = top ? [top.lo, top.hi] : null;
      break;
    }
    case "found":
      vis.found = ev.i;
      vis.range = null;
      setStatus(`Found ${arr[ev.i]} at index ${ev.i} after ${vis.comparisons} comparison(s).`);
      break;
    case "notfound":
      vis.range = null;
      setStatus(`${el.target.value} is not in the array (${vis.comparisons} comparisons).`);
      break;
    case "status": setStatus(ev.text); break;
  }
}

function setStatus(text) { el.status.textContent = text; }

// ---------- Run control ----------
function isSorted(a) { for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false; return true; }

function prepare() {
  const algo = ALGORITHMS[el.algorithm.value];
  vis = freshVisState();
  lastStackKey = null;

  if (algo.kind === "search") {
    if (!el.target.value) pickRandomTarget();
    if (algo === ALGORITHMS.binary && !isSorted(arr)) {
      arr.sort((x, y) => x - y);
      setStatus("Binary search needs sorted data, so the array was sorted first.");
    } else {
      setStatus(`Searching for ${el.target.value}…`);
    }
    gen = algo.fn(arr, +el.target.value);
  } else {
    setStatus(`Running ${algo.name}…`);
    gen = algo.fn(arr);
  }
}

// Speed slider -> (steps per tick, delay ms). High speeds batch several steps per frame.
function speedParams() {
  const v = +el.speed.value;
  if (v >= 90) return { steps: (v - 89) * 3, delay: 0 };
  return { steps: 1, delay: Math.round(400 * Math.pow(1 - v / 90, 2)) + 2 };
}

function advance() {
  const r = gen.next();
  if (r.done) return false;
  apply(r.value);
  return true;
}

function tick() {
  if (!running) return;
  const { steps, delay } = speedParams();
  for (let s = 0; s < steps; s++) {
    if (!advance()) { finish(); return; }
  }
  render();
  timer = delay ? setTimeout(tick, delay) : requestAnimationFrame(tick);
}

function start() {
  if (!gen) prepare();
  running = true;
  el.start.textContent = "Pause";
  tick();
}

function pause() {
  running = false;
  clearTimeout(timer);
  cancelAnimationFrame(timer);
  el.start.textContent = "Resume";
}

function stop() {
  pause();
  gen = null;
  el.start.textContent = "Start";
}

function step() {
  if (running) pause();
  if (!gen) prepare();
  if (!advance()) { finish(); return; }
  render();
  el.start.textContent = "Resume";
}

function finish() {
  const algo = ALGORITHMS[el.algorithm.value];
  stop();
  vis.compare = []; vis.swap = []; vis.mark = []; vis.pivot = -1; vis.range = null; vis.heapSize = 0;
  if (algo.kind === "sort") {
    setStatus(`${algo.name} finished: ${vis.comparisons.toLocaleString()} comparisons, ${vis.swaps.toLocaleString()} swaps/writes, max recursion depth ${vis.maxDepth}.`);
    sweepSorted();
  } else {
    render();
  }
}

// Final green sweep across the bars
function sweepSorted() {
  let i = 0;
  const perFrame = Math.max(1, Math.ceil(arr.length / 40));
  (function frame() {
    for (let k = 0; k < perFrame && i < arr.length; k++) vis.sorted.add(i++);
    render();
    if (i < arr.length) requestAnimationFrame(frame);
  })();
}

function reset(newData = true) {
  stop();
  if (newData) arr = generateArray();
  vis = freshVisState();
  lastStackKey = null;
  buildBars();
  render();
  updateTargetLine();
  setStatus("Press Start to run, or Step to go one operation at a time.");
}

function pickRandomTarget() {
  el.target.value = arr[randInt(0, arr.length - 1)];
  updateTargetLine();
}

function updateAlgoInfo() {
  const algo = ALGORITHMS[el.algorithm.value];
  el.algoName.textContent = algo.name;
  el.algoDesc.textContent = algo.desc;
  [el.cBest.textContent, el.cAvg.textContent, el.cWorst.textContent, el.cSpace.textContent] = algo.c;
  el.targetControl.classList.toggle("hidden", algo.kind !== "search");
  updateTargetLine();
}

// ---------- Wire up ----------
el.start.addEventListener("click", () => (running ? pause() : start()));
el.step.addEventListener("click", step);
el.newArray.addEventListener("click", () => reset(true));
el.input.addEventListener("change", () => reset(true));
el.size.addEventListener("input", () => { el.sizeValue.textContent = el.size.value; reset(true); });
el.algorithm.addEventListener("change", () => {
  updateAlgoInfo();
  if (ALGORITHMS[el.algorithm.value].kind === "search") pickRandomTarget();
  reset(false);
});
el.target.addEventListener("input", () => { stop(); updateTargetLine(); });
el.randomTarget.addEventListener("click", () => { stop(); pickRandomTarget(); });

updateAlgoInfo();
reset(true);
