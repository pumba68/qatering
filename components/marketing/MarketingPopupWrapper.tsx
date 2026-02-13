'use client'

import { Component, type ReactNode } from 'react'
import { MarketingPopupContainer } from './MarketingPopupContainer'

/**
 * Umhüllt die Popup-Container mit einem Error Boundary, damit ein Fehler
 * in der Marketing-Ausspielung die ganze Seite nicht blockiert.
 */
class MarketingErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function MarketingPopupWrapper() {
  return (
    <MarketingErrorBoundary>
      <MarketingPopupContainer />
    </MarketingErrorBoundary>
  )
}
