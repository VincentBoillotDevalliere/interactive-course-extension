# JS & Python Intro Course

Welcome to the Introduction to JavaScript and Python course! This repository contains a series of beginner‑friendly exercises designed to help you practice fundamental programming concepts in both JavaScript and Python. Each exercise includes:

- A description of the task
- A code template (.js and .py)
- Automated tests to verify your solution

## 📚 Course Structure

- **Exercises Directory**: Each exercise has its own file in exercises/, named `<exerciseName>.js` and `<exerciseName>.py`.
- **Templates**: The template files include a stub function with a `// TODO` comment (JS) or `pass` (Python) where you write your code.
- **Tests**: Tests are located in tests/js/ (using Mocha + Chai) and tests/py/ (using unittest).



## 📝 Exercises Overview

Below is a summary of the exercises you'll work on. They start with very simple tasks and gradually introduce common programming patterns.

| Name | Description |
|------|-------------|
| declareVariable | Declare and return a variable |
| sayHello | Return a greeting message |
| add | Add two numbers |
| subtract | Subtract one number from another |
| multiply | Multiply two numbers |
| concatStrings | Concatenate two strings |
| getStringLength | Return the length of a string |
| isEven | Check if a number is even |
| maxOfTwo | Return the larger of two numbers |
| square | Return the square of a number |

(More exercises coming soon! Feel free to add your own challenges.)

## 🛠️ Exercise Structure

Each exercise follows this pattern:

- **Template** (.js / .py): Contains a function stub and a `// TODO` or `pass` ➡️ implement your logic there.
- **Test** (.test.js / .py): Verifies expected behavior.
- **Run**:
  - JavaScript: `npm test <exerciseName>`
  - Python: `pytest tests/py/test_<exerciseName>.py`

## ✅ Running All Tests

- **JavaScript**:
  ```bash
  npm test
  ```

- **Python**:
  ```bash
  pytest
  ```

Tests will report success or failure for each exercise. Green means you passed; red means there's still work to do!

## 🎯 Tips for Beginners

- Read the description carefully: Understand what inputs and outputs are expected.
- Use console.log or print statements: Debug intermediate values.
- Keep functions small: Focus on one task at a time.
- Consult the resources below when you get stuck.

## 📖 Resources

### JavaScript Basics
- MDN: https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics
- W3Schools: https://www.w3schools.com/js/js_functions.asp

### Python Basics
- Official Tutorial: https://docs.python.org/3/tutorial/introduction.html
- Real Python: https://realpython.com/python-basics/

## 🤝 Contributing

Feel free to:
- Submit issues for bugs or unclear instructions
- Suggest new beginner exercises
- Open pull requests with improvements

## 📜 License

This project is licensed under the MIT License. See LICENSE for details.

Happy coding! 🎉

