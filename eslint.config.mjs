import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true,
    react: true,
    jsxA11y: true,
    ignores: [
      '**/node_modules',
      '**/.next',
      '**/out',
      '**/dist',
      '**/generated',
      '**/next-env.d.ts',
      '**/target',
      'apps/tauri/gen',
      'apps/server/prisma/migrations',
      'docs/**',
      '**/*.md/**'
    ]
  },
  {
    name: 'gnomevpn/rules',
    files: ['**/*.?([cm])[jt]s?(x)'],
    rules: {
      'ts/no-explicit-any': 'error',
      'ts/consistent-type-definitions': ['error', 'type'],
      'style/lines-between-class-members': 'off',
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
      'unicorn/filename-case': 'off'
    }
  },
  {
    name: 'gnomevpn/data-files',
    files: ['**/*.json', '**/*.json5', '**/*.jsonc', '**/*.yaml', '**/*.yml', '**/*.toml'],
    rules: {
      'unicorn/no-typeof-undefined': 'off',
      'unicorn/no-useless-spread': 'off',
      'prefer-template': 'off',
      'arrow-body-style': 'off',
      'no-console': 'off',
      'import/newline-after-import': 'off'
    }
  },
  {
    name: 'gnomevpn/manifests',
    files: ['**/package.json', '**/tsconfig*.json'],
    rules: {
      'jsonc/sort-keys': 'off'
    }
  },
  {
    name: 'gnomevpn/client-ui',
    files: ['apps/client/shared/ui/**', 'apps/client/scripts/**'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    name: 'gnomevpn/server',
    files: ['apps/server/**'],
    rules: {
      'ts/consistent-type-imports': 'off',
      'ts/no-extraneous-class': 'off',
      'new-cap': 'off',
      'antfu/no-top-level-await': 'off',
      'react/no-unnecessary-use-prefix': 'off'
    }
  },
  {
    name: 'gnomevpn/scripts',
    files: ['scripts/**', '**/*.mjs', 'apps/*/scripts/**'],
    rules: {
      'no-console': 'off'
    }
  }
);
