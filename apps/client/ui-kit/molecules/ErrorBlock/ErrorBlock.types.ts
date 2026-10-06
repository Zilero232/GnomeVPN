export type ErrorBlockProps = {
  message: string;
  retryLabel: string;
  isRetrying?: boolean;
  className?: string;
  onRetry: () => void;
};
