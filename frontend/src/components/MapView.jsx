import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const draftIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToSelected({ selectedId, locations }) {
  const map = useMap()
  const prevId = useRef(null)

  useEffect(() => {
    if (selectedId && selectedId !== prevId.current) {
      const loc = locations.find((l) => l.id === selectedId)
      if (loc) {
        map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 8), { duration: 0.8 })
      }
    }
    prevId.current = selectedId
  }, [selectedId, locations, map])

  return null
}

export default function MapView({ locations, selectedId, onMapClick, onMarkerClick, draftCoords }) {
  return (
    <MapContainer center={[30, 110]} zoom={3} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <FlyToSelected selectedId={selectedId} locations={locations} />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={loc.id === selectedId ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onMarkerClick(loc.id) }}
        >
          <Popup>
            <strong>{loc.name}</strong>
            <br />
            {loc.visit_status === 'visited' ? 'Visited' : 'Planned'}
            {loc.rating && <><br />{'★'.repeat(loc.rating)}{'☆'.repeat(5 - loc.rating)}</>}
          </Popup>
        </Marker>
      ))}
      {draftCoords && (
        <Marker position={[draftCoords.lat, draftCoords.lng]} icon={draftIcon}>
          <Popup>New location</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
