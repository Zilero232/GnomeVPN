import type { ReactNode } from 'react';

import { AccountShell } from '@/views/account';

const AccountLayout = ({ children }: { children: ReactNode }) => <AccountShell>{children}</AccountShell>;

export default AccountLayout;
