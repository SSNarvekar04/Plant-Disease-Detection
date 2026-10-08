import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Uppercase identifiers are component-like in this codebase (icons, page
      // components). They are accepted both as variables and as props such as
      // `icon: Icon`, which is otherwise reported as an unused argument.
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^(_|[A-Z])' },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth', 'useTheme'] },
      ],
    },
  },
];