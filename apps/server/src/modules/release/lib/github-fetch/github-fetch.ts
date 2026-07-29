import type { GithubFetchInput } from './github-fetch.types';

import { GITHUB_TIMEOUT_MS } from '../../config';

export class GithubFetchError extends Error {}

export const githubFetch = async ({
  url,
  headers,
  redirect,
  describe
}: GithubFetchInput): Promise<Response> => {
  let response: Response;

  try {
    response = await fetch(url, {
      headers,
      redirect,
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS)
    });
  } catch (error) {
    throw new GithubFetchError(`${describe} unreachable: ${String(error)}`);
  }

  if (redirect !== 'manual' && !response.ok) {
    throw new GithubFetchError(`${describe} answered ${response.status}`);
  }

  return response;
};
