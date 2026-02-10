'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

const ERM_CHART = `
erDiagram
  Organization ||--o{ Location : "hat"
  Organization ||--o{ User : "hat"
  Company ||--o{ CompanyEmployee : "hat"
  CompanyEmployee }o--|| User : "ist"
  Company ||--o{ Order : "Zuschuss"
  Location ||--o{ Menu : "hat"
  Location ||--o{ Order : "hat"
  Location ||--o{ UserLocation : "hat"
  Location ||--o{ Coupon : "hat"
  UserLocation }o--|| User : "Zugriff"
  User ||--o| Wallet : "hat"
  User ||--o{ Order : "stellt"
  User ||--o{ WalletTransaction : "betrifft"
  User ||--o{ Session : "hat"
  User ||--o{ Account : "hat"
  User ||--o{ CouponRedemption : "löst ein"
  Menu ||--o{ MenuItem : "enthält"
  Menu ||--o{ MenuPromotionBanner : "hat"
  MenuItem }o--|| Dish : "ist"
  MenuPromotionBanner }o--|| PromotionBanner : "verweist"
  Order ||--o{ OrderItem : "enthält"
  Order ||--o{ CouponRedemption : "hat"
  Order ||--o{ WalletTransaction : "hat"
  OrderItem }o--|| MenuItem : "bezieht sich"
  Dish ||--o{ Coupon : "freeItem"
  Coupon ||--o{ CouponRedemption : "eingelöst"
  Organization {
    string id PK
    string name
    string slug UK
    datetime createdAt
    datetime updatedAt
  }
  Location {
    string id PK
    string organizationId FK
    string name
    string address
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }
  User {
    string id PK
    string email UK
    string name
    enum role
    string organizationId FK
    datetime createdAt
    datetime updatedAt
  }
  Company {
    string id PK
    string name
    boolean isActive
    enum subsidyType
    decimal subsidyValue
    datetime createdAt
    datetime updatedAt
  }
  CompanyEmployee {
    string id PK
    string companyId FK
    string userId FK
    boolean isActive
    datetime createdAt
  }
  UserLocation {
    string id PK
    string userId FK
    string locationId FK
    datetime createdAt
  }
  Wallet {
    string id PK
    string userId FK
    decimal balance
    datetime updatedAt
  }
  WalletTransaction {
    string id PK
    string userId FK
    enum type
    decimal amount
    string orderId FK
    string performedById FK
    datetime createdAt
  }
  Menu {
    string id PK
    string locationId FK
    int weekNumber
    int year
    datetime startDate
    datetime endDate
    boolean isPublished
    datetime createdAt
    datetime updatedAt
  }
  PromotionBanner {
    string id PK
    string title
    string subtitle
    string imageUrl
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }
  MenuPromotionBanner {
    string id PK
    string menuId FK
    string promotionBannerId FK
    int sortOrder
  }
  MenuItem {
    string id PK
    string menuId FK
    string dishId FK
    datetime date
    boolean available
    decimal price
    int maxOrders
    int currentOrders
    boolean isPromotion
    decimal promotionPrice
    string promotionLabel
    datetime createdAt
    datetime updatedAt
  }
  Dish {
    string id PK
    string name
    string description
    string imageUrl
    string category
    int calories
    stringArray allergens
    stringArray dietTags
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }
  Order {
    string id PK
    string userId FK
    string locationId FK
    enum status
    decimal totalAmount
    enum paymentStatus
    string pickupCode UK
    datetime pickupDate
    string notes
    datetime createdAt
    datetime updatedAt
    string employerCompanyId FK
  }
  OrderItem {
    string id PK
    string orderId FK
    string menuItemId FK
    int quantity
    decimal price
    datetime createdAt
  }
  Coupon {
    string id PK
    string code UK
    string name
    enum type
    decimal discountValue
    string freeItemDishId FK
    string locationId FK
    datetime startDate
    datetime endDate
    int maxUses
    int maxUsesPerUser
    int currentUses
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }
  CouponRedemption {
    string id PK
    string couponId FK
    string userId FK
    string orderId FK
    datetime redeemedAt
  }
  Account {
    string id PK
    string userId FK
    string type
    string provider
    string providerAccountId
  }
  Session {
    string id PK
    string sessionToken UK
    string userId FK
    datetime expires
  }
  VerificationToken {
    string identifier
    string token UK
    datetime expires
  }
  Metadata {
    string id PK
    enum type
    string name
    boolean isActive
    int sortOrder
    datetime createdAt
    datetime updatedAt
  }
`

export function MermaidDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      er: {
        useMaxWidth: true,
        diagramPadding: 16,
      },
    })

    const id = 'mermaid-erm-' + Math.random().toString(36).slice(2, 9)
    containerRef.current.innerHTML = ''
    const pre = document.createElement('pre')
    pre.className = 'mermaid'
    pre.id = id
    pre.textContent = ERM_CHART.trim()
    containerRef.current.appendChild(pre)

    mermaid
      .run({
        nodes: [pre],
        suppressErrors: false,
      })
      .then(() => setError(null))
      .catch((e) => setError(e.message || 'Diagramm konnte nicht gerendert werden.'))

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [])

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <p className="font-medium">Diagramm konnte nicht geladen werden</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Siehe <code className="rounded bg-muted px-1">docs/database-erm.md</code> für die Mermaid-Quelle.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container overflow-x-auto rounded-xl border border-border/50 bg-card p-6 [&_svg]:max-w-full [&_svg]:h-auto"
      style={{ minHeight: 400 }}
    />
  )
}
