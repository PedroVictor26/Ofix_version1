import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "ofix-backend/node_modules/**",
      "tests/**/*.test.js",
      "tests/**/*.cy.js",
      "test-*.js",
      "*.test.js",
      "*.cy.js"
    ],
  },
  js.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks
    },
    rules: reactHooks.configs.recommended.rules
  },
  {
    plugins: {
      'react-refresh': reactRefresh
    },
    rules: {
      'react-refresh/only-export-components': 'warn'
    }
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { 
        'varsIgnorePattern': '^_', 
        'argsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['ofix-backend/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { 
        'varsIgnorePattern': '^_', 
        'argsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      'no-console': 'off', // Permitir console.log no backend
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Configuração para arquivos de teste
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.cy.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        cy: 'readonly',
        Cypress: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off', // Mais flexível em testes
      'no-console': 'off',
    },
  }
];
