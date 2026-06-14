export default function LocationList({ locations, selectedId, onSelect, onEdit, onDelete, onShowPhotos }) {
  if (locations.length === 0) {
    return <div className="empty-list">No locations yet. Click on the map to add one!</div>
  }

  return (
    <div className="location-list">
      {locations.map((loc) => (
        <div
          key={loc.id}
          className={`location-card ${loc.id === selectedId ? 'selected' : ''}`}
          onClick={() => onSelect(loc.id)}
        >
          <div className="card-header">
            <h3>{loc.name}</h3>
            <span className={`status-badge ${loc.visit_status}`}>
              {loc.visit_status === 'visited' ? 'Visited' : 'Planned'}
            </span>
          </div>
          {loc.rating && (
            <div className="card-rating">
              {'★'.repeat(loc.rating)}{'☆'.repeat(5 - loc.rating)}
            </div>
          )}
          {loc.tags.length > 0 && (
            <div className="card-tags">
              {loc.tags.map((t) => <span key={t.id} className="tag">{t.name}</span>)}
            </div>
          )}
          {(loc.start_date || loc.end_date) && (
            <div className="card-dates">
              {loc.start_date || '?'} ~ {loc.end_date || '?'}
            </div>
          )}
          <div className="card-actions">
            <button onClick={(e) => { e.stopPropagation(); onEdit(loc) }}>Edit</button>
            <button onClick={(e) => { e.stopPropagation(); onShowPhotos(loc.id) }}>Photos</button>
            <button className="danger" onClick={(e) => { e.stopPropagation(); onDelete(loc.id) }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
