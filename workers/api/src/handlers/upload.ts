import { json } from '../utils';

const MOCK_UPLOAD = {
  id: Date.now(),
  hash: `mock-hash-${Date.now()}`,
  thumbnailHash: `mock-thumb-${Date.now()}`,
  mediaType: 'image/jpeg',
  bucketName: 'mock-bucket',
  bucket: {
    id: 1,
    name: 'mock-bucket',
    domain: 'via.placeholder.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function handleUpload() {
  return json(MOCK_UPLOAD, 201);
}
