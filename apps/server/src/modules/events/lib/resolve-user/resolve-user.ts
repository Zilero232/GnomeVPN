import { auth } from '../../../../lib';

export const resolveUser = async (token: string | undefined): Promise<string | null> => {
  if (!token) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });

  return session?.user.id ?? null;
};
