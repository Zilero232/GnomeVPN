import { api } from '../http';

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/account');
};
