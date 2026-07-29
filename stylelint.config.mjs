import { stylelint } from '@siberiacancode/stylelint';

export default {
  ...stylelint,
  ignoreFiles: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/out/**', '**/target/**'],
  rules: {
    ...stylelint.rules,
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
    'scss/at-mixin-pattern': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global', 'local'] }],
    'property-no-unknown': [true, { ignoreProperties: ['composes'] }],
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null
  },
  overrides: [
    {
      files: ['apps/client/app/globals.scss'],
      rules: {
        'declaration-no-important': null
      }
    }
  ]
};
