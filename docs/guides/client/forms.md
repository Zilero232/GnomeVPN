# Forms

Part of the [style guide](../README.md).

## 15. Forms — react-hook-form + zodResolver

```tsx
import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const DEFAULT_VALUES: ChangeEmailValues = { newEmail: '' };

const {
  formState: { errors, isDirty },
  handleSubmit,
  register,
  reset
} = useForm<ChangeEmailValues>({
  resolver: zodResolver(changeEmailSchema),
  defaultValues: DEFAULT_VALUES
});
```

- The schema comes from `@gnomevpn/schemas`, never inline in the form.
- `DEFAULT_VALUES` is a module-level constant, not an object literal rebuilt on
  every render.
- A server-side error goes to `onError: toastError` (`useToastError` from
  `@/entities/app/locale`), which maps the `ApiError` code to a localised toast.
  No form maps one back onto a field with `setError` today.
- Validation messages are i18n keys (`validation.emailInvalid`), resolved by
  `useFieldError` from `@/entities/app/locale` — the schema never carries
  user-visible prose.
- A boolean toggle outside a form uses `useBoolean` from
  `@siberiacancode/reactuse` rather than `useState` — except when the setter is
  passed into an effect or a ref, where its identity changes every render.
