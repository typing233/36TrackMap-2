import { useState, useEffect } from 'react'
import CreatableSelect from 'react-select/creatable'
import api from '../api'
import StarRating from './StarRating'

export default function LocationForm({ location, coords, onSave, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rating, setRating] = useState(0)
  const [visitStatus, setVisitStatus] = useState('planned')
  const [tags, setTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/tags/').then((res) => {
      setAllTags(res.data.map((t) => ({ value: t.name, label: t.name })))
    })
  }, [])

  useEffect(() => {
    if (location) {
      setName(location.name)
      setDescription(location.description || '')
      setStartDate(location.start_date || '')
      setEndDate(location.end_date || '')
      setRating(location.rating || 0)
      setVisitStatus(location.visit_status)
      setTags(location.tags.map((t) => ({ value: t.name, label: t.name })))
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        rating: rating || null,
        visit_status: visitStatus,
        tags: tags.map((t) => t.value),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{location ? 'Edit Location' : 'New Location'}</h2>
        {coords && (
          <p className="coords-info">
            Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Location name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this place..."
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <div className="status-toggle">
              <button
                type="button"
                className={`toggle-btn ${visitStatus === 'planned' ? 'active' : ''}`}
                onClick={() => setVisitStatus('planned')}
              >
                Planned
              </button>
              <button
                type="button"
                className={`toggle-btn ${visitStatus === 'visited' ? 'active' : ''}`}
                onClick={() => setVisitStatus('visited')}
              >
                Visited
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <CreatableSelect
              isMulti
              value={tags}
              onChange={setTags}
              options={allTags}
              placeholder="Add tags (e.g. city, nature, food)..."
              className="tag-select"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
