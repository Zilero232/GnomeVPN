'use client';

import { ErrorView } from '@/views/error';

import type { ErrorViewProps } from '@/views/error';

const ErrorPage = ({ error, reset }: ErrorViewProps) => <ErrorView error={error} reset={reset} />;

export default ErrorPage;
