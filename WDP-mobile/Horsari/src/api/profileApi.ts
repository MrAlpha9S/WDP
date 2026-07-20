import apiClient from './axios';

export interface PickedImage {
  uri: string;
  name: string;
  mimeType: string;
}

export interface AvatarUploadResult {
  ok: boolean;
  message: string;
  image?: string;
}

// Role-agnostic — every role shares the same User.image avatar field.
// Used by both the jockey and spectator profile screens.
export async function uploadAvatar(image: PickedImage): Promise<AvatarUploadResult> {
  try {
    const form = new FormData();
    form.append('image', {
      uri: image.uri,
      name: image.name,
      type: image.mimeType,
    } as any);

    const res = await apiClient.post<{ code: number; data: { image: string }; msg: string }>(
      '/api/auth/avatar',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return {
      ok: res.data.code === 200,
      message: res.data.msg,
      image: res.data.code === 200 ? res.data.data.image : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? 'Connection error. Please try again.',
    };
  }
}
