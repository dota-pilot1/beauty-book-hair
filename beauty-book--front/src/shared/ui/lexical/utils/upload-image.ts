import { uploadImage } from '@/shared/api/upload'

export async function uploadImageToS3(file: File): Promise<string> {
  return uploadImage(file, 'board')
}
