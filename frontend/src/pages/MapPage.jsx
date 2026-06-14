import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'
import MapView from '../components/MapView'
import LocationList from '../components/LocationList'
import LocationForm from '../components/LocationForm'
import PhotoGallery from '../components/PhotoGallery'

export default function MapPage() {
  const { user, logout } = useAuth()
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [draftCoords, setDraftCoords] = useState(null)
  const [showPhotos, setShowPhotos] = useState(null)

  const fetchLocations = useCallback(async () => {
    const res = await api.get('/locations/')
    setLocations(res.data)
  }, [])

  useEffect(() => { fetchLocations() }, [fetchLocations])

  const filteredLocations = locations.filter((loc) => {
    if (filter === 'all') return true
    return loc.visit_status === filter
  })

  const handleMapClick = (lat, lng) => {
    setDraftCoords({ lat, lng })
    setEditingLocation(null)
    setShowForm(true)
  }

  const handleEdit = (loc) => {
    setEditingLocation(loc)
    setDraftCoords(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    await api.delete(`/locations/${id}`)
    setLocations((prev) => prev.filter((l) => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleFormSave = async (data) => {
    if (editingLocation) {
      const res = await api.put(`/locations/${editingLocation.id}`, data)
      setLocations((prev) => prev.map((l) => l.id === editingLocation.id ? res.data : l))
    } else {
      const res = await api.post('/locations/', { ...data, lat: draftCoords.lat, lng: draftCoords.lng })
      setLocations((prev) => [res.data, ...prev])
    }
    setShowForm(false)
    setEditingLocation(null)
    setDraftCoords(null)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLocation(null)
    setDraftCoords(null)
  }

  return (
    <div className="map-page">
      <header className="top-bar">
        <h1>TrackMap</h1>
        <div className="user-info">
          <span>{user.username}</span>
          <button onClick={logout} className="btn-sm">Logout</button>
        </div>
      </header>
      <div className="main-content">
        <div className="map-container">
          <MapView
            locations={filteredLocations}
            selectedId={selectedId}
            onMapClick={handleMapClick}
            onMarkerClick={setSelectedId}
            draftCoords={draftCoords}
          />
        </div>
        <div className="sidebar">
          <div className="filter-tabs">
            {['all', 'visited', 'planned'].map((f) => (
              <button
                key={f}
                className={`tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'visited' ? 'Visited' : 'Planned'}
              </button>
            ))}
          </div>
          <LocationList
            locations={filteredLocations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShowPhotos={setShowPhotos}
          />
        </div>
      </div>
      {showForm && (
        <LocationForm
          location={editingLocation}
          coords={draftCoords}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
      {showPhotos && (
        <PhotoGallery
          locationId={showPhotos}
          onClose={() => setShowPhotos(null)}
          onUpdate={fetchLocations}
        />
      )}
    </div>
  )
}
