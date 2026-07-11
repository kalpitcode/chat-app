import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { getUploadsDirectory } from "@/lib/storage"

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()
  const basename = path.basename(fileName, extension).replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40) || "file"
  return `${basename}-${randomUUID()}${extension}`
}

export function isImageAttachment(mimeType: string | null | undefined) {
  return typeof mimeType === "string" && mimeType.startsWith("image/")
}

export async function saveAttachment(file: File) {
  const uploadDirectory = getUploadsDirectory()
  await mkdir(uploadDirectory, { recursive: true })

  const fileName = sanitizeFileName(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = path.join(uploadDirectory, fileName)

  await writeFile(filePath, buffer)

  return {
    fileName,
    publicUrl: `/api/uploads/${fileName}`
  }
}
