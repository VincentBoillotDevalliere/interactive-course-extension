# Variables & Data Types

Welcome to Variables & Data Types, the foundational module in your computer science journey! This README will guide you through understanding, declaring, and manipulating data stored in variables using clear pseudocode and JavaScript examples.

## 📚 Learning Objectives

By the end of this module, you will be able to:

- Explain what a variable is and why it's essential in programming.
- Identify and utilize the five core primitive data types.
- Declare and assign variables in both pseudocode and JavaScript.
- Convert between types and understand when conversion is necessary.
- Apply concepts through illustrative examples with step-by-step explanations.

## 📖 Table of Contents

- [What Is a Variable?](#what-is-a-variable)
- [Primitive Data Types](#primitive-data-types)
- [Declaring & Assigning Variables](#declaring--assigning-variables)
- [Type Conversion & Casting](#type-conversion--casting)
- [Examples & Quick Demos](#examples--quick-demos)

## What Is a Variable?

A variable is a named label for a storage location in memory, allowing you to save, retrieve, and update data during program execution. Variables make code flexible and dynamic.

- **Naming**: Choose meaningful names (e.g., `score`, `userName`).
- **Storage**: Variables hold values that your program can manipulate.
- **Mutability**: Variables can change over time (unless declared constant).

### Why Variables Matter

- **Readability**: Named values clarify intent.
- **Maintainability**: Single point of update when values change.
- **Reusability**: Use the same value in multiple places without duplication.

### Conceptual Pseudocode

```
SET age TO 30        # Save the number 30 under `age`
SET username TO "Sam"  # Save text under `username`
ADD 5 TO age         # Change `age` to 35
```

This pseudocode demonstrates core operations: assignment, storage, and update.

## Primitive Data Types

Every programming language offers basic (primitive) types for representing data. These core types are:

| Data Type | Purpose | Pseudocode Example | JavaScript Literal |
|-----------|---------|-------------------|-------------------|
| Integer | Whole numbers | `SET count TO 10` | `let count = 10;` |
| Float | Numbers with decimals | `SET pi TO 3.14` | `let pi = 3.14;` |
| String | Sequences of characters (text) | `SET greeting TO "Hi"` | `let greeting = "Hi";` |
| Boolean | Logical true/false flags | `SET isLoggedIn TO false` | `let isLoggedIn = false;` |
| Null | Intentional absence of any value | `SET data TO null` | `let data = null;` |

### Key Characteristics:

- **Immutable vs. Mutable**: Strings are typically immutable; numbers and booleans are value types.
- **Memory Footprint**: Primitive types store values directly (not via references).
- **Operations**: Each type supports specific operations (e.g., arithmetic on numbers, concatenation on strings).

## Declaring & Assigning Variables

### Pseudocode Syntax

```
# Declaring a variable is implicit on first assignment:
SET score TO 0         # Create `score` and assign value 0

# Updating a variable:
ADD 10 TO score       # `score` is now 10
MULTIPLY score BY 2    # `score` is now 20
```

### JavaScript Syntax

```javascript
// Use `let` for variables you will reassign:
let score = 0;         // initialize score
score += 10;           // increment by 10
score *= 2;            // multiply by 2

// Use `const` for values that should never change:
const maxPlayers = 4;
// maxPlayers = 5;    // ❌ Error: Assignment to constant variable.
```

💡 **Naming Conventions**: Use camelCase for variables in JavaScript (e.g., `userScore`, `itemCount`).

## Type Conversion & Casting

Converting between types is often necessary when handling user input, performing calculations, or interfacing between systems.

### Common Conversion Scenarios

- **Number ↔ String**: For displaying values or parsing input.
- **String ↔ Boolean**: Parsing truthy/falsy strings.
- **Implicit vs. Explicit Conversion**: JavaScript sometimes auto-converts types (`"5" * 2 === 10`), but explicit conversion is safer.

### Pseudocode Conversions

```
CONVERT age TO STRING       # Outputs text representing age
CONVERT "42" TO NUMBER      # Outputs numeric 42
CHECK IF "true" AS BOOLEAN  # Outputs true/false
```

### JavaScript Conversions

```javascript
// Explicit conversions:
let text = String(score);         // "20"
let num = Number("42");           // 42
let int = parseInt("100px");      // 100
let dec = parseFloat("3.14text"); // 3.14

// Boolean conversions:
Boolean(0);        // false
Boolean("hello");  // true

// Implicit conversions (use with caution):
"5" * 2;           // 10  (string → number)
"5" + 2;           // "52" (number → string)
```

⚠️ **Tip**: Always validate or sanitize external data before conversion to avoid unexpected results.

## Examples & Quick Demos

Below are step-by-step breakdowns of common tasks involving variables and data types.

### 1. Swapping Two Variables

**Goal**: Exchange the values of a and b without a temporary variable.

**Pseudocode**:
```
SET temp TO a
SET a TO b
SET b TO temp
```

**JavaScript**:
```javascript
let a = 5, b = 10;
[a, b] = [b, a];
console.log(a, b); // 10 5
```

### 2. Building a Simple Counter

**Goal**: Track how many times a user clicks a button.

**Pseudocode**:
```
SET counter TO 0
WHEN buttonClicked:
  ADD 1 TO counter
  DISPLAY counter
```

**JavaScript (browser)**:
```javascript
let counter = 0;
document.getElementById('btn').addEventListener('click', () => {
  counter++;
  console.log(`Clicked ${counter} times`);
});
```

### 3. Formatting Output

**Goal**: Combine text and variables for user-friendly messages.

**Pseudocode**:
```
SET greeting TO "Hello, " + username + "!"
DISPLAY greeting
```

**JavaScript**:
```javascript
let username = "Sam";
let greeting = `Hello, ${username}!`;
console.log(greeting); // Hello, Sam!
```

---

You've now mastered the essentials of variables and data types using pseudocode and JavaScript. These building blocks pave the way for all future programming concepts. Ready to move on? Keep practicing and refer back to this guide whenever you need a refresher!

