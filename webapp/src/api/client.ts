export const API_URL = '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra');
  }

  return data;
}

export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData, // Không set Content-Type, trình duyệt tự set với boundary
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Lỗi upload ảnh');
  }

  return data;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));

  const response = await fetch(`${API_URL}/upload/multiple`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Lỗi upload ảnh');
  }

  return data.urls;
}
