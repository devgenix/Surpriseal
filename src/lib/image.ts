export async function optimizeImage(file: File, maxWidth = 800, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export async function compressForUpload(file: File): Promise<Blob | File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      
      // 1920px is generally enough for full-screen HD viewing
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        return resolve(file); // fallback
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Preserve transparency by converting PNGs to WebP, otherwise JPEG
      const isPng = file.type === "image/png";
      const mimeType = isPng ? "image/webp" : "image/jpeg";
      const quality = 0.85; // Good balance of quality and size (approx 85-90%)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Only use compressed if it's actually smaller
            if (blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          } else {
            resolve(file); // fallback
          }
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback on error
    };
    
    img.src = objectUrl;
  });
}
