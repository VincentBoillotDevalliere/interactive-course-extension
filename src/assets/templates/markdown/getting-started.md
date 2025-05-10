# Getting Started with Your Interactive Course

## 👋 Welcome to Your Interactive Learning Experience!

This interactive course is designed to help you learn programming concepts through hands-on practice and immediate feedback. This guide will walk you through how everything is organized and how to get the most out of your learning experience.

## 📁 Course Structure

Each module in this course is organized as follows:

```
module-name/
  ├── lesson.md         # The lesson content, explanations, and examples
  ├── index.js          # Main file that imports all exercises
  ├── tests.js          # Master test runner
  ├── exercises/        # Directory containing individual exercise files
  │   ├── exercise-1.js
  │   ├── exercise-2.js
  │   └── ...
  └── tests/            # Directory containing test files for each exercise
      ├── exercise-1.test.js
      ├── exercise-2.test.js
      └── ...
```

## 📚 Getting Started

### 1. Opening a Module

- Navigate to a module folder using the **Course Explorer** in the activity bar 
  (look for the 📚 icon)
- Click on a module to view its contents
- Open the `lesson.md` file to read the lesson content
- To see the formatted lesson with proper styling, open the Markdown preview by:
  - Right-clicking on the `lesson.md` tab and selecting "Open Preview"
  - Or clicking the preview button in the top-right corner of the editor
  - Or using the keyboard shortcut: `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)
  - Or using `Ctrl+K V` (Windows/Linux) or `Cmd+K V` (Mac) to open the preview to the side

### 2. Working on Exercises

- Open the `exercises` directory to find the individual exercise files
- Each exercise file contains a function you need to implement
- Read the function description and requirements carefully
- Write your code solution in the exercise file
- You can test your solution anytime (see Testing Your Code section below)

### 3. Testing Your Code

You have several ways to run tests for your exercises:

#### Option 1: Run Tests from Command Palette
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the Command Palette
2. Type "LearnForge: Run Current Module Tests" and press Enter

#### Option 2: Run Tests from Course Explorer
1. Find your module in the Course Explorer view
2. Click the "Run Tests" (▶️) button next to the module

#### Option 3: Use the Keyboard Shortcut
- Press `Ctrl+Alt+T` (Windows/Linux) or `Cmd+Alt+T` (Mac)

### 4. Understanding Test Results

When you run tests, you'll see detailed results in the output panel:

- ✅ **Green checkmarks** mean your code passed that test
- ❌ **Red X marks** indicate failed tests that need fixing
- 💡 **Hints** are provided to help you understand common errors
- 📊 **Test summary** shows your overall progress

Don't worry if your tests fail at first! That's part of the learning process. Read the error messages and hints carefully, make changes to your code, and try again.

### 5. Moving to the Next Module

Once you've successfully completed all the tests for a module:

1. You'll see a congratulations message
2. The next module will automatically be unlocked
3. Click on "Next Module" in the notification or navigate to it in the Course Explorer

## 🔍 Additional Tips

- **Use the Console**: Add `console.log()` statements in your code to debug and understand what's happening.
- **Read the Examples**: Each lesson includes practical examples that demonstrate the concepts you're learning.
- **Experiment**: Don't be afraid to experiment with the code even beyond the requirements.
- **Take Your Time**: Learning is not a race. Make sure you understand the concepts before moving on.

## 🛠️ Troubleshooting

If you encounter any issues:

- Make sure your VS Code is up to date
- Check that you have the necessary prerequisites installed (Node.js for JavaScript courses)
- Try reloading the VS Code window (`Ctrl+R` or `Cmd+R`)
- If tests aren't running, check if there are any error messages in the output panel

## 🎉 Ready to Begin!

Now that you know how everything works, you're ready to start your learning journey!

1. Open your first module's `lesson.md` file
2. Follow the instructions and complete the exercises
3. Run the tests to verify your solutions
4. Progress through the modules at your own pace

Happy coding and enjoy your interactive learning experience! 🚀
