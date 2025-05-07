import * as vscode from 'vscode';

export async function createCourse() {
  // 1. Language selection
  const language = await vscode.window.showQuickPick(
    ['javascript', 'python'],
    { placeHolder: 'Choose a language' }
  );
  if (!language) { return; }

  // 2. Target folder (first workspace)
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Please open a folder in VS Code first.');
    return;
  }
  const rootUri = workspaceFolders[0].uri;
  
  // Create course folder
  const courseFolderName = `programming-course-${language}`;
  const courseFolderUri = vscode.Uri.joinPath(rootUri, courseFolderName);
  
  try {
    await vscode.workspace.fs.createDirectory(courseFolderUri);
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating course folder: ${error}`);
    return;
  }

  // 3. Build manifest with multiple modules (but only first will be created initially)
  const modules = [
    { id: '01-intro', title: 'Introduction', status: 'active' },
    { id: '02-variables', title: 'Variables', status: 'locked' },
    { id: '03-conditionals', title: 'Conditionals', status: 'locked' },
    { id: '04-loops', title: 'Loops', status: 'locked' },
    { id: '05-functions', title: 'Functions', status: 'locked' }
  ];
  
  const manifest = {
    name: `Programming Course - ${language.charAt(0).toUpperCase() + language.slice(1)}`,
    language: language,
    modules: modules,
    currentModule: '01-intro',
    version: '1.1.0'
  };
  const manifestUri = vscode.Uri.joinPath(courseFolderUri, 'course.json');

  // 4. Write manifest file directly to disk
  try {
    const manifestContent = JSON.stringify(manifest, null, 2);
    await vscode.workspace.fs.writeFile(manifestUri, Buffer.from(manifestContent, 'utf8'));
  } catch (error) {
    vscode.window.showErrorMessage(`Error writing manifest file: ${error}`);
    return;
  }

  // 5. Create only the first module initially
  try {
    // Only create the first module (index 0)
    await createModuleFiles(courseFolderUri, modules[0], language, true);
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating module files: ${error}`);
    return;
  }
  
  // 6. Open first module
  const exUri = vscode.Uri.joinPath(courseFolderUri, '01-intro', 'exercise.md');
  
  try {
    const doc = await vscode.workspace.openTextDocument(exUri);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showErrorMessage(`Error opening module file: ${error}`);
  }

  vscode.window.showInformationMessage(`Course "${manifest.name}" created! Complete the first module to unlock the next one.`);
  
  // 7. Refresh modules tree view
  vscode.commands.executeCommand('extension.refreshModules');
}

// Type definition for module exercise content
interface ExerciseFunctions {
  name: string;
  description: string;
  jsTemplate: string;
  pyTemplate: string;
  jsTest: string;
  pyTest: string;
}

// Enhanced module content generator
async function createModuleFiles(
  rootUri: vscode.Uri, 
  module: any, 
  language: string,
  isActive: boolean
) {
  // Create module directory
  const moduleDir = vscode.Uri.joinPath(rootUri, module.id);
  await vscode.workspace.fs.createDirectory(moduleDir);
  
  const readmeUri = vscode.Uri.joinPath(moduleDir, 'exercise.md');
  const ext = language === 'javascript' ? 'js' : 'py';
  const mainUri = vscode.Uri.joinPath(moduleDir, `main.${ext}`);
  const testUri = vscode.Uri.joinPath(moduleDir, `tests.${ext}`);
  
  // Get exercise content based on module ID
  const exerciseContent = getExerciseContent(module.id, module.title);
  
  // Create exercise readme with more comprehensive content
  const readmeContent = generateReadmeContent(module, ext, exerciseContent);
  
  // Main file content with multiple functions based on module
  const mainContent = language === 'javascript' 
    ? generateJsMainContent(module, exerciseContent)
    : generatePyMainContent(module, exerciseContent);
  
  // Test content with multiple test cases
  const testContent = language === 'javascript'
    ? generateJsTestContent(module, exerciseContent)
    : generatePyTestContent(module, exerciseContent);
  
  // Write files directly to disk
  await vscode.workspace.fs.writeFile(readmeUri, Buffer.from(readmeContent, 'utf8'));
  await vscode.workspace.fs.writeFile(mainUri, Buffer.from(mainContent, 'utf8'));
  await vscode.workspace.fs.writeFile(testUri, Buffer.from(testContent, 'utf8'));
}

// Generate detailed README content
function generateReadmeContent(module: any, ext: string, exerciseContent: ExerciseFunctions[]): string {
  let content = `# Module ${module.id}: ${module.title}\n\n`;
  content += `## Objectives\n\n`;
  content += `In this module, you will learn about ${module.title.toLowerCase()} and practice using them in real code examples.\n\n`;
  content += `## Instructions\n\n`;
  content += `1. Open the \`main.${ext}\` file\n`;
  content += `2. Implement the following functions according to their descriptions:\n`;
  
  // Add each function to implement with descriptions
  exerciseContent.forEach(func => {
    content += `   - \`${func.name}\`: ${func.description}\n`;
  });
  
  content += `3. Run the tests to validate your solution\n`;
  content += `4. All tests must pass to complete this module\n\n`;
  
  // Add more specific resources based on module
  content += `## Resources\n\n`;
  
  if (module.id === '01-intro') {
    content += `- [JavaScript Basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics)\n`;
    content += `- [Python Basics](https://docs.python.org/3/tutorial/introduction.html)\n`;
  } else if (module.id === '02-variables') {
    content += `- [JavaScript Variables](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables)\n`;
    content += `- [Python Variables](https://docs.python.org/3/tutorial/introduction.html#numbers)\n`;
  } else if (module.id === '03-conditionals') {
    content += `- [JavaScript Conditionals](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/conditionals)\n`;
    content += `- [Python Conditionals](https://docs.python.org/3/tutorial/controlflow.html#if-statements)\n`;
  } else if (module.id === '04-loops') {
    content += `- [JavaScript Loops](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Looping_code)\n`;
    content += `- [Python Loops](https://docs.python.org/3/tutorial/controlflow.html#for-statements)\n`;
  } else if (module.id === '05-functions') {
    content += `- [JavaScript Functions](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions)\n`;
    content += `- [Python Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)\n`;
  }
  
  content += `\n## Tips\n\n`;
  content += `- Read the function descriptions carefully\n`;
  content += `- Test your solutions incrementally\n`;
  content += `- Use console.log() or print() to debug your code\n`;
  
  return content;
}

// Generate JavaScript main file content
function generateJsMainContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// main.js file for module ${module.id}: ${module.title}\n\n`;
  
  // Add each function template
  exerciseFunctions.forEach(func => {
    content += `/**\n * ${func.description}\n */\n`;
    content += func.jsTemplate;
    content += `\n\n`;
  });
  
  // Add exports at the end
  content += `module.exports = {\n`;
  const exports = exerciseFunctions.map(func => `  ${func.name}`).join(',\n');
  content += exports + '\n};';
  
  return content;
}

// Generate Python main file content
function generatePyMainContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# main.py file for module ${module.id}: ${module.title}\n\n`;
  
  // Add each function template
  exerciseFunctions.forEach(func => {
    content += `def ${func.name}:\n    """\n    ${func.description}\n    """\n`;
    content += func.pyTemplate;
    content += `\n\n`;
  });
  
  return content;
}

// Generate JavaScript test content
function generateJsTestContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `// tests.js for module ${module.id}: ${module.title}\n`;
  content += `const assert = require('assert');\n`;
  
  // Import the functions to test
  content += `const { ${exerciseFunctions.map(f => f.name).join(', ')} } = require('./main');\n\n`;
  
  // Create test suite
  content += `describe('${module.title} Tests', () => {\n`;
  
  // Add test cases for each function
  exerciseFunctions.forEach(func => {
    content += `  describe('${func.name}', () => {\n`;
    content += func.jsTest;
    content += `  });\n\n`;
  });
  
  content += `});\n`;
  return content;
}

// Generate Python test content
function generatePyTestContent(module: any, exerciseFunctions: ExerciseFunctions[]): string {
  let content = `# tests.py for module ${module.id}: ${module.title}\n`;
  content += `import unittest\n`;
  content += `from main import ${exerciseFunctions.map(f => f.name).join(', ')}\n\n`;
  
  // Create test class
  const className = `Test${module.title.replace(/\s/g, '')}`;
  content += `class ${className}(unittest.TestCase):\n`;
  
  // Add test methods for each function
  exerciseFunctions.forEach(func => {
    content += func.pyTest;
    content += '\n';
  });
  
  content += `\nif __name__ == '__main__':\n`;
  content += `    unittest.main()\n`;
  
  return content;
}

// Get specific exercise content for each module
function getExerciseContent(moduleId: string, moduleTitle: string): ExerciseFunctions[] {
  switch(moduleId) {
    case '01-intro':
      return [
        {
          name: 'sayHello',
          description: 'Return a greeting message',
          jsTemplate: 'function sayHello(name) {\n  // TODO: Return a string "Hello, {name}!"\n  \n}',
          pyTemplate: '    # TODO: Return a string "Hello, {name}!"\n    pass',
          jsTest: '    it("should return a greeting with the name", () => {\n      assert.strictEqual(sayHello("World"), "Hello, World!");\n      assert.strictEqual(sayHello("Student"), "Hello, Student!");\n    });',
          pyTest: '    def test_say_hello(self):\n        self.assertEqual(sayHello("World"), "Hello, World!")\n        self.assertEqual(sayHello("Student"), "Hello, Student!")'
        },
        {
          name: 'add',
          description: 'Add two numbers together',
          jsTemplate: 'function add(a, b) {\n  // TODO: Return the sum of a and b\n  \n}',
          pyTemplate: '    # TODO: Return the sum of a and b\n    pass',
          jsTest: '    it("should add two numbers correctly", () => {\n      assert.strictEqual(add(1, 2), 3);\n      assert.strictEqual(add(-1, 1), 0);\n      assert.strictEqual(add(5, 10), 15);\n    });',
          pyTest: '    def test_add(self):\n        self.assertEqual(add(1, 2), 3)\n        self.assertEqual(add(-1, 1), 0)\n        self.assertEqual(add(5, 10), 15)'
        }
      ];
    
    case '02-variables':
      return [
        {
          name: 'createPerson',
          description: 'Create and return a person object with name, age and city properties',
          jsTemplate: 'function createPerson(name, age, city) {\n  // TODO: Create and return a person object\n  \n}',
          pyTemplate: '    # TODO: Create and return a person dictionary\n    pass',
          jsTest: '    it("should create a person object with the correct properties", () => {\n      const person = createPerson("Alice", 25, "New York");\n      assert.strictEqual(person.name, "Alice");\n      assert.strictEqual(person.age, 25);\n      assert.strictEqual(person.city, "New York");\n    });',
          pyTest: '    def test_create_person(self):\n        person = createPerson("Alice", 25, "New York")\n        self.assertEqual(person["name"], "Alice")\n        self.assertEqual(person["age"], 25)\n        self.assertEqual(person["city"], "New York")'
        },
        {
          name: 'swapVariables',
          description: 'Swap the values of two variables',
          jsTemplate: 'function swapVariables(obj) {\n  // TODO: Swap the values of obj.a and obj.b\n  // obj has properties a and b\n  // Return the modified obj\n  \n}',
          pyTemplate: '    # TODO: Swap the values of a and b in the dictionary\n    # The dictionary has keys "a" and "b"\n    # Return the modified dictionary\n    pass',
          jsTest: '    it("should swap the values of a and b", () => {\n      const result1 = swapVariables({a: 1, b: 2});\n      assert.strictEqual(result1.a, 2);\n      assert.strictEqual(result1.b, 1);\n      \n      const result2 = swapVariables({a: "hello", b: "world"});\n      assert.strictEqual(result2.a, "world");\n      assert.strictEqual(result2.b, "hello");\n    });',
          pyTest: '    def test_swap_variables(self):\n        result1 = swapVariables({"a": 1, "b": 2})\n        self.assertEqual(result1["a"], 2)\n        self.assertEqual(result1["b"], 1)\n        \n        result2 = swapVariables({"a": "hello", "b": "world"})\n        self.assertEqual(result2["a"], "world")\n        self.assertEqual(result2["b"], "hello")'
        },
        {
          name: 'calculateCircleArea',
          description: 'Calculate the area of a circle given its radius',
          jsTemplate: 'function calculateCircleArea(radius) {\n  // TODO: Calculate and return the area of a circle\n  // Use Math.PI for the value of π\n  \n}',
          pyTemplate: '    # TODO: Calculate and return the area of a circle\n    # Use the math.pi constant for the value of π\n    # You\'ll need to import math at the top of the file\n    import math\n    pass',
          jsTest: '    it("should calculate the area of a circle correctly", () => {\n      assert.strictEqual(calculateCircleArea(1), Math.PI);\n      assert.strictEqual(calculateCircleArea(2), Math.PI * 4);\n      assert.strictEqual(calculateCircleArea(0), 0);\n    });',
          pyTest: '    def test_calculate_circle_area(self):\n        import math\n        self.assertEqual(calculateCircleArea(1), math.pi)\n        self.assertEqual(calculateCircleArea(2), math.pi * 4)\n        self.assertEqual(calculateCircleArea(0), 0)'
        }
      ];
      
    case '03-conditionals':
      return [
        {
          name: 'isEven',
          description: 'Check if a number is even',
          jsTemplate: 'function isEven(num) {\n  // TODO: Return true if num is even, false otherwise\n  \n}',
          pyTemplate: '    # TODO: Return True if num is even, False otherwise\n    pass',
          jsTest: '    it("should return true for even numbers", () => {\n      assert.strictEqual(isEven(2), true);\n      assert.strictEqual(isEven(4), true);\n      assert.strictEqual(isEven(100), true);\n    });\n    \n    it("should return false for odd numbers", () => {\n      assert.strictEqual(isEven(1), false);\n      assert.strictEqual(isEven(3), false);\n      assert.strictEqual(isEven(99), false);\n    });',
          pyTest: '    def test_is_even(self):\n        self.assertTrue(isEven(2))\n        self.assertTrue(isEven(4))\n        self.assertTrue(isEven(100))\n        self.assertFalse(isEven(1))\n        self.assertFalse(isEven(3))\n        self.assertFalse(isEven(99))'
        },
        {
          name: 'getGrade',
          description: 'Return a letter grade based on a numerical score',
          jsTemplate: 'function getGrade(score) {\n  // TODO: Return a letter grade based on the score\n  // 90-100: "A"\n  // 80-89: "B"\n  // 70-79: "C"\n  // 60-69: "D"\n  // Below 60: "F"\n  \n}',
          pyTemplate: '    # TODO: Return a letter grade based on the score\n    # 90-100: "A"\n    # 80-89: "B"\n    # 70-79: "C"\n    # 60-69: "D"\n    # Below 60: "F"\n    pass',
          jsTest: '    it("should return correct letter grades", () => {\n      assert.strictEqual(getGrade(95), "A");\n      assert.strictEqual(getGrade(85), "B");\n      assert.strictEqual(getGrade(75), "C");\n      assert.strictEqual(getGrade(65), "D");\n      assert.strictEqual(getGrade(55), "F");\n    });',
          pyTest: '    def test_get_grade(self):\n        self.assertEqual(getGrade(95), "A")\n        self.assertEqual(getGrade(85), "B")\n        self.assertEqual(getGrade(75), "C")\n        self.assertEqual(getGrade(65), "D")\n        self.assertEqual(getGrade(55), "F")'
        },
        {
          name: 'findMax',
          description: 'Find the maximum of three numbers',
          jsTemplate: 'function findMax(a, b, c) {\n  // TODO: Return the maximum of three numbers\n  \n}',
          pyTemplate: '    # TODO: Return the maximum of three numbers\n    pass',
          jsTest: '    it("should find the maximum of three numbers", () => {\n      assert.strictEqual(findMax(1, 2, 3), 3);\n      assert.strictEqual(findMax(5, 2, 1), 5);\n      assert.strictEqual(findMax(1, 5, 2), 5);\n      assert.strictEqual(findMax(5, 5, 5), 5);\n    });',
          pyTest: '    def test_find_max(self):\n        self.assertEqual(findMax(1, 2, 3), 3)\n        self.assertEqual(findMax(5, 2, 1), 5)\n        self.assertEqual(findMax(1, 5, 2), 5)\n        self.assertEqual(findMax(5, 5, 5), 5)'
        }
      ];
      
    case '04-loops':
      return [
        {
          name: 'sumArray',
          description: 'Calculate the sum of all elements in an array',
          jsTemplate: 'function sumArray(arr) {\n  // TODO: Return the sum of all elements in the array\n  \n}',
          pyTemplate: '    # TODO: Return the sum of all elements in the list\n    pass',
          jsTest: '    it("should calculate the sum of array elements", () => {\n      assert.strictEqual(sumArray([1, 2, 3]), 6);\n      assert.strictEqual(sumArray([5, 10, 15, 20]), 50);\n      assert.strictEqual(sumArray([]), 0);\n    });',
          pyTest: '    def test_sum_array(self):\n        self.assertEqual(sumArray([1, 2, 3]), 6)\n        self.assertEqual(sumArray([5, 10, 15, 20]), 50)\n        self.assertEqual(sumArray([]), 0)'
        },
        {
          name: 'countOccurrences',
          description: 'Count occurrences of an element in an array',
          jsTemplate: 'function countOccurrences(arr, element) {\n  // TODO: Count how many times element appears in arr\n  \n}',
          pyTemplate: '    # TODO: Count how many times element appears in the list\n    pass',
          jsTest: '    it("should count occurrences correctly", () => {\n      assert.strictEqual(countOccurrences([1, 2, 3, 2, 1], 1), 2);\n      assert.strictEqual(countOccurrences([1, 2, 3, 2, 1], 2), 2);\n      assert.strictEqual(countOccurrences([1, 2, 3, 2, 1], 4), 0);\n    });',
          pyTest: '    def test_count_occurrences(self):\n        self.assertEqual(countOccurrences([1, 2, 3, 2, 1], 1), 2)\n        self.assertEqual(countOccurrences([1, 2, 3, 2, 1], 2), 2)\n        self.assertEqual(countOccurrences([1, 2, 3, 2, 1], 4), 0)'
        },
        {
          name: 'generateFibonacci',
          description: 'Generate a Fibonacci sequence up to n elements',
          jsTemplate: 'function generateFibonacci(n) {\n  // TODO: Return an array with the first n Fibonacci numbers\n  // The Fibonacci sequence starts with 0, 1 and each subsequent number\n  // is the sum of the two preceding ones\n  \n}',
          pyTemplate: '    # TODO: Return a list with the first n Fibonacci numbers\n    # The Fibonacci sequence starts with 0, 1 and each subsequent number\n    # is the sum of the two preceding ones\n    pass',
          jsTest: '    it("should generate the correct Fibonacci sequence", () => {\n      assert.deepStrictEqual(generateFibonacci(1), [0]);\n      assert.deepStrictEqual(generateFibonacci(2), [0, 1]);\n      assert.deepStrictEqual(generateFibonacci(5), [0, 1, 1, 2, 3]);\n      assert.deepStrictEqual(generateFibonacci(8), [0, 1, 1, 2, 3, 5, 8, 13]);\n    });',
          pyTest: '    def test_generate_fibonacci(self):\n        self.assertEqual(generateFibonacci(1), [0])\n        self.assertEqual(generateFibonacci(2), [0, 1])\n        self.assertEqual(generateFibonacci(5), [0, 1, 1, 2, 3])\n        self.assertEqual(generateFibonacci(8), [0, 1, 1, 2, 3, 5, 8, 13])'
        }
      ];
      
    case '05-functions':
      return [
        {
          name: 'createCalculator',
          description: 'Create a calculator object with add, subtract, multiply, and divide methods',
          jsTemplate: 'function createCalculator() {\n  // TODO: Create and return a calculator object with the following methods:\n  // - add(a, b): returns a + b\n  // - subtract(a, b): returns a - b\n  // - multiply(a, b): returns a * b\n  // - divide(a, b): returns a / b\n  \n}',
          pyTemplate: '    # TODO: Create and return a calculator object with the following methods:\n    # - add(a, b): returns a + b\n    # - subtract(a, b): returns a - b\n    # - multiply(a, b): returns a * b\n    # - divide(a, b): returns a / b\n    # In Python, return a dictionary with these functions\n    pass',
          jsTest: '    it("should create a calculator with working methods", () => {\n      const calc = createCalculator();\n      assert.strictEqual(calc.add(1, 2), 3);\n      assert.strictEqual(calc.subtract(5, 2), 3);\n      assert.strictEqual(calc.multiply(2, 3), 6);\n      assert.strictEqual(calc.divide(6, 2), 3);\n    });',
          pyTest: '    def test_create_calculator(self):\n        calc = createCalculator()\n        self.assertEqual(calc["add"](1, 2), 3)\n        self.assertEqual(calc["subtract"](5, 2), 3)\n        self.assertEqual(calc["multiply"](2, 3), 6)\n        self.assertEqual(calc["divide"](6, 2), 3)'
        },
        {
          name: 'compose',
          description: 'Compose two functions together',
          jsTemplate: 'function compose(f, g) {\n  // TODO: Return a new function that is the composition of f and g\n  // The returned function should take an argument x and return f(g(x))\n  \n}',
          pyTemplate: '    # TODO: Return a new function that is the composition of f and g\n    # The returned function should take an argument x and return f(g(x))\n    pass',
          jsTest: '    it("should compose functions correctly", () => {\n      const double = x => x * 2;\n      const increment = x => x + 1;\n      \n      const doubleThenIncrement = compose(increment, double);\n      const incrementThenDouble = compose(double, increment);\n      \n      assert.strictEqual(doubleThenIncrement(3), 7); // double(3) = 6, then increment(6) = 7\n      assert.strictEqual(incrementThenDouble(3), 8); // increment(3) = 4, then double(4) = 8\n    });',
          pyTest: '    def test_compose(self):\n        def double(x):\n            return x * 2\n        \n        def increment(x):\n            return x + 1\n        \n        double_then_increment = compose(increment, double)\n        increment_then_double = compose(double, increment)\n        \n        self.assertEqual(double_then_increment(3), 7)  # double(3) = 6, then increment(6) = 7\n        self.assertEqual(increment_then_double(3), 8)  # increment(3) = 4, then double(4) = 8'
        },
        {
          name: 'memoize',
          description: 'Create a memoized version of a function',
          jsTemplate: 'function memoize(fn) {\n  // TODO: Return a memoized version of the provided function\n  // The function should cache results for repeated inputs\n  \n}',
          pyTemplate: '    # TODO: Return a memoized version of the provided function\n    # The function should cache results for repeated inputs\n    pass',
          jsTest: '    it("should memoize function results", () => {\n      let computeCount = 0;\n      const expensiveComputation = (x) => {\n        computeCount++;\n        return x * 2;\n      };\n      \n      const memoizedFn = memoize(expensiveComputation);\n      \n      assert.strictEqual(memoizedFn(1), 2);\n      assert.strictEqual(computeCount, 1);\n      \n      // This should use the cached result\n      assert.strictEqual(memoizedFn(1), 2);\n      assert.strictEqual(computeCount, 1); // Count should not increase\n      \n      // This should compute a new result\n      assert.strictEqual(memoizedFn(2), 4);\n      assert.strictEqual(computeCount, 2);\n    });',
          pyTest: '    def test_memoize(self):\n        compute_count = 0\n        \n        def expensive_computation(x):\n            nonlocal compute_count\n            compute_count += 1\n            return x * 2\n        \n        memoized_fn = memoize(expensive_computation)\n        \n        self.assertEqual(memoized_fn(1), 2)\n        self.assertEqual(compute_count, 1)\n        \n        # This should use the cached result\n        self.assertEqual(memoized_fn(1), 2)\n        self.assertEqual(compute_count, 1)  # Count should not increase\n        \n        # This should compute a new result\n        self.assertEqual(memoized_fn(2), 4)\n        self.assertEqual(compute_count, 2)'
        }
      ];
      
    default:
      return [
        {
          name: 'testFunction',
          description: 'A simple test function that returns true',
          jsTemplate: 'function testFunction() {\n  // TODO: Return true\n  return false; // Change this\n}',
          pyTemplate: '    # TODO: Return True\n    return False  # Change this',
          jsTest: '    it("should return true", () => {\n      assert.strictEqual(testFunction(), true);\n    });',
          pyTest: '    def test_function(self):\n        self.assertTrue(test_function())'
        }
      ];
  }
}

// Export this helper function so it can be used by the ProgressManager
export { createModuleFiles };