import { defineEventHandler, createError } from 'h3'
import formidable from 'formidable'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Parse the multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    })

    // Promise wrapper for form.parse
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err)
          reject(createError({
            statusCode: 400,
            message: 'Failed to parse form data'
          }))
          return
        }
        resolve({ fields, files })
      })
    })

    // Get the uploaded file
    const file = files.photo?.[0]

    if (!file) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }

    // Generate a more friendly filename
    const originalFilename = file.originalFilename || 'upload.jpg'
    const filename = `${Date.now()}-${originalFilename}`
    const newPath = join(uploadsDir, filename)

    // Rename the file (it's already saved to the uploadDir)
    if (file.filepath !== newPath) {
      await writeFile(newPath, await readFile(file.filepath))
    }

    // Return the public URL
    return {
      url: `/uploads/${filename}`
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload file'
    })
  }
})