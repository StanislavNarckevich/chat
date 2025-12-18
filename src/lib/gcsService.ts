import { Storage } from "@google-cloud/storage";

const projectId = process.env.GCP_PROJECT_ID!;
const bucketName = process.env.GCP_BUCKET_NAME!;
const serviceKey = process.env.GCP_SERVICE_KEY!;


const credentials = JSON.parse(serviceKey);

const storage = new Storage({
    projectId,
    credentials,
});

const bucket = storage.bucket(bucketName);

/**
 * Uploads a file to GCS
 * @param fileBuffer - file contents
 * @param pathName - path in the bucket, e.g. room_123/avatar.jpg
 * @param mimeType - file MIME type
 * @returns file public URL
 */
export const uploadFileToGCS = async (
    fileBuffer: Buffer,
    pathName: string,
    mimeType: string
): Promise<string> => {
    const file = bucket.file(pathName);

    await file.save(fileBuffer, {
        metadata: { contentType: mimeType },
        resumable: false
    });

    return `https://storage.googleapis.com/${bucketName}/${pathName}`;
};

export async function deleteFileFromGCS(fileUrl: string) {
    const bucketName = "your-bucket-name"; // Замените на ваш бакет
    const filePath = new URL(fileUrl).pathname.substring(1); // Извлекаем путь из URL
    await storage.bucket(bucketName).file(filePath).delete();
}