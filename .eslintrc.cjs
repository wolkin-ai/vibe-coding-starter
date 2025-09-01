/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // TypeScript strict rules
    '@typescript-eslint/no-explicit-any': 'error',
    // Disable some rules for simplicity
    'no-unused-vars': 'off',
    'no-undef': 'off',
  },
};
