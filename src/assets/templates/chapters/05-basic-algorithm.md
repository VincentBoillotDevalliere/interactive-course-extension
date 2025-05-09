# Basic Algorithms & Problem-Solving Patterns

Welcome to Basic Algorithms & Problem-Solving Patterns, the fifth module in your computer science journey! This README introduces beginner-friendly algorithms and simple problem-solving approaches with clear pseudocode and JavaScript examples.

## 📚 Learning Objectives

By the end of this module, you will be able to:

- Understand what an algorithm is and why it matters.
- Implement a linear search to find values in a list.
- Implement a simple sort (bubble sort) to order small collections.
- Grasp recursion using a basic factorial example.
- Apply the brute force pattern for straightforward problem solving.

## 📖 Table of Contents

- [What Is an Algorithm?](#what-is-an-algorithm)
- [Linear Search](#linear-search)
- [Bubble Sort](#bubble-sort)
- [Recursion: Factorial](#recursion-factorial)
- [Brute Force Pattern](#brute-force-pattern)
- [Examples & Quick Demos](#examples--quick-demos)

## What Is an Algorithm?

An algorithm is a clear, step-by-step set of instructions to solve a problem or perform a task. Good algorithms are:

- **Clear**: each step is well-defined.
- **Correct**: they always produce the expected result.

### Conceptual Pseudocode

```
DEFINE ALGORITHM solveProblem(data):
  PROCESS data in order
  RETURN result
END ALGORITHM
```

## Linear Search

**Goal**: Find a target value by checking each element in a list.

**When to use**: Small or unsorted lists.

**Time Complexity**: O(n) — checks each item once.

### Pseudocode

```
FOR each element IN list DO
  IF element == target THEN
    RETURN index  # found
  END IF
END FOR
RETURN -1           # not found
```

### JavaScript

```javascript
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;      // index of target
    }
  }
  return -1;         // not found
}
```

## Bubble Sort

**Goal**: Sort a small list by repeatedly swapping adjacent out-of-order items.

**When to use**: Educational purposes or very small datasets.

**Time Complexity**: O(n²).

### Pseudocode

```
REPEAT until no swaps:
  FOR i FROM 0 TO length(list)-2 DO
    IF list[i] > list[i+1] THEN
      SWAP list[i], list[i+1]
    END IF
  END FOR
END REPEAT
```

### JavaScript

```javascript
function bubbleSort(arr) {
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i+1]) {
        [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
        swapped = true;
      }
    }
  } while (swapped);
  return arr;
}
```

## Recursion: Factorial

Recursion lets a function call itself to solve smaller instances of a problem.

### Pseudocode

```
DEFINE FUNCTION factorial(n):
  IF n <= 1 THEN
    RETURN 1        # base case
  ELSE
    RETURN n * CALL factorial(n - 1)
  END IF
END FUNCTION
```

### JavaScript

```javascript
function factorial(n) {
  if (n <= 1) {
    return 1;       // stopping condition
  }
  return n * factorial(n - 1);
}
```

> 💡 **Tip**: Always include a base case to prevent infinite recursion.

## Brute Force Pattern

**Idea**: Try all possible options until you find a solution.

**Use case**: Simple problems where the data size is small.

**Trade-off**: Easy to implement but not efficient for large data.

### Example Pseudocode: Pair Sum

```
FOR i FROM 0 TO length(list)-2 DO
  FOR j FROM i+1 TO length(list)-1 DO
    IF list[i] + list[j] == target THEN
      RETURN [i, j]
    END IF
  END FOR
END FOR
RETURN null  # no pair found
```

### JavaScript Implementation

```javascript
function findPairSum(arr, target) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) {
        return [i, j];
      }
    }
  }
  return null; // no pair found
}
```

## Examples & Quick Demos

- **Linear Search Demo**: Find the index of 7 in [3,7,1] — should return 1.
```javascript
console.log(linearSearch([3,7,1], 7)); // 1
```

- **Bubble Sort Demo**: Sort [4,2,5,1] to [1,2,4,5].
```javascript
console.log(bubbleSort([4,2,5,1])); // [1,2,4,5]
```

- **Factorial Demo**: Compute factorial(5) — should return 120.
```javascript
console.log(factorial(5)); // 120
```

- **Pair Sum Demo**: For [1,3,5] and target 8, returns indices [1,2].
```javascript
console.log(findPairSum([1,3,5], 8)); // [1,2]
```

## Complexity Comparison

| Algorithm      | Time Complexity | Space Complexity |
|----------------|-----------------|------------------|
| Linear Search  | O(n)            | O(1)             |
| Bubble Sort    | O(n²)           | O(1)             |
| Factorial      | O(n)            | O(n)             |
| Pair Sum       | O(n²)           | O(1)             |

These beginner-friendly algorithms and patterns lay the groundwork for more advanced topics. Practice implementing them until you feel comfortable, then explore deeper approaches! Happy coding!

