# Functions & Modular Code

Welcome to Functions & Modular Code, the third module in your computer science journey! This README will guide you through encapsulating logic into reusable blocks and organizing code into modules, using clear pseudocode and JavaScript examples.

## 📚 Learning Objectives

By the end of this module, you will be able to:

- Explain what a function is and why it's useful.
- Define and invoke functions with parameters and return values.
- Understand variable scope (local vs. global).
- Write modular code by splitting functionality into separate files or units.
- Illustrate all concepts through examples and best practices.

## 📖 Table of Contents

- [What Is a Function?](#what-is-a-function)
- [Defining & Calling Functions](#defining--calling-functions)
- [Parameters & Return Values](#parameters--return-values)
- [Variable Scope](#variable-scope)
- [Pure Functions vs Side Effects](#pure-functions-vs-side-effects)
- [Modular Code & Imports](#modular-code--imports)
- [Examples & Quick Demos](#examples--quick-demos)
- [Practice Exercises](#practice-exercises)

## What Is a Function?

A function is a named sequence of statements that performs a specific task. Functions:

- Encapsulate logic to avoid repetition.
- Improve readability and maintainability.
- Allow you to pass in data (parameters) and get results (return values).

### Conceptual Pseudocode

```pseudocode
DEFINE FUNCTION greet:
  DISPLAY "Hello, world!"
END FUNCTION

CALL greet
```

This pseudocode shows the idea of defining and invoking a function.

## Defining & Calling Functions

### Pseudocode Syntax

```pseudocode
DEFINE FUNCTION add(a, b):
  RETURN a + b
END FUNCTION

SET sum TO CALL add(3, 5)
```

### JavaScript Syntax

```javascript
// Function declaration:
function add(a, b) {
  return a + b;
}

// Function expression:
const multiply = function(x, y) {
  return x * y;
};

// Arrow function (ES6+):
const subtract = (x, y) => x - y;

// Calling functions:
let result = add(3, 5);       // 8
console.log(result);
```

💡 **Tip**: Use function declarations for named utilities and arrow functions for concise callbacks.

## Parameters & Return Values

Functions can accept multiple inputs and return values:

| Concept | Pseudocode Example | JavaScript Syntax |
|---------|-------------------|-------------------|
| No parameters | `DEFINE FUNCTION sayHello:` | `function sayHello() { console.log('Hi'); }` |
| Single parameter | `RETURN double(n): n * 2` | `const double = n => n * 2;` |
| Multiple parameters | `add(a, b) → a + b` | `function add(a, b) { return a + b; }` |
| Returning values | `RETURN value` | `return value;` |
| No return (void) | `PERFORM action, no output` | `function log(msg) { console.log(msg); }` |

⚠️ **Watch out**: If no return statement, functions return `undefined` in JavaScript.

## Variable Scope

Scope determines where variables are accessible:

- **Global Scope**: Variables declared outside any function; accessible anywhere.
- **Local Scope**: Variables declared inside a function; accessible only within that function.
- **Block Scope** (JS let/const): Variables declared inside `{}` are limited to that block.

### Pseudocode

```pseudocode
SET x TO 10             # global
DEFINE FUNCTION test():
  SET x TO 5            # local
  DISPLAY x             # 5
END FUNCTION
CALL test
DISPLAY x               # 10
```

### JavaScript

```javascript
let x = 10;             // global
function test() {
  let x = 5;            // local
  console.log(x);       // 5
}
test();
console.log(x);         // 10

if (true) {
  const y = 20;         // block-scoped
}
// console.log(y);      // ❌ ReferenceError
```

## Pure Functions vs Side Effects

### Pure Functions
- Always return the same output for the same input
- Have no side effects (don't modify external state)
- Make code more predictable and testable

```javascript
// Pure function
function add(a, b) {
  return a + b;  // Same inputs always produce same output
}
```

### Functions with Side Effects
- Modify state outside their scope
- May depend on external state
- Useful for I/O operations, but harder to test

```javascript
// Function with side effect
let total = 0;
function addToTotal(value) {
  total += value;  // Modifies external state
}
```

## Modular Code & Imports

Breaking code into modules improves organization and reuse.

### Pseudocode Modules

```pseudocode
# File: math.pseudo
DEFINE FUNCTION square(n): RETURN n * n
END FUNCTION

# File: main.pseudo
IMPORT square FROM math
DISPLAY CALL square(4)
```

### JavaScript Modules (ES6)

```javascript
// File: math.js
export function square(n) {
  return n * n;
}

// File: main.js
import { square } from './math.js';
console.log(square(4)); // 16
```

💡 **Tip**: Use default export for the primary functionality of a module.

```javascript
// Default export
export default function mainFunction() {
  // Implementation
}

// Import default export
import mainFunction from './module.js';
```

## Examples & Quick Demos

### 1. Greeting Utility

**Goal**: Reusable function to greet users by name.

```javascript
function greetUser(name) {
  return `Hello, ${name}!`;
}
console.log(greetUser('Alex')); // Hello, Alex!
```

### 2. Calculator Module

**Goal**: Group arithmetic operations into a module.

```javascript
// math.js:
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }

// main.js:
import { add, subtract } from './math.js';
console.log(add(5, 7));       // 12
console.log(subtract(10, 3)); // 7
```

### 3. Event Handler Callback

**Goal**: Use an arrow function as a callback for clarity.

```javascript
document.getElementById('btn').addEventListener('click', () => {
  console.log('Button clicked');
});
```

## Practice Exercises

1. **Create a Temperature Converter**
   - Write functions to convert between Celsius and Fahrenheit
   - Create a module with both conversion functions

2. **Build a Simple Calculator**
   - Implement add, subtract, multiply, and divide functions
   - Add input validation to handle edge cases (like division by zero)

3. **Refactor Code into Functions**
   - Take a piece of repetitive code and modularize it
   - Identify opportunities to use pure functions vs. functions with side effects

Functions and modular code empower you to write DRY, maintainable programs. Keep practicing by refactoring existing code into functions and modules. Happy coding!