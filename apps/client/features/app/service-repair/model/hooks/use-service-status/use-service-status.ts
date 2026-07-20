'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import { isTauriDesktop, isVpnServiceAvailable, repairVpnService } from '@/shared/lib';

const RECHECK_INTERVAL_MS = 5_000;

export const useServiceStatus = () => {
  const queryClient = useQueryClient();

  const { data: isAvailable = true } = useQuery({
    queryKey: QUERY_KEYS.serviceStatus(),
    queryFn: isVpnServiceAvailable,
    enabled: isTauriDesktop(),
    refetchInterval: (query) => (query.state.data === false ? RECHECK_INTERVAL_MS : false),
    refetchOnWindowFocus: true,
  });

  const repair = useMutation({
    mutationFn: repairVpnService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceStatus() }),
  });

  return {
    isServiceMissing: isTauriDesktop() && !isAvailable,
    repair: repair.mutate,
    isRepairing: repair.isPending,
  };
};
