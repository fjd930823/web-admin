import { getCurrentUser as getCurrentUserApi } from '../api';

export async function currentUser(options?: { [key: string]: any }) {
  return getCurrentUserApi();
}

export declare namespace API {
  type CurrentUser = {
    id?: number;
    username?: string;
    email?: string;
    role?: string;
  };
}