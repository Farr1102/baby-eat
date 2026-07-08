export function getUploadURL(upload: any) {
  if (!upload) return ''
  if (upload.hash) {
    if (upload.hash.startsWith('data:')) return upload.hash
    return `//${upload.bucket.domain}/${upload.hash}`
  }
  return ''
}

export function getUploadThumbnailURL(upload: any) {
  if (!upload) return ''
  if (upload.thumbnailHash) {
    if (upload.thumbnailHash.startsWith('data:')) return upload.thumbnailHash
    return `//${upload.bucket.domain}/${upload.thumbnailHash}`
  }
  return ''
}
