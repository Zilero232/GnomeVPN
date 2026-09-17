import type { SetupPlatform } from '../../../config';

export type SetupStepsProps = {
  platform: SetupPlatform;
  steps: readonly string[];
};
