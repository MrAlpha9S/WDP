// Shared shape for every role's self-service "my profile" endpoint —
// the backend flattens { ...roleFields, ...userFields } (see
// AdminService/RefereeService/HorseOwnerService.getMyProfile), so the
// role-specific extras are optional here depending on which role's
// endpoint actually returned the data.
export interface SelfProfileData {
  username: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  dateOfBirth: string | null;
  image: string | null;
  role: string;
  status: string;
  // Admin only
  wallet?: number;
  isMainAdmin?: boolean;
  // Referee / HorseOwner only
  licenseLink?: string | null;
  licenseStatus?: 'pending' | 'approved' | 'rejected';
}

export interface SelfProfileResponse {
  code: number;
  data: SelfProfileData;
  msg: string;
}

export interface UpdateSelfProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface AvatarUploadResponse {
  code: number;
  data: { image: string };
  msg: string;
}
