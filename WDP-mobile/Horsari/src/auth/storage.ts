import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@horsari_session';

export interface StoredUser {
  username: string;
  email: string;
  role: string;
  fullName: string;
}

export interface UserSession {
  accessToken: string;
  user: StoredUser;
}

export async function saveSession(session: UserSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<UserSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
