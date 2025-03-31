import { defineEventHandler, createError } from 'h3'
import formidable from 'formidable'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await access(uploadsDir)
    } catch {
      console.log('Creating uploads directory:', uploadsDir)
      await mkdir(uploadsDir, { recursive: true })
    }

    // Parse the multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: (part) => {
        return part.mimetype?.includes('image/') || false
      }
    })

    // Promise wrapper for form.parse
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err)
          reject(createError({
            statusCode: 400,
            message: `Failed to parse form data: ${err.message}`
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

    // Validate file type
    if (!file.mimetype?.includes('image/')) {
      throw createError({
        statusCode: 400,
        message: 'Only image files are allowed'
      })
    }

    // Generate a more friendly filename
    const originalFilename = file.originalFilename || 'upload.jpg'
    const filename = `${Date.now()}-${originalFilename}`
    const newPath = join(uploadsDir, filename)

    console.log('Processing file:', {
      originalPath: file.filepath,
      newPath,
      size: file.size,
      type: file.mimetype
    })

    // Read the file content
    const fileContent = await readFile(file.filepath)
    console.log('File read successfully, size:', fileContent.length)

    // Write to new location
    await writeFile(newPath, fileContent)
    console.log('File written successfully to:', newPath)

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