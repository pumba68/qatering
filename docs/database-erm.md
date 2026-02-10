# Datenbank-Schema – Entity-Relationship-Modell (ERM)

Das folgende Diagramm zeigt die Entitäten und Beziehungen des Prisma-Schemas der Kantine Platform.

## Mermaid ER-Diagramm

```mermaid
erDiagram
  Organization ||--o{ Location : "hat"
  Organization ||--o{ User : "hat"

  Company ||--o{ CompanyEmployee : "hat"
  CompanyEmployee }o--|| User : "ist"
  Company ||--o{ Order : "Arbeitgeber-Zuschuss"

  Location ||--o{ Menu : "hat"
  Location ||--o{ Order : "hat"
  Location ||--o{ UserLocation : "hat"
  Location ||--o{ Coupon : "hat"
  UserLocation }o--|| User : "Zugriff"

  User ||--o| Wallet : "hat"
  User ||--o{ Order : "stellt"
  User ||--o{ WalletTransaction : "betrifft"
  User ||--o{ WalletTransaction : "durchgeführt von"
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

  Dish ||--o{ Coupon : "kostenloses Extra"
  Coupon ||--o{ CouponRedemption : "eingelöst"

  Organization {
    string id PK
    string name
    string slug UK
    string logoUrl
    string primaryColor
    string secondaryColor
    datetime createdAt
    datetime updatedAt
  }

  Location {
    string id PK
    string organizationId FK
    string name
    string address
    string phone
    string email
    json openingHours
    intArray workingDays
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  User {
    string id PK
    string email UK
    string name
    string passwordHash
    enum role
    string image
    string organizationId FK
    datetime createdAt
    datetime updatedAt
  }

  Company {
    string id PK
    string name
    string contractNumber
    boolean isActive
    enum subsidyType
    decimal subsidyValue
    decimal subsidyMaxPerDay
    datetime validFrom
    datetime validUntil
    datetime createdAt
    datetime updatedAt
  }

  CompanyEmployee {
    string id PK
    string companyId FK
    string userId FK
    string employeeNumber
    string department
    boolean isActive
    datetime validFrom
    datetime validUntil
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
    string userId FK UK
    decimal balance
    datetime updatedAt
  }

  WalletTransaction {
    string id PK
    string userId FK
    enum type
    decimal amount
    decimal balanceBefore
    decimal balanceAfter
    string description
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
    decimal protein
    decimal carbs
    decimal fat
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
    string paymentMethod
    string paymentIntentId
    string pickupCode UK
    datetime pickupDate
    string pickupTimeSlot
    string notes
    datetime createdAt
    datetime updatedAt
    datetime pickedUpAt
    string couponCode
    decimal discountAmount
    decimal finalAmount
    decimal employerSubsidyAmount
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
    string description
    enum type
    decimal discountValue
    string freeItemDishId FK
    string locationId FK
    datetime startDate
    datetime endDate
    int maxUses
    int maxUsesPerUser
    int currentUses
    decimal minOrderAmount
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
    string refresh_token
    string access_token
    int expires_at
    string id_token
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
    string description
    string icon
    string color
    boolean isActive
    int sortOrder
    datetime createdAt
    datetime updatedAt
  }
```

## Legende

- **PK** = Primary Key  
- **FK** = Foreign Key  
- **UK** = Unique  
- `||--o{` = Eins zu Viele (One-to-Many)  
- `}o--||` = Viele zu Eins (Many-to-One)  
- `||--o|` = Eins zu Null oder Eins (One-to-One optional)

## Enums (im Schema)

- **UserRole:** CUSTOMER, KITCHEN_STAFF, ADMIN, SUPER_ADMIN  
- **SubsidyType:** NONE, PERCENTAGE, FIXED  
- **WalletTransactionType:** TOP_UP, ORDER_PAYMENT, REFUND, ADJUSTMENT  
- **OrderStatus:** PENDING, CONFIRMED, PREPARING, READY, PICKED_UP, CANCELLED  
- **PaymentStatus:** PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED  
- **CouponType:** DISCOUNT_PERCENTAGE, DISCOUNT_FIXED, FREE_ITEM  
- **MetadataType:** DIET_CATEGORY, ALLERGEN, DISH_CATEGORY  

## Wichtige Beziehungen (Kurz)

| Von | Beziehung | Zu |
|-----|-----------|-----|
| Organization | 1:N | Location, User |
| Location | 1:N | Menu, Order, Coupon, UserLocation |
| User | 1:1 | Wallet; N:1 Organization; N:M Location (via UserLocation) |
| Company | 1:N | CompanyEmployee, Order (employerCompanyId) |
| Menu | 1:N | MenuItem, MenuPromotionBanner |
| MenuItem | N:1 | Menu, Dish |
| Order | 1:N | OrderItem, CouponRedemption, WalletTransaction |
| OrderItem | N:1 | Order, MenuItem |
| Coupon | N:1 | Location?, Dish? (freeItem); 1:N CouponRedemption |
| WalletTransaction | N:1 | User, Order?, User (performedBy) |

Die Datei `prisma/schema.prisma` ist die maßgebliche Quelle für das Datenbank-Schema.
