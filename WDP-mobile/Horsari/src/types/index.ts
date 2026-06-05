export type UserRole = 'spectator' | 'jockey';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  certificateUploaded?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  certificateUri?: string;
  certificateName?: string;
}

export interface UploadedDocument {
  uri: string;
  name: string;
  size: number;
  type: string;
}
