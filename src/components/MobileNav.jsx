import React from 'react'
import { Link, useLocation } from 'react-router-dom'

// Pure structure here — both skins share the same five destinations. Which
// one looks like a floating glass pill vs a flat anchored bar, and how the
// center button glows, is entirely driven by [data-skin] CSS in extra.css.
// Hidden completely under the Default skin (see .mobile-nav { display:none }).
const ITEMS = [
  { to: '/', label: 'Dash', icon: '▦', match: (p) => p === '/' },
  { to: '/albums', label: 'Albums', icon: '📚', match: (p) => p.startsWith('/albums') },
  { to: '/recognizer', label: 'AI', icon: '✦', match: (p) => p === '/recognizer', fab: true },
  { to: '/gallery', label: 'Gallery', icon: '🖼', match: (p) => p === '/gallery' },
  { to: '/settings', label: 'Settings', icon: '⚙', match: (p) => p === '/settings' },
]

export default function MobileNav() {
  const { pathname } = useLocation()
  return (
    <nav className="mobile-nav">
      <ul className="mobile-nav-list">
        {ITEMS.map(item => {
          const active = item.match(pathname)
          if (item.fab) {
            return (
              <li key={item.to} className="mobile-nav-fab-wrap">
                <Link to={item.to} className={'mobile-nav-fab' + (active ? ' active' : '')} aria-label={item.label}>
                  <span className="mobile-nav-icon">{item.icon}</span>
                </Link>
              </li>
            )
          }
          return (
            <li key={item.to}>
              <Link to={item.to} className={'mobile-nav-item' + (active ? ' active' : '')}>
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
