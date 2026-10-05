import React, { useEffect, useRef, useState } from 'react'

// Full-screen image viewer with swipe-between navigation. Swipe left/right
// on touch devices, tap the arrows, or use the keyboard (desktop preview).
export default function ImageViewer({ images, startIndex = 0, onClose, onDelete }) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef(null)
  const total = images.length

  const go = (delta) => setIndex(i => Math.min(total - 1, Math.max(0, i + delta)))

  useEffect(() => {
    if (total === 0) { onClose(); return }
    if (index > total - 1) setIndex(total - 1)
  }, [total])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  if (!images[index]) return null
  const current = images[index]

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <div className="viewer-overlay" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="viewer-top">
        <span className="viewer-count">{index + 1} / {total}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button
              className="viewer-icon-btn danger"
              onClick={() => onDelete(current)}
            >Delete</button>
          )}
          <button className="viewer-icon-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <img key={current.id} src={current.url} alt="" className="viewer-image" />

      {index > 0 && <button className="viewer-nav viewer-nav-left" onClick={() => go(-1)} aria-label="Previous">‹</button>}
      {index < total - 1 && <button className="viewer-nav viewer-nav-right" onClick={() => go(1)} aria-label="Next">›</button>}
    </div>
  )
}
