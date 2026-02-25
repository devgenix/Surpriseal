import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  progress: number;
  downloadURL?: string;
  error?: Error;
}

export const uploadFile = (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!storage) {
      reject(new Error("Firebase Storage not initialized"));
      return;
    }

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (url: string): Promise<void> => {
  if (!storage) throw new Error("Firebase Storage not initialized");
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Delete file error:", error);
    // We don't necessarily want to block if delete fails (e.g. file already gone)
  }
};
