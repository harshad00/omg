// eslint.config.js
import { createConfig } from 'eslint/lib/shared/config/flat.js';
import reactPlugin from 'eslint-plugin-react';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default createConfig([
  {
    files: ["*.js", "*.jsx", "*.ts", "*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptPlugin.parser,
      globals: {
        // Define your global variables here
        // For example:
        React: "readonly"
      }
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": typescriptPlugin
    },
    rules: {
      // Your custom rules here
    }
  },
  {
    files: ["*.jsx"],
    languageOptions: {
      ecmaFeatures: {
        jsx: true
      }
    }
  }
]);
