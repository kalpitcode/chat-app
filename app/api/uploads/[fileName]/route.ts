import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { getMimeTypeForStoredFile, getUploadsDirectory, normalizeStoredFileName } from "@/lib/storage"

type RouteContext = {
  params: Promise<{
    fileName: string
  }>
}

export async function GET(_: Request, context: RouteContext) {
  const { fileName } = await context.params
  const safeFileName = normalizeStoredFileName(fileName)

  if (!safeFileName) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
  }

  const filePath = path.join(getUploadsDirectory(), safeFileName)

  try {
    const buffer = await readFile(filePath)
    const mimeType = getMimeTypeForStoredFile(safeFileName)
    const disposition = mimeType === "application/pdf" || mimeType.startsWith("image/")
      ? "inline"
      : "attachment"

    return new NextResponse(buffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `${disposition}; filename="${safeFileName}"`,
        "Content-Type": mimeType
      }
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
