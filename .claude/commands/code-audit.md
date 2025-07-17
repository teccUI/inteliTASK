# Code Audit Command

This command performs a comprehensive codebase audit to identify and fix various types of errors including integration issues, API problems, unused imports, component imports, API usage, routing issues, and other potential problems.

## Command Process

1. **Comprehensive Code Analysis**
   - Scan all TypeScript/JavaScript files for syntax and import errors
   - Check API routes for proper error handling and response patterns
   - Identify unused imports and dead code
   - Validate component imports and usage
   - Check routing configuration and links
   - Analyze Firebase/database integration patterns
   - Review environment variable usage
   - Check for TypeScript strict mode violations

2. **Error Categorization**
   - Integration errors (Firebase, Google Calendar, etc.)
   - API errors (routes, handlers, responses)
   - Import/export errors (unused, incorrect paths)
   - Component errors (missing props, incorrect usage)
   - Routing errors (broken links, incorrect paths)
   - TypeScript errors (type mismatches, missing types)
   - Performance issues (unnecessary re-renders, large bundles)
   - Security issues (exposed secrets, unsafe operations)

3. **Automated Fixes**
   - Remove unused imports
   - Fix import paths
   - Add missing error handling
   - Correct type definitions
   - Fix routing issues
   - Update deprecated patterns
   - Optimize performance bottlenecks

## Usage

Run this command to perform a full codebase audit and apply fixes:

```
/code-audit
```

The command will:
1. Create a detailed error report
2. Generate a prioritized task list
3. Systematically fix issues starting with high-priority items
4. Provide a summary of changes made