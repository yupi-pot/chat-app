import api from './axios';

export interface UploadResult {
  url: string;
  fileType: 'image' | 'file';
}

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<UploadResult>('/api/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
