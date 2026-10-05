import React, { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { analyseAlbum } from '../utils/analyser.js'
import { buildImageRecord } from '../utils/imageRecord.js'
import { pickFromGallery } from '../utils/gallery.js'
import AlbumCover from '../components/AlbumCover.jsx'
import ImageViewer from '../components/ImageViewer.jsx'

export default function AlbumDetail() {
  const { id } = useParams()
  const { albums, loading, addImage, removeImage, updateAlbum } = useData()
  const fileRef = useRef(null)
  const [analysis, setAnalysis] = useState(null)
  const [analysing, setAnalysing] = useState(false)
  const [analyseStatus, setAnalyseStatus] = useState('')
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [editingCover, setEditingCover] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [viewerAt, setViewerAt] = useState(null)
  const [reorder, setReorder] = useState(false)
  const [showNumbers, setShowNumbers] = useState(() => localStorage.getItem('arelse_show_numbers') !== '0')
  const [moveFrom, setMoveFrom] = useState(null)
  const [moveVal, setMoveVal] = useState('')

  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 14 }} />

  const album = albums.find(a => a.id === id)
  if (!album) {
    return (
      <div className="empty-state">
        <h3>Album not found</h3>
        <Link to="/albums" className="btn">Back to Albums</Link>
      </div>
    )
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportStatus('Analysing image…')
    const reader = new FileReader()
    reader.onload = async () => {
      const record = await buildImageRecord(reader.result)
      await addImage(album.id, record)
      setImporting(false)
      setImportStatus('')
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const importFromGallery = async () => {
    setImporting(true)
    setImportStatus('Opening gallery…')
    try {
      const dataUrls = await pickFromGallery()
      for (let i = 0; i < dataUrls.length; i++) {
        setImportStatus(`Analysing photo ${i + 1} of ${dataUrls.length}…`)
        const record = await buildImageRecord(dataUrls[i])
        await addImage(album.id, record)
      }
    } catch (e) {
      if (e?.message && !/cancel/i.test(e.message)) {
        alert('Could not import from gallery: ' + e.message)
      }
    } finally {
      setImporting(false)
      setImportStatus('')
    }
  }

  const runAnalyser = async () => {
    setAnalysing(true)
    setAnalysis(null)
    setAnalyseStatus('Starting…')
    try {
      setAnalysis(await analyseAlbum(album, setAnalyseStatus))
    } catch (e) {
      setAnalysis({ type: 'unknown', label: 'Analysis failed', confidence: 0, detail: e.message || 'Something went wrong.' })
    }
    setAnalysing(false)
    setAnalyseStatus('')
  }

  const toggleNumbers = () => {
    const next = !showNumbers
    setShowNumbers(next)
    localStorage.setItem('arelse_show_numbers', next ? '1' : '0')
  }

  const moveImage = async (from, to) => {
    const count = album.images.length
    if (to < 0 || to >= count || to === from) return
    const next = [...album.images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    await updateAlbum(album.id, { images: next })
  }

  const reversePages = async () => {
    if (!confirm('Reverse the page order? Page 1 becomes the last page.')) return
    await updateAlbum(album.id, { images: [...album.images].reverse() })
  }

  const submitMove = async (e) => {
    e.preventDefault()
    const to = parseInt(moveVal, 10) - 1
    if (Number.isFinite(to)) await moveImage(moveFrom, Math.min(album.images.length - 1, Math.max(0, to)))
    setMoveFrom(null)
  }

  const setCoverFromImage = async (url) => {
    await updateAlbum(album.id, { coverImage: url })
    setEditingCover(false)
  }

  const importNewCover = async () => {
    setCoverBusy(true)
    try {
      const dataUrls = await pickFromGallery()
      if (dataUrls[0]) await updateAlbum(album.id, { coverImage: dataUrls[0] })
      setEditingCover(false)
    } catch (e) {
      if (e?.message && !/cancel/i.test(e.message)) alert('Could not import cover: ' + e.message)
    } finally {
      setCoverBusy(false)
    }
  }

  const clearCover = async () => {
    await updateAlbum(album.id, { coverImage: null })
    setEditingCover(false)
  }

  return (
    <div>
      <Link to="/albums" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Albums</Link>

      <div style={{ display: 'flex', gap: 16, margin: '14px 0 20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 120, flexShrink: 0 }}>
          <AlbumCover album={album} />
          <button className="btn secondary" style={{ width: '100%', marginTop: 8, fontSize: '0.75rem', padding: '6px' }} onClick={() => setEditingCover(true)}>
            Edit cover
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: '0 0 6px' }}>{album.name}</h2>
          <span className="badge outline">{album.category}</span>
          {album.description && <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>{album.description}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button className="btn" onClick={importFromGallery} disabled={importing}>
              {importing ? (importStatus || 'Working…') : '+ Import from gallery'}
            </button>
            {album.images.length > 0 && (
              <button className="btn secondary" onClick={() => setViewerAt(0)}>▶ Read</button>
            )}
            <label className="btn secondary" style={{ cursor: 'pointer' }}>
              Add single file
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={importing} />
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>Album Analyser</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Compares pages against your Recognizer series with real on-device AI, then falls back to page-shape analysis.
            </p>
          </div>
          <button className="btn secondary" onClick={runAnalyser} disabled={analysing || album.images.length === 0}>
            {analysing ? (analyseStatus || 'Analysing…') : 'Run analysis'}
          </button>
        </div>

        {analysing && <div className="skeleton" style={{ height: 48, borderRadius: 10, marginTop: 14 }} />}

        {analysis && !analysing && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{analysis.label}</strong>
              {analysis.confidence > 0 && <span className="badge">{Math.round(analysis.confidence * 100)}% match</span>}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>{analysis.detail}</p>
            {analysis.candidates && analysis.candidates.length > 0 && (
              <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                Closest series: {analysis.candidates.map(c => `${c.name} ${Math.round(c.score * 100)}%`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

      {album.images.length > 0 && (
        <div className="section-head">
          <strong>Pages ({album.images.length})</strong>
          <div className="view-controls">
            <div className="seg">
              <button className={showNumbers || reorder ? 'on' : ''} onClick={toggleNumbers}>Numbers</button>
            </div>
            <div className="seg">
              <button className={reorder ? 'on' : ''} onClick={() => setReorder(r => !r)}>Reorder</button>
              <button onClick={reversePages}>Reverse</button>
            </div>
          </div>
        </div>
      )}

      {album.images.length === 0 ? (
        <div className="empty-state">
          <h3>No images yet</h3>
          <p>Tap "Import from gallery" to pull real photos in from your device.</p>
        </div>
      ) : (
        <div className="image-grid">
          {album.images.map((img, i) => (
            <div key={img.id} className="page-tile">
              <img
                src={img.url} alt="" loading="lazy"
                style={reorder ? { cursor: 'default' } : undefined}
                onClick={() => { if (!reorder) setViewerAt(i) }}
              />
              {(showNumbers || reorder) && (
                reorder
                  ? <button className="page-num" onClick={() => { setMoveFrom(i); setMoveVal(String(i + 1)) }}>{i + 1}</button>
                  : <span className="page-num">{i + 1}</span>
              )}
              <button
                onClick={() => removeImage(album.id, img.id)}
                className="btn danger"
                style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', fontSize: '0.7rem' }}
              >✕</button>
              {reorder && (
                <div className="page-move">
                  <button disabled={i === 0} onClick={() => moveImage(i, i - 1)}>◀</button>
                  <button disabled={i === album.images.length - 1} onClick={() => moveImage(i, i + 1)}>▶</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewerAt !== null && (
        <ImageViewer images={album.images} startIndex={viewerAt} onClose={() => setViewerAt(null)} onDelete={(img) => removeImage(album.id, img.id)} />
      )}

      {moveFrom !== null && (
        <div className="modal-overlay" onClick={() => setMoveFrom(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submitMove}>
            <h3 style={{ marginTop: 0 }}>Move page {moveFrom + 1}</h3>
            <div className="field">
              <label>New position (1–{album.images.length})</label>
              <input type="number" min="1" max={album.images.length} value={moveVal} onChange={e => setMoveVal(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => setMoveFrom(null)}>Cancel</button>
              <button className="btn" style={{ flex: 1 }}>Move</button>
            </div>
          </form>
        </div>
      )}

      {editingCover && (
        <div className="modal-overlay" onClick={() => setEditingCover(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Edit cover</h3>
            <button className="btn" style={{ width: '100%', marginBottom: 8 }} onClick={importNewCover} disabled={coverBusy}>
              {coverBusy ? 'Working…' : '+ Import new cover photo'}
            </button>
            {album.coverImage && (
              <button className="btn secondary" style={{ width: '100%', marginBottom: 12 }} onClick={clearCover}>
                Use plain color instead
              </button>
            )}
            {album.images.length > 0 && (
              <>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: 8 }}>Or pick from this album's photos:</p>
                <div className="image-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
                  {album.images.map(img => (
                    <img key={img.id} src={img.url} alt="" style={{ cursor: 'pointer', borderRadius: 6 }} onClick={() => setCoverFromImage(img.url)} />
                  ))}
                </div>
              </>
            )}
            <button className="btn secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => setEditingCover(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
