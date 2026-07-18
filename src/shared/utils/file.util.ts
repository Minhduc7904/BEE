import { remove as removeDiacritics } from 'diacritics'

export function getFileExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  const extensionMap: Record<string, string> = {
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    gif: 'gif',
    webp: 'webp',
    pdf: 'pdf',
    doc: 'doc',
    docx: 'docx',
  }

  return extensionMap[extension || ''] || 'bin'
}

export function generateFileName(originalName: string, extension: string): string {
  const baseName = originalName.split('.').slice(0, -1).join('.') || originalName
  const safeName = removeDiacritics(baseName).replace(/\s+/g, '_').toLowerCase()

  return `${safeName}_${Date.now()}.${extension}`
}
