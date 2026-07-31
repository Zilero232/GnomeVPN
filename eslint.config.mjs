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

  // The shared config applies these to every language it parses, and they throw
  // on JSON/YAML ("rules do not support the language jsonc/x") — without this
  // block eslint refuses to start at all.
  {
    name: 'gnomevpn/data-files',
    files: ['**/*.json', '**/*.json5', '**/*.jsonc', '**/*.yaml', '**/*.yml', '**/*.toml'],
    rules: {
      'arrow-body-style': 'off',
      'import/newline-after-import': 'off',
      'no-console': 'off',
      'prefer-template': 'off',
      'unicorn/no-typeof-undefined': 'off',
      'unicorn/no-useless-spread': 'off'
    }
  },

  {
    name: 'gnomevpn/typescript',
    files: ['**/*.?([cm])[jt]s?(x)'],
    rules: {
      // `type` everywhere, never `interface` — see the root CLAUDE.md.
      'ts/consistent-type-definitions': ['error', 'type'],
      // No `as` casts. `as const` stays — it narrows literals instead of
      // overriding the checker, which is the opposite of what a cast does.
      // A warning, not an error: the casts that predate this rule are still
      // being worked through, and none of them should block a build.
      'ts/consistent-type-assertions': ['warn', { assertionStyle: 'never' }],
      // Bun and Node both provide these as globals; the rule wants a CJS
      // require() that has no place in an ESM workspace.
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      // "Let the code breathe" from the root CLAUDE.md, enforced instead of
      // eyeballed: a blank line before every exit, and between the const/let
      // setup block and the logic that acts on it. Prettier only preserves
      // blank lines, it never inserts them — this rule does, and --fix applies it.
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: ['return', 'throw', 'continue', 'break'] },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
        // Distinct steps: a block never butts up against whatever precedes or
        // follows it, in either direction.
        {
          blankLine: 'always',
          prev: '*',
          next: ['if', 'for', 'while', 'do', 'switch', 'try', 'function', 'class', 'export']
        },
        {
          blankLine: 'always',
          prev: ['if', 'for', 'while', 'do', 'switch', 'try', 'function', 'class', 'block-like'],
          next: '*'
        },
        // A call that spans several lines is a step of its own. Single-line
        // calls stay grouped, so `log.step(...)` keeps sitting on top of the
        // `await` it announces instead of being pushed away from it.
        { blankLine: 'always', prev: 'multiline-expression', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-expression' },
        { blankLine: 'always', prev: 'multiline-const', next: '*' },
        { blankLine: 'always', prev: 'multiline-let', next: '*' },
        { blankLine: 'any', prev: 'export', next: 'export' },
        { blankLine: 'any', prev: 'directive', next: 'directive' }
      ]
    }
  },

  // Sorting manifest keys is pure churn and fights the conventional field order.
  {
    name: 'gnomevpn/manifests',
    files: ['**/package.json', '**/tsconfig*.json'],
    rules: {
      'jsonc/sort-keys': 'off'
    }
  },

  {
    name: 'gnomevpn/server',
    files: ['apps/server/**'],
    rules: {
      // Nest resolves dependencies from decorator metadata, which `import type`
      // erases — the app then fails to boot with "Nest can't resolve".
      'ts/consistent-type-imports': 'off',
      // main.ts is an ESM entrypoint Bun runs directly.
      'antfu/no-top-level-await': 'off'
    }
  },

  // Console is the output channel of a CLI script, not a leftover debug line.
  {
    name: 'gnomevpn/scripts',
    files: ['**/scripts/**'],
    rules: {
      'no-console': 'off'
    }
  }
);
