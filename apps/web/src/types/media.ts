export type MediaKind =
  | 'PHOTO_PROGRESS'
  | 'PHOTO_ASSESSMENT'
  | 'EXERCISE_VIDEO'
  | 'EXERCISE_GIF'
  | 'OTHER';

export type MediaEntityType =
  | 'USER_PROGRESS'
  | 'ASSESSMENT'
  | 'EXERCISE'
  | 'PROFILE'
  | 'OTHER';

export type MediaFileRecord = {
  id: string;
  ownerUserId: string;
  entityType: MediaEntityType;
  entityId: string | null;
  kind: MediaKind;
  bucket: string;
  objectKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  publicUrl: string;
  bucket: string;
  objectKey: string;
  expiresIn: number;
};
