export default function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => onChange(star === value ? 0 : star)}
        >
          {star <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
}
