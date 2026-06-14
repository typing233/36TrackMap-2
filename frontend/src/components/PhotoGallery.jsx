import { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function PhotoGallery({ locationId, onClose, onUpdate }) {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [viewPhoto, setViewPhoto] = useState(null)
  const fileRef = useRef(null)

  const fetchPhotos = async () => {
    const res = await api.get(`/locations/${locationId}/photos/`)
    setPhotos(res.data)
  }

  useEffect(() => { fetchPhotos() }, [locationId])

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files.length) return
    setUploading(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    try {
      await api.post(`/locations/${locationId}/photos/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await fetchPhotos()
      onUpdate()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId) => {
    if (!confirm('Delete this photo?')) return
    await api.delete(`/locations/${locationId}/photos/${photoId}`)
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    onUpdate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content photo-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Photos</h2>
        <div className="photo-upload-area">
          <input
            type="file"
            ref={fileRef}
            multiple
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileRef.current.click()} disabled={uploading} className="btn-primary">
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
        {photos.length === 0 ? (
          <p className="empty-photos">No photos yet.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img
                  src={`/api/locations/${locationId}/photos/${photo.id}/file`}
                  alt={photo.original_name}
                  onClick={() => setViewPhoto(photo)}
                />
                <button className="photo-delete" onClick={() => handleDelete(photo.id)}>x</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-secondary close-btn">Close</button>

        {viewPhoto && (
          <div className="lightbox" onClick={() => setViewPhoto(null)}>
            <img src={`/api/locations/${locationId}/photos/${viewPhoto.id}/file`} alt={viewPhoto.original_name} />
          </div>
        )}
      </div>
    </div>
  )
}
