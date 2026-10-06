# Naming

Part of the [style guide](../README.md).

## 5. Naming

| What                     | How                  | Example                                      |
| ------------------------ | -------------------- | -------------------------------------------- |
| Slices                   | kebab-case           | `connect-incy`, `switch-locale`              |
| Segments                 | kebab-case           | `ui`, `model`, `lib`, `api`, `config`        |
| Component folder         | PascalCase           | `AutoRenewControl/`, `TelegramUnlinkDialog/` |
| Component file           | PascalCase + `.tsx`  | `AutoRenewControl.tsx`                       |
| Types file               | `<Name>.types.ts`    | `AutoRenewControl.types.ts`                  |
| Styles file              | `<Name>.module.scss` | `Button.module.scss`                         |
| Hook file                | kebab-case           | `use-subscription-link.ts`                   |
| React component (export) | PascalCase           | `AutoRenewControl`                           |
| Hook                     | `use` + camelCase    | `useBindCard`, `useSubscriptionLink`         |
| Utility                  | camelCase            | `botLink`, `redirectToConfirmation`          |
| Props type               | `<Name>Props`        | `AutoRenewControlProps`                      |
| DTO type                 | `<Name>Input/Output` | `UseTelegramStatusInput`, `BotLinkInput`     |

> Canonical FSD: kebab-case for every file. GnomeVPN deviates: PascalCase for component folders and files, kebab-case for hooks and utilities.
