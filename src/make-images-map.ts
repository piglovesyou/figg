import { requestImages } from './api';

export async function makeImagesRawMap(
  fileKey: string
): Promise<Map<string, string>> {
  const res = await requestImages(fileKey);
  return new Map(Object.entries(res.meta.images));
}
