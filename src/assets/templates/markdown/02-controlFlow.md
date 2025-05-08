# Control Flow (Decision & Repetition)

Welcome to Control Flow, the second module in your computer science journey! This README will guide you through making programs that can make decisions and repeat actions, using clear pseudocode and JavaScript examples.

## 📚 Learning Objectives

By the end of this module, you will be able to:

- Explain what control flow is and why it's essential
- Write conditional statements to execute code based on conditions
- Create loops to repeat actions until a condition is met
- Apply loop control keywords (`break`, `continue`) effectively
- Demonstrate all concepts through illustrative examples with explanations

## 📖 Table of Contents

1. [What Is Control Flow?](#what-is-control-flow)
2. [Conditional Statements](#conditional-statements)
3. [Loops](#loops)
4. [Loop Control: break & continue](#loop-control-break--continue)
5. [Examples & Quick Demos](#examples--quick-demos)

## What Is Control Flow?

Control flow determines the order in which individual statements, instructions, or function calls are executed or evaluated.

- **Decision Making**: Choose between different paths of execution
- **Repetition**: Repeat actions until a condition changes

### Conceptual Pseudocode

```pseudocode
IF condition IS true THEN
  EXECUTE actionA
ELSE
  EXECUTE actionB
END IF

WHILE condition IS true DO
  PERFORM action
END WHILE
```

## Conditional Statements

Conditional statements allow your program to make decisions.

| Construct | Purpose | Pseudocode Example | JavaScript Syntax |
|-----------|---------|-------------------|-------------------|
| `if` | Execute code when a condition is true | `IF score >= 100 THEN` | `if (score >= 100) { /* ... */ }` |
| `if-else` | Choose between two paths | `IF loggedIn THEN DISPLAY home ELSE DISPLAY login END IF` | `if (loggedIn) { showHome(); } else { showLogin(); }` |
| `else if / elif` | Multiple conditions | `IF x > 0 THEN ... ELSE IF x < 0 THEN ... ELSE ... END IF` | `if (x>0) {} else if (x<0) {} else {}` |

> 💡 **Tip**: Always cover the `else` case to handle unexpected conditions.

## Loops

Loops repeat a block of code while a condition remains true or iterate over collections.

| Loop Type | Purpose | Pseudocode Example | JavaScript Syntax |
|-----------|---------|-------------------|-------------------|
| `while` | Repeat while condition is true | `WHILE count < 5 DO ... END WHILE` | `while (count < 5) { /* ... */ }` |
| `do-while` | Execute once, then repeat while true | `DO ... WHILE condition` | `do { /* ... */ } while (condition);` |
| `for` | Repeat a known number of times or over items | `FOR i FROM 0 TO 4 DO ... END FOR` | `for (let i=0; i<5; i++) { /* ... */ }` |
| `for...of` | Iterate over iterable values | — | `for (const item of array) { /* ... */ }` |

> ⚠️ **Watch out**: Ensure loops have a termination condition to avoid infinite loops.

## Loop Control: break & continue

Use `break` and `continue` to fine-tune loop behavior.

- **break**: Exit the loop immediately
- **continue**: Skip the current iteration and proceed to the next

### Pseudocode

```pseudocode
FOR each item IN list DO
  IF item IS invalid THEN
    CONTINUE    # skip this item
  END IF
  IF item IS sentinel THEN
    BREAK       # stop the loop entirely
  END IF
  PROCESS item
END FOR
```

### JavaScript

```javascript
for (const item of items) {
  if (!isValid(item)) {
    continue;  // skip invalid items
  }
  if (item === sentinel) {
    break;     // end loop when sentinel found
  }
  process(item);
}
```

## Examples & Quick Demos

### 1. Grading System

**Goal**: Print grade categories based on score.

**Pseudocode**:
```pseudocode
IF score >= 90 THEN DISPLAY "A"
ELSE IF score >= 80 THEN DISPLAY "B"
ELSE IF score >= 70 THEN DISPLAY "C"
ELSE DISPLAY "F"
END IF
```

**JavaScript**:
```javascript
let score = 85;
if (score >= 90) {
  console.log('A');
} else if (score >= 80) {
  console.log('B');
} else if (score >= 70) {
  console.log('C');
} else {
  console.log('F');
}
```

### 2. Sum of Numbers 1–100

**Goal**: Calculate sum using a for loop.

**Pseudocode**:
```pseudocode
SET sum TO 0
FOR i FROM 1 TO 100 DO
  ADD i TO sum
END FOR
DISPLAY sum
```

**JavaScript**:
```javascript
let sum = 0;
for (let i = 1; i <= 100; i++) {
  sum += i;
}
console.log(sum); // 5050
```

### 3. Search with Early Exit

**Goal**: Find a target value in an array and stop when found.

**Pseudocode**:
```pseudocode
FOR each element IN array DO
  IF element == target THEN
    DISPLAY "Found"
    BREAK
  END IF
END FOR
```

**JavaScript**:
```javascript
const array = [2, 4, 6, 8, 10];
const target = 6;
for (const num of array) {
  if (num === target) {
    console.log('Found');
    break;
  }
}
```

### 4. Processing Data with Filtering

**Goal**: Process only valid data items, skipping others.

**Pseudocode**:
```pseudocode
FOR each data IN dataset DO
  IF data IS NOT valid THEN
    CONTINUE
  END IF
  PROCESS data
END FOR
```

**JavaScript**:
```javascript
const dataset = [10, -5, 0, 25, -8, 30];
for (const value of dataset) {
  if (value <= 0) {
    continue; // Skip non-positive numbers
  }
  console.log(`Processing value: ${value}`);
}
```

---

You've now learned how to control the flow of programs through decisions and repetition. Mastery of these concepts unlocks the ability to build complex, dynamic algorithms. Happy coding!

