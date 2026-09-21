import { useMutation } from '@tanstack/react-query';

import { issueTelegramCode } from '@/shared/api';

export const useIssueCode = () => useMutation({ mutationFn: issueTelegramCode });
