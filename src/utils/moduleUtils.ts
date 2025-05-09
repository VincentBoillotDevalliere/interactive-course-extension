/**
 * Utility function to safely require modules that might not be installed
 */
export function safeRequire(moduleName: string): any {
  try {
    return require(moduleName);
  } catch (error: any) {
    console.log(`Module "${moduleName}" is not available. Error: ${error.message}`);
    return null;
  }
}
