import { json } from '../utils';

export async function handleGetBucket(_env: unknown, name: string) {
  return json({
    id: 1,
    name: name,
    domain: 'via.placeholder.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  });
}

export async function handleCreateBucket(_env: unknown, _body: string | null) {
  return json({
    id: 1,
    name: 'mock-bucket',
    domain: 'via.placeholder.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }, 201);
}
