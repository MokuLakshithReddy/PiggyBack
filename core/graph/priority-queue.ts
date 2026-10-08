/**
 * High-performance Binary Min-Heap Priority Queue
 */
export interface PriorityItem<T> {
  element: T;
  priority: number;
}

export class MinPriorityQueue<T> {
  private heap: PriorityItem<T>[] = [];

  constructor() {}

  public get size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public enqueue(element: T, priority: number): void {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0].element;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  public peek(): T | undefined {
    return this.isEmpty() ? undefined : this.heap[0].element;
  }

  public clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    const item = this.heap[index];
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      const parent = this.heap[parentIndex];
      if (item.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = item;
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const item = this.heap[index];
    const halfLength = length >> 1;

    while (index < halfLength) {
      let leftIndex = (index << 1) + 1;
      let rightIndex = leftIndex + 1;
      let smallestIndex = leftIndex;
      let smallestChild = this.heap[leftIndex];

      if (rightIndex < length && this.heap[rightIndex].priority < smallestChild.priority) {
        smallestIndex = rightIndex;
        smallestChild = this.heap[rightIndex];
      }

      if (item.priority <= smallestChild.priority) break;

      this.heap[index] = smallestChild;
      index = smallestIndex;
    }
    this.heap[index] = item;
  }
}
