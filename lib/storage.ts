import path from "node:path"

const mimeTypesByExtension: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp"
}

export function getUploadsDirectory() {
  if (process.env.STORAGE_DIR) {
    return path.join(process.env.STORAGE_DIR, "uploads")
  }

  return path.join(process.cwd(), "public", "uploads")
}

export function normalizeStoredFileName(fileName: string) {
  const normalized = path.basename(fileName)

  if (!normalized || normalized !== fileName) {
    return null
  }

  return normalized
}

export function getMimeTypeForStoredFile(fileName: string) {
  return mimeTypesByExtension[path.extname(fileName).toLowerCase()] || "application/octet-stream"
}
