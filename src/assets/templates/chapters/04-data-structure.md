# Basic Data Structures

Welcome to Basic Data Structures, the fourth module in your computer science journey! This README will guide you through organizing and managing collections of data using clear pseudocode and JavaScript examples.

## 📚 Learning Objectives

By the end of this module, you will be able to:

* Explain what a data structure is and why it matters.
* Create and manipulate arrays (lists).
* Use objects (maps/dictionaries) for key–value storage.
* Leverage sets for unique collections.
* Understand tuple-like constructs for fixed collections.
* Demonstrate all concepts through illustrative examples.

## 📖 Table of Contents

* [What Are Data Structures?](#what-are-data-structures)
* [Arrays (Lists)](#arrays-lists)
* [Objects (Maps/Dictionaries)](#objects-mapsdictionaries)
* [Sets](#sets)
* [Tuple-Like Constructs](#tuple-like-constructs)
* [Examples & Quick Demos](#examples--quick-demos)

## What Are Data Structures?

A data structure is a way to organize and store data so that it can be accessed and modified efficiently.

* **Purpose:** Group related data elements and provide operations to manage them.
* **Trade‑offs:** Different structures optimize for speed, memory, or convenience.

### Conceptual Pseudocode

```
# Store multiple values in a collection:
SET numbers TO [1, 2, 3, 4]

# Associate keys with values:
SET user TO { id: 1, name: "Alex" }

# Maintain a unique collection:
SET primes TO SET OF [2, 3, 5, 7]
```

## Arrays (Lists)

An array (or list) is an ordered collection of items allowing duplicates and indexed access.

| Operation | Pseudocode Example | JavaScript Syntax |
|-----------|-------------------|-------------------|
| Create | `SET arr TO [1, 2, 3]` | `let arr = [1, 2, 3];` |
| Access | `GET arr[0]` | `arr[0] // 1` |
| Append | `APPEND 4 TO arr` | `arr.push(4);` |
| Remove | `REMOVE item AT 1` | `arr.splice(1, 1);` |
| Iterate | `FOR each x IN arr DO ... END FOR` | `for (const x of arr) { ... }` |

> ⚠️ **Tip:** Arrays in JavaScript are dynamic—they resize automatically.

## Objects (Maps/Dictionaries)

An object (map/dictionary) stores key–value pairs for fast lookup by key.

| Operation | Pseudocode Example | JavaScript Syntax |
|-----------|-------------------|-------------------|
| Create | `SET obj TO { key1: val1, key2: val2 }` | `let obj = { key1: val1, key2: val2 };` |
| Access | `GET obj["key1"]` | `obj.key1 // val1 or obj["key1"]` |
| Add/Update | `SET obj["key3"] TO val3` | `obj.key3 = val3;` |
| Delete | `REMOVE obj["key2"]` | `delete obj.key2;` |
| Iterate Keys/Values | `FOR each key, val IN obj DO ... END FOR` | `for (const [k, v] of Object.entries(obj)) { ... }` |

> 💡 **Use Case:** Counting occurrences (e.g., word frequency).

## Sets

A set is an unordered collection of unique values.

| Operation | Pseudocode Example | JavaScript Syntax |
|-----------|-------------------|-------------------|
| Create | `SET s TO SET OF [1, 2, 2, 3]` | `let s = new Set([1, 2, 2, 3]);` |
| Add | `ADD 4 TO s` | `s.add(4);` |
| Delete | `REMOVE 2 FROM s` | `s.delete(2);` |
| Check | `IF 3 IN s THEN ...` | `s.has(3); // true/false` |
| Iterate | `FOR each x IN s DO ... END FOR` | `for (const x of s) { ... }` |

> ⚠️ **Tip:** Sets are ideal for deduplication and membership tests.

## Tuple-Like Constructs

Tuples are fixed-size, ordered collections. JavaScript lacks built-in tuples but you can use arrays or Object.freeze.

| Concept | Pseudocode Example | JavaScript Syntax |
|-----------|-------------------|-------------------|
| Create tuple | `SET point TO (x: 0, y: 0)` | `const point = Object.freeze([0, 0]);` |
| Access | `GET point[1]` | `point[1] // 0` |
| Immutable intent | N/A | `// Attempts to modify will fail silently or error in strict mode` |

> 💡 **Use Case:** Return multiple values from a function without creating an object.

## Examples & Quick Demos

### 1. Word Frequency Counter

**Goal:** Count how often each word appears in a sentence.

**Pseudocode:**
```
SET freq TO {}                    # empty object
FOR each word IN words DO
  IF word IN freq THEN
    INCREMENT freq[word]
  ELSE
    SET freq[word] TO 1
  END IF
END FOR
DISPLAY freq
```

**JavaScript:**
```javascript
const sentence = "hello world hello";
const words = sentence.split(' ');
const freq = {};
for (const w of words) {
  freq[w] = (freq[w] || 0) + 1;
}
console.log(freq); // { hello: 2, world: 1 }
```

### 2. Remove Duplicates Using Set

**Goal:** Eliminate duplicate values from an array.

**Pseudocode:**
```
SET unique TO SET OF arr         # convert list to set
SET result TO LIST OF unique     # back to list
```

**JavaScript:**
```javascript
const arr = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(arr)];
console.log(unique); // [1,2,3,4]
```

### 3. Swap Elements in an Array

**Goal:** Exchange two elements in-place.

**Pseudocode:**
```
SWAP arr[i] WITH arr[j]
```

**JavaScript:**
```javascript
let arr = ['a','b','c'];
const i = 0, j = 2;
[arr[i], arr[j]] = [arr[j], arr[i]];
console.log(arr); // ['c','b','a']
```

### 4. Filtering Values in an Array

**Goal:** Create a new array with only elements that pass a test.

**Pseudocode:**
```
SET result TO EMPTY LIST
FOR each x IN arr DO
  IF x passes test THEN
    ADD x TO result
  END IF
END FOR
```

**JavaScript:**
```javascript
const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens); // [2, 4, 6]
```

---

You've now explored arrays, objects, sets, and tuple-like constructs. These structures help you manage and transform collections of data effectively. Happy coding!

