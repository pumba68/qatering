
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  logoUrl: 'logoUrl',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contractNumber: 'contractNumber',
  isActive: 'isActive',
  subsidyType: 'subsidyType',
  subsidyValue: 'subsidyValue',
  subsidyMaxPerDay: 'subsidyMaxPerDay',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyEmployeeScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  employeeNumber: 'employeeNumber',
  department: 'department',
  isActive: 'isActive',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  createdAt: 'createdAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  openingHours: 'openingHours',
  workingDays: 'workingDays',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  passwordHash: 'passwordHash',
  role: 'role',
  image: 'image',
  organizationId: 'organizationId',
  marketingEmailConsent: 'marketingEmailConsent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  balance: 'balance',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletTransactionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  amount: 'amount',
  balanceBefore: 'balanceBefore',
  balanceAfter: 'balanceAfter',
  description: 'description',
  orderId: 'orderId',
  performedById: 'performedById',
  createdAt: 'createdAt'
};

exports.Prisma.UserLocationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  locationId: 'locationId',
  createdAt: 'createdAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.MenuScalarFieldEnum = {
  id: 'id',
  locationId: 'locationId',
  weekNumber: 'weekNumber',
  year: 'year',
  startDate: 'startDate',
  endDate: 'endDate',
  isPublished: 'isPublished',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PromotionBannerScalarFieldEnum = {
  id: 'id',
  title: 'title',
  subtitle: 'subtitle',
  imageUrl: 'imageUrl',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MenuPromotionBannerScalarFieldEnum = {
  id: 'id',
  menuId: 'menuId',
  promotionBannerId: 'promotionBannerId',
  sortOrder: 'sortOrder'
};

exports.Prisma.MenuItemScalarFieldEnum = {
  id: 'id',
  menuId: 'menuId',
  dishId: 'dishId',
  date: 'date',
  available: 'available',
  price: 'price',
  maxOrders: 'maxOrders',
  currentOrders: 'currentOrders',
  isPromotion: 'isPromotion',
  promotionPrice: 'promotionPrice',
  promotionLabel: 'promotionLabel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DishScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  imageUrl: 'imageUrl',
  category: 'category',
  calories: 'calories',
  protein: 'protein',
  carbs: 'carbs',
  fat: 'fat',
  allergens: 'allergens',
  dietTags: 'dietTags',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  locationId: 'locationId',
  status: 'status',
  totalAmount: 'totalAmount',
  paymentStatus: 'paymentStatus',
  paymentMethod: 'paymentMethod',
  paymentIntentId: 'paymentIntentId',
  pickupCode: 'pickupCode',
  pickupDate: 'pickupDate',
  pickupTimeSlot: 'pickupTimeSlot',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  pickedUpAt: 'pickedUpAt',
  couponCode: 'couponCode',
  discountAmount: 'discountAmount',
  finalAmount: 'finalAmount',
  employerSubsidyAmount: 'employerSubsidyAmount',
  employerCompanyId: 'employerCompanyId'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  type: 'type',
  discountValue: 'discountValue',
  freeItemDishId: 'freeItemDishId',
  locationId: 'locationId',
  startDate: 'startDate',
  endDate: 'endDate',
  maxUses: 'maxUses',
  maxUsesPerUser: 'maxUsesPerUser',
  currentUses: 'currentUses',
  minOrderAmount: 'minOrderAmount',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponRedemptionScalarFieldEnum = {
  id: 'id',
  couponId: 'couponId',
  userId: 'userId',
  orderId: 'orderId',
  redeemedAt: 'redeemedAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  menuItemId: 'menuItemId',
  quantity: 'quantity',
  price: 'price',
  createdAt: 'createdAt'
};

exports.Prisma.MetadataScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  description: 'description',
  icon: 'icon',
  color: 'color',
  isActive: 'isActive',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerSegmentScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  rulesCombination: 'rulesCombination',
  rules: 'rules',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InAppMessageScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  segmentId: 'segmentId',
  title: 'title',
  body: 'body',
  linkUrl: 'linkUrl',
  displayPlace: 'displayPlace',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InAppMessageReadScalarFieldEnum = {
  id: 'id',
  messageId: 'messageId',
  userId: 'userId',
  readAt: 'readAt'
};

exports.Prisma.MarketingWorkflowScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  segmentId: 'segmentId',
  name: 'name',
  triggerType: 'triggerType',
  triggerConfig: 'triggerConfig',
  actionType: 'actionType',
  actionConfig: 'actionConfig',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowExecutionLogScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  executedAt: 'executedAt',
  status: 'status',
  message: 'message',
  details: 'details'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.SubsidyType = exports.$Enums.SubsidyType = {
  NONE: 'NONE',
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
};

exports.UserRole = exports.$Enums.UserRole = {
  CUSTOMER: 'CUSTOMER',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

exports.WalletTransactionType = exports.$Enums.WalletTransactionType = {
  TOP_UP: 'TOP_UP',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
  CANCELLED: 'CANCELLED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.CouponType = exports.$Enums.CouponType = {
  DISCOUNT_PERCENTAGE: 'DISCOUNT_PERCENTAGE',
  DISCOUNT_FIXED: 'DISCOUNT_FIXED',
  FREE_ITEM: 'FREE_ITEM'
};

exports.MetadataType = exports.$Enums.MetadataType = {
  DIET_CATEGORY: 'DIET_CATEGORY',
  ALLERGEN: 'ALLERGEN',
  DISH_CATEGORY: 'DISH_CATEGORY'
};

exports.Prisma.ModelName = {
  Organization: 'Organization',
  Company: 'Company',
  CompanyEmployee: 'CompanyEmployee',
  Location: 'Location',
  User: 'User',
  Wallet: 'Wallet',
  WalletTransaction: 'WalletTransaction',
  UserLocation: 'UserLocation',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Menu: 'Menu',
  PromotionBanner: 'PromotionBanner',
  MenuPromotionBanner: 'MenuPromotionBanner',
  MenuItem: 'MenuItem',
  Dish: 'Dish',
  Order: 'Order',
  Coupon: 'Coupon',
  CouponRedemption: 'CouponRedemption',
  OrderItem: 'OrderItem',
  Metadata: 'Metadata',
  CustomerSegment: 'CustomerSegment',
  InAppMessage: 'InAppMessage',
  InAppMessageRead: 'InAppMessageRead',
  MarketingWorkflow: 'MarketingWorkflow',
  WorkflowExecutionLog: 'WorkflowExecutionLog'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\Administrator\\Desktop\\cursor_test\\src\\generated\\prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "C:\\Users\\Administrator\\Desktop\\cursor_test\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../src/generated/prisma\"\n  previewFeatures = [\"driverAdapters\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n// Multi-Tenant: Organisationen/Locations (White-Label Support)\nmodel Organization {\n  id             String   @id @default(cuid())\n  name           String\n  slug           String   @unique // Für White-Label URLs: kantine-platform.com/organization-slug\n  logoUrl        String?\n  primaryColor   String?  @default(\"#3b82f6\")\n  secondaryColor String?  @default(\"#1e40af\")\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  locations     Location[]\n  users         User[]\n  segments      CustomerSegment[]\n  inAppMessages InAppMessage[]\n  workflows     MarketingWorkflow[]\n\n  @@map(\"organizations\")\n}\n\n// Arbeitgeber-Unternehmen, die Verträge mit der Kantine haben\nmodel Company {\n  id             String  @id @default(cuid())\n  name           String\n  contractNumber String? // Interne Vertragsnummer\n  isActive       Boolean @default(true)\n\n  // Zuschuss-Konfiguration\n  subsidyType      SubsidyType @default(NONE)\n  subsidyValue     Decimal?    @db.Decimal(10, 2) // Prozent- oder Fixbetrag, abhängig von subsidyType\n  subsidyMaxPerDay Decimal?    @db.Decimal(10, 2) // Optional: Max. Zuschuss pro Tag pro Mitarbeiter\n\n  validFrom  DateTime? // Optional: Vertragsbeginn\n  validUntil DateTime? // Optional: Vertragsende\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  employees CompanyEmployee[]\n  orders    Order[]\n\n  @@map(\"companies\")\n}\n\n// Zuordnung: Company -> Employee (User ist Mitarbeiter eines Unternehmens)\nmodel CompanyEmployee {\n  id             String    @id @default(cuid())\n  companyId      String\n  userId         String\n  employeeNumber String? // Optionale Personalnummer\n  department     String? // Optionale Abteilung\n  isActive       Boolean   @default(true)\n  validFrom      DateTime? // Optional: Beginn der Zuordnung\n  validUntil     DateTime? // Optional: Ende der Zuordnung\n  createdAt      DateTime  @default(now())\n\n  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)\n  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([companyId, userId])\n  @@index([userId])\n  @@map(\"company_employees\")\n}\n\n// Zuschuss-Typen für Arbeitgeber\nenum SubsidyType {\n  NONE\n  PERCENTAGE\n  FIXED\n}\n\n// Standorte (Multi-Location Support)\nmodel Location {\n  id             String   @id @default(cuid())\n  organizationId String\n  name           String\n  address        String?\n  phone          String?\n  email          String?\n  openingHours   Json? // { monday: \"11:00-14:00\", ... }\n  workingDays    Int[]    @default([1, 2, 3, 4, 5]) // 0=Sonntag, 1=Montag, ..., 6=Samstag\n  isActive       Boolean  @default(true)\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  organization Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  menus        Menu[]\n  orders       Order[]\n  users        UserLocation[]\n  coupons      Coupon[]\n\n  @@map(\"locations\")\n}\n\n// Benutzer (Kunden, Küchenpersonal, Admins)\nmodel User {\n  id                    String   @id @default(cuid())\n  email                 String   @unique\n  name                  String?\n  passwordHash          String? // Für Credentials Provider\n  role                  UserRole @default(CUSTOMER)\n  image                 String?\n  organizationId        String?\n  marketingEmailConsent Boolean  @default(false)\n  createdAt             DateTime @default(now())\n  updatedAt             DateTime @updatedAt\n\n  organization           Organization?       @relation(fields: [organizationId], references: [id])\n  locations              UserLocation[]\n  companyEmployees       CompanyEmployee[]\n  orders                 Order[]\n  sessions               Session[]\n  accounts               Account[]\n  couponRedemptions      CouponRedemption[]\n  wallet                 Wallet?\n  walletTransactions     WalletTransaction[]\n  performedWalletActions WalletTransaction[] @relation(\"WalletAudit\")\n\n  @@map(\"users\")\n}\n\n// Guthaben-System (Wallet)\nmodel Wallet {\n  id        String   @id @default(cuid())\n  userId    String   @unique\n  balance   Decimal  @default(0) @db.Decimal(10, 2) // Nie negativ (app-seitig + CHECK)\n  updatedAt DateTime @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map(\"wallets\")\n}\n\nenum WalletTransactionType {\n  TOP_UP // Aufladung\n  ORDER_PAYMENT // Bestellzahlung\n  REFUND // Erstattung (Stornierung)\n  ADJUSTMENT // Admin-Anpassung\n}\n\nmodel WalletTransaction {\n  id            String                @id @default(cuid())\n  userId        String\n  type          WalletTransactionType\n  amount        Decimal               @db.Decimal(10, 2) // + Gutschrift, - Abbuchung\n  balanceBefore Decimal               @db.Decimal(10, 2)\n  balanceAfter  Decimal               @db.Decimal(10, 2)\n  description   String?               @db.Text\n  orderId       String?\n  performedById String? // Admin bei TOP_UP/ADJUSTMENT\n  createdAt     DateTime              @default(now())\n\n  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  order       Order? @relation(fields: [orderId], references: [id], onDelete: SetNull)\n  performedBy User?  @relation(\"WalletAudit\", fields: [performedById], references: [id], onDelete: SetNull)\n\n  @@index([userId])\n  @@index([orderId])\n  @@index([createdAt])\n  @@map(\"wallet_transactions\")\n}\n\nenum UserRole {\n  CUSTOMER // Kunde\n  KITCHEN_STAFF // Küchenpersonal\n  ADMIN // Organisation Admin\n  SUPER_ADMIN // Platform Admin\n}\n\n// Many-to-Many: User <-> Location (für Multi-Location Zugriff)\nmodel UserLocation {\n  id         String   @id @default(cuid())\n  userId     String\n  locationId String\n  createdAt  DateTime @default(now())\n\n  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, locationId])\n  @@map(\"user_locations\")\n}\n\n// NextAuth.js Models\nmodel Account {\n  id                String  @id @default(cuid())\n  userId            String\n  type              String\n  provider          String\n  providerAccountId String\n  refresh_token     String? @db.Text\n  access_token      String? @db.Text\n  expires_at        Int?\n  token_type        String?\n  scope             String?\n  id_token          String? @db.Text\n  session_state     String?\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerAccountId])\n  @@map(\"accounts\")\n}\n\nmodel Session {\n  id           String   @id @default(cuid())\n  sessionToken String   @unique\n  userId       String\n  expires      DateTime\n  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map(\"sessions\")\n}\n\nmodel VerificationToken {\n  identifier String\n  token      String   @unique\n  expires    DateTime\n\n  @@unique([identifier, token])\n  @@map(\"verification_tokens\")\n}\n\n// Wöchentliche Essenspläne\nmodel Menu {\n  id          String   @id @default(cuid())\n  locationId  String\n  weekNumber  Int // Kalenderwoche\n  year        Int\n  startDate   DateTime // Startdatum der Woche (Montag)\n  endDate     DateTime // Enddatum der Woche (Sonntag)\n  isPublished Boolean  @default(false)\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  location         Location              @relation(fields: [locationId], references: [id], onDelete: Cascade)\n  menuItems        MenuItem[]\n  promotionBanners MenuPromotionBanner[]\n\n  @@unique([locationId, weekNumber, year])\n  @@map(\"menus\")\n}\n\n// Wiederverwendbare Motto-/Promotion-Banner (z. B. \"Bayerische Woche\", \"Italian Week\")\nmodel PromotionBanner {\n  id        String   @id @default(cuid())\n  title     String   @db.VarChar(200)\n  subtitle  String?  @db.VarChar(500)\n  imageUrl  String?  @db.Text\n  isActive  Boolean  @default(true)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  menuAssignments MenuPromotionBanner[]\n\n  @@map(\"promotion_banners\")\n}\n\n// Zuordnung: Menu (KW) <-> PromotionBanner, mit Reihenfolge für Karussell\nmodel MenuPromotionBanner {\n  id                String @id @default(cuid())\n  menuId            String\n  promotionBannerId String\n  sortOrder         Int    @default(0) // Reihenfolge im Karussell\n\n  menu            Menu            @relation(fields: [menuId], references: [id], onDelete: Cascade)\n  promotionBanner PromotionBanner @relation(fields: [promotionBannerId], references: [id], onDelete: Cascade)\n\n  @@unique([menuId, promotionBannerId])\n  @@index([menuId])\n  @@map(\"menu_promotion_banners\")\n}\n\n// Gerichte auf einem Menü-Tag\nmodel MenuItem {\n  id             String   @id @default(cuid())\n  menuId         String\n  dishId         String\n  date           DateTime // Für welchen Tag (Montag-Sonntag)\n  available      Boolean  @default(true)\n  price          Decimal  @db.Decimal(10, 2)\n  maxOrders      Int? // Max. Bestellungen (z.B. 50 Portionen)\n  currentOrders  Int      @default(0) // Aktuelle Bestellungen\n  // Promotion/Aktion (situative Bewerbung pro Tag)\n  isPromotion    Boolean  @default(false)\n  promotionPrice Decimal? @db.Decimal(10, 2) // Optionaler Sonderpreis\n  promotionLabel String?  @db.VarChar(200) // z.B. \"gratis Nachtisch dazu\"\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  menu       Menu        @relation(fields: [menuId], references: [id], onDelete: Cascade)\n  dish       Dish        @relation(fields: [dishId], references: [id])\n  orderItems OrderItem[]\n\n  @@map(\"menu_items\")\n}\n\n// Gerichte (Master-Daten)\nmodel Dish {\n  id          String   @id @default(cuid())\n  name        String\n  description String?  @db.Text\n  imageUrl    String?\n  category    String? // \"Hauptgericht\", \"Dessert\", \"Salat\", etc.\n  // Nährwerte (für Phase 2 vorbereitet)\n  calories    Int?\n  protein     Decimal? @db.Decimal(5, 2)\n  carbs       Decimal? @db.Decimal(5, 2)\n  fat         Decimal? @db.Decimal(5, 2)\n  // Allergene & Diäten (für Phase 2 vorbereitet)\n  allergens   String[] // [\"Nüsse\", \"Gluten\", \"Laktose\"]\n  dietTags    String[] // [\"vegetarisch\", \"vegan\", \"low-carb\"]\n  isActive    Boolean  @default(true)\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  menuItems MenuItem[]\n  coupons   Coupon[] // Für FREE_ITEM Coupons\n\n  @@map(\"dishes\")\n}\n\n// Bestellungen\nmodel Order {\n  id              String        @id @default(cuid())\n  userId          String\n  locationId      String\n  status          OrderStatus   @default(PENDING)\n  totalAmount     Decimal       @db.Decimal(10, 2)\n  paymentStatus   PaymentStatus @default(PENDING)\n  paymentMethod   String? // \"card\", \"paypal\", \"payroll\", etc.\n  paymentIntentId String? // Für Stripe/PayPal\n  pickupCode      String        @unique // QR-Code zur Abholung\n  pickupDate      DateTime // Für welchen Tag\n  pickupTimeSlot  String? // \"12:00-12:15\", \"12:15-12:30\", etc.\n  notes           String?       @db.Text\n  createdAt       DateTime      @default(now())\n  updatedAt       DateTime      @updatedAt\n  pickedUpAt      DateTime?\n\n  user                  User               @relation(fields: [userId], references: [id])\n  location              Location           @relation(fields: [locationId], references: [id])\n  items                 OrderItem[]\n  couponRedemptions     CouponRedemption[]\n  couponCode            String? // Optional: Eingelöster Coupon-Code (für Referenz)\n  discountAmount        Decimal?           @db.Decimal(10, 2) // Optional: Angewendeter Rabatt\n  finalAmount           Decimal?           @db.Decimal(10, 2) // Optional: Endbetrag nach Coupon/Zuschuss (falls vorhanden)\n  employerSubsidyAmount Decimal?           @db.Decimal(10, 2) // Optional: Arbeitgeber-Zuschuss (Company)\n  employerCompanyId     String? // Referenz auf Company, falls Zuschuss angewendet wurde\n\n  employerCompany    Company?            @relation(fields: [employerCompanyId], references: [id])\n  walletTransactions WalletTransaction[]\n\n  @@index([userId])\n  @@index([locationId])\n  @@index([pickupCode])\n  @@index([pickupDate])\n  @@map(\"orders\")\n}\n\nenum OrderStatus {\n  PENDING // Bestellt, nicht zubereitet\n  CONFIRMED // Bestätigt von Küche\n  PREPARING // In Zubereitung\n  READY // Fertig zur Abholung\n  PICKED_UP // Abgeholt\n  CANCELLED // Storniert\n}\n\nenum PaymentStatus {\n  PENDING // Zahlung ausstehend\n  PROCESSING // In Bearbeitung\n  COMPLETED // Bezahlt\n  FAILED // Fehlgeschlagen\n  REFUNDED // Rückerstattet\n}\n\n// Coupon-Typen\nenum CouponType {\n  DISCOUNT_PERCENTAGE // Rabatt in Prozent (z.B. 10% Rabatt)\n  DISCOUNT_FIXED // Fixer Rabatt (z.B. 5€ Rabatt)\n  FREE_ITEM // Kostenloses Extra (z.B. kostenloser Nachtisch)\n}\n\n// Coupons/Gutscheine\nmodel Coupon {\n  id             String     @id @default(cuid())\n  code           String     @unique // Coupon-Code (z.B. \"SUMMER2024\")\n  name           String // Name der Aktion\n  description    String?    @db.Text // Beschreibung der Aktion\n  type           CouponType // Typ des Coupons\n  discountValue  Decimal?   @db.Decimal(10, 2) // Rabattwert (Prozent oder fixer Betrag)\n  freeItemDishId String? // Für FREE_ITEM: ID des kostenlosen Gerichts\n  locationId     String? // Optional: Nur für bestimmte Location\n  startDate      DateTime? // Optional: Startdatum\n  endDate        DateTime? // Optional: Enddatum\n  maxUses        Int? // Optional: Maximale Gesamt-Nutzungen (z.B. 100x)\n  maxUsesPerUser Int        @default(1) // Maximale Nutzungen pro User (1 = einmalig, null = unbegrenzt)\n  currentUses    Int        @default(0) // Aktuelle Anzahl der Nutzungen\n  minOrderAmount Decimal?   @db.Decimal(10, 2) // Optional: Mindestbestellwert\n  isActive       Boolean    @default(true) // Aktiv/Inaktiv\n  createdAt      DateTime   @default(now())\n  updatedAt      DateTime   @updatedAt\n\n  location     Location?          @relation(fields: [locationId], references: [id], onDelete: Cascade)\n  freeItemDish Dish?              @relation(fields: [freeItemDishId], references: [id])\n  redemptions  CouponRedemption[]\n\n  @@index([code, isActive])\n  @@index([locationId])\n  @@map(\"coupons\")\n}\n\n// Coupon-Einlösungen (Tracking)\nmodel CouponRedemption {\n  id         String   @id @default(cuid())\n  couponId   String\n  userId     String\n  orderId    String\n  redeemedAt DateTime @default(now())\n\n  coupon Coupon @relation(fields: [couponId], references: [id], onDelete: Cascade)\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  order  Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  @@unique([couponId, userId, orderId]) // Verhindert doppelte Einlösung\n  @@index([couponId])\n  @@index([userId])\n  @@index([orderId])\n  @@map(\"coupon_redemptions\")\n}\n\n// Metadaten-Typen\nenum MetadataType {\n  DIET_CATEGORY // Diät-Kategorien (vegan, vegetarisch, etc.)\n  ALLERGEN // Allergene (Nüsse, Gluten, etc.)\n  DISH_CATEGORY // Speise-Kategorien (Hauptgericht, Dessert, etc.)\n}\n\n// Bestellte Gerichte\nmodel OrderItem {\n  id         String   @id @default(cuid())\n  orderId    String\n  menuItemId String\n  quantity   Int      @default(1)\n  price      Decimal  @db.Decimal(10, 2) // Preis zum Zeitpunkt der Bestellung\n  createdAt  DateTime @default(now())\n\n  order    Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  menuItem MenuItem @relation(fields: [menuItemId], references: [id])\n\n  @@map(\"order_items\")\n}\n\n// Metadaten-Verwaltung (Diät-Kategorien, Allergene, Speise-Kategorien)\nmodel Metadata {\n  id          String       @id @default(cuid())\n  type        MetadataType // Typ der Metadaten\n  name        String // Name des Wertes (z.B. \"vegan\", \"Gluten\")\n  description String? // Optionale Beschreibung\n  icon        String? // Optional: Icon-Name oder Emoji\n  color       String? // Optional: Farbe für UI (z.B. \"#22c55e\" für grün)\n  isActive    Boolean      @default(true) // Soft-Delete\n  sortOrder   Int          @default(0) // Sortierreihenfolge\n  createdAt   DateTime     @default(now())\n  updatedAt   DateTime     @updatedAt\n\n  @@unique([type, name]) // Verhindert Duplikate pro Typ\n  @@index([type, isActive])\n  @@map(\"metadata\")\n}\n\n// PROJ-4: Kundensegmente & Marketing-Automation\n// Segment: Zielgruppe pro Organisation, definiert durch Regeln (JSON)\nmodel CustomerSegment {\n  id               String   @id @default(cuid())\n  organizationId   String\n  name             String\n  description      String?  @db.Text\n  rulesCombination String   @default(\"AND\") // AND | OR\n  rules            Json     @default(\"[]\") // [{ attribute, operator, value }, ...]\n  createdAt        DateTime @default(now())\n  updatedAt        DateTime @updatedAt\n\n  organization  Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  inAppMessages InAppMessage[]\n  workflows     MarketingWorkflow[]\n\n  @@unique([organizationId, name])\n  @@index([organizationId])\n  @@map(\"customer_segments\")\n}\n\n// In-App-Nachricht: segmentbezogen, Zeitraum, Anzeigeort\nmodel InAppMessage {\n  id             String    @id @default(cuid())\n  organizationId String\n  segmentId      String\n  title          String?   @db.VarChar(200)\n  body           String    @db.Text\n  linkUrl        String?   @db.Text\n  displayPlace   String    @default(\"menu\") @db.VarChar(50) // menu | wallet | dashboard\n  startDate      DateTime  @default(now())\n  endDate        DateTime?\n  isActive       Boolean   @default(true)\n  createdAt      DateTime  @default(now())\n  updatedAt      DateTime  @updatedAt\n\n  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  segment      CustomerSegment    @relation(fields: [segmentId], references: [id], onDelete: Cascade)\n  readBy       InAppMessageRead[]\n\n  @@index([organizationId])\n  @@index([segmentId])\n  @@index([isActive, startDate, endDate])\n  @@map(\"in_app_messages\")\n}\n\n// Welcher User welche In-App-Nachricht gelesen hat (optional)\nmodel InAppMessageRead {\n  id        String   @id @default(cuid())\n  messageId String\n  userId    String\n  readAt    DateTime @default(now())\n\n  message InAppMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)\n\n  @@unique([messageId, userId])\n  @@index([userId])\n  @@map(\"in_app_message_reads\")\n}\n\n// Workflow: Trigger + Aktion, segmentbezogen\nmodel MarketingWorkflow {\n  id             String   @id @default(cuid())\n  organizationId String\n  segmentId      String\n  name           String   @db.VarChar(200)\n  triggerType    String   @db.VarChar(50) // SCHEDULED | EVENT\n  triggerConfig  Json     @default(\"{}\") // { cron, weekday, hour } or { eventType }\n  actionType     String   @db.VarChar(50) // SEND_EMAIL | SHOW_IN_APP | GRANT_INCENTIVE\n  actionConfig   Json     @default(\"{}\") // { subject, body } | { messageId } | { couponId }\n  isActive       Boolean  @default(true)\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  organization  Organization           @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  segment       CustomerSegment        @relation(fields: [segmentId], references: [id], onDelete: Cascade)\n  executionLogs WorkflowExecutionLog[]\n\n  @@index([organizationId])\n  @@index([segmentId])\n  @@index([isActive])\n  @@map(\"marketing_workflows\")\n}\n\n// Protokoll der Workflow-Ausführungen\nmodel WorkflowExecutionLog {\n  id         String   @id @default(cuid())\n  workflowId String\n  executedAt DateTime @default(now())\n  status     String   @db.VarChar(20) // SUCCESS | PARTIAL | FAILED\n  message    String?  @db.Text // Kurzergebnis (z. B. \"45 E-Mails versendet\")\n  details    Json? // Optionale Fehlerdetails\n\n  workflow MarketingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)\n\n  @@index([workflowId])\n  @@index([executedAt])\n  @@map(\"workflow_execution_logs\")\n}\n",
  "inlineSchemaHash": "f35aedb12e5a9a3ded57e99cabece0d8992ac50e687ac364d0fc99de5b6d696a",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"Organization\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"slug\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logoUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"primaryColor\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"secondaryColor\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"locations\",\"kind\":\"object\",\"type\":\"Location\",\"relationName\":\"LocationToOrganization\"},{\"name\":\"users\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"OrganizationToUser\"},{\"name\":\"segments\",\"kind\":\"object\",\"type\":\"CustomerSegment\",\"relationName\":\"CustomerSegmentToOrganization\"},{\"name\":\"inAppMessages\",\"kind\":\"object\",\"type\":\"InAppMessage\",\"relationName\":\"InAppMessageToOrganization\"},{\"name\":\"workflows\",\"kind\":\"object\",\"type\":\"MarketingWorkflow\",\"relationName\":\"MarketingWorkflowToOrganization\"}],\"dbName\":\"organizations\"},\"Company\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"contractNumber\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"subsidyType\",\"kind\":\"enum\",\"type\":\"SubsidyType\"},{\"name\":\"subsidyValue\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"subsidyMaxPerDay\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"validFrom\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"validUntil\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"employees\",\"kind\":\"object\",\"type\":\"CompanyEmployee\",\"relationName\":\"CompanyToCompanyEmployee\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"CompanyToOrder\"}],\"dbName\":\"companies\"},\"CompanyEmployee\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"companyId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"employeeNumber\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"department\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"validFrom\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"validUntil\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"company\",\"kind\":\"object\",\"type\":\"Company\",\"relationName\":\"CompanyToCompanyEmployee\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CompanyEmployeeToUser\"}],\"dbName\":\"company_employees\"},\"Location\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"address\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"openingHours\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"workingDays\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"LocationToOrganization\"},{\"name\":\"menus\",\"kind\":\"object\",\"type\":\"Menu\",\"relationName\":\"LocationToMenu\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"LocationToOrder\"},{\"name\":\"users\",\"kind\":\"object\",\"type\":\"UserLocation\",\"relationName\":\"LocationToUserLocation\"},{\"name\":\"coupons\",\"kind\":\"object\",\"type\":\"Coupon\",\"relationName\":\"CouponToLocation\"}],\"dbName\":\"locations\"},\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"passwordHash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"UserRole\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"marketingEmailConsent\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"OrganizationToUser\"},{\"name\":\"locations\",\"kind\":\"object\",\"type\":\"UserLocation\",\"relationName\":\"UserToUserLocation\"},{\"name\":\"companyEmployees\",\"kind\":\"object\",\"type\":\"CompanyEmployee\",\"relationName\":\"CompanyEmployeeToUser\"},{\"name\":\"orders\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"couponRedemptions\",\"kind\":\"object\",\"type\":\"CouponRedemption\",\"relationName\":\"CouponRedemptionToUser\"},{\"name\":\"wallet\",\"kind\":\"object\",\"type\":\"Wallet\",\"relationName\":\"UserToWallet\"},{\"name\":\"walletTransactions\",\"kind\":\"object\",\"type\":\"WalletTransaction\",\"relationName\":\"UserToWalletTransaction\"},{\"name\":\"performedWalletActions\",\"kind\":\"object\",\"type\":\"WalletTransaction\",\"relationName\":\"WalletAudit\"}],\"dbName\":\"users\"},\"Wallet\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"balance\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToWallet\"}],\"dbName\":\"wallets\"},\"WalletTransaction\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"WalletTransactionType\"},{\"name\":\"amount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"balanceBefore\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"balanceAfter\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"performedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToWalletTransaction\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToWalletTransaction\"},{\"name\":\"performedBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"WalletAudit\"}],\"dbName\":\"wallet_transactions\"},\"UserLocation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserLocation\"},{\"name\":\"location\",\"kind\":\"object\",\"type\":\"Location\",\"relationName\":\"LocationToUserLocation\"}],\"dbName\":\"user_locations\"},\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session_state\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":\"accounts\"},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"}],\"dbName\":\"sessions\"},\"VerificationToken\":{\"fields\":[{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"verification_tokens\"},\"Menu\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"weekNumber\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"year\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"startDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"isPublished\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"location\",\"kind\":\"object\",\"type\":\"Location\",\"relationName\":\"LocationToMenu\"},{\"name\":\"menuItems\",\"kind\":\"object\",\"type\":\"MenuItem\",\"relationName\":\"MenuToMenuItem\"},{\"name\":\"promotionBanners\",\"kind\":\"object\",\"type\":\"MenuPromotionBanner\",\"relationName\":\"MenuToMenuPromotionBanner\"}],\"dbName\":\"menus\"},\"PromotionBanner\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"subtitle\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"menuAssignments\",\"kind\":\"object\",\"type\":\"MenuPromotionBanner\",\"relationName\":\"MenuPromotionBannerToPromotionBanner\"}],\"dbName\":\"promotion_banners\"},\"MenuPromotionBanner\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"menuId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"promotionBannerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sortOrder\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"menu\",\"kind\":\"object\",\"type\":\"Menu\",\"relationName\":\"MenuToMenuPromotionBanner\"},{\"name\":\"promotionBanner\",\"kind\":\"object\",\"type\":\"PromotionBanner\",\"relationName\":\"MenuPromotionBannerToPromotionBanner\"}],\"dbName\":\"menu_promotion_banners\"},\"MenuItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"menuId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"dishId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"date\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"available\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"maxOrders\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"currentOrders\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isPromotion\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"promotionPrice\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"promotionLabel\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"menu\",\"kind\":\"object\",\"type\":\"Menu\",\"relationName\":\"MenuToMenuItem\"},{\"name\":\"dish\",\"kind\":\"object\",\"type\":\"Dish\",\"relationName\":\"DishToMenuItem\"},{\"name\":\"orderItems\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"MenuItemToOrderItem\"}],\"dbName\":\"menu_items\"},\"Dish\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"imageUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"calories\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"protein\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"carbs\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"fat\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"allergens\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"dietTags\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"menuItems\",\"kind\":\"object\",\"type\":\"MenuItem\",\"relationName\":\"DishToMenuItem\"},{\"name\":\"coupons\",\"kind\":\"object\",\"type\":\"Coupon\",\"relationName\":\"CouponToDish\"}],\"dbName\":\"dishes\"},\"Order\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"OrderStatus\"},{\"name\":\"totalAmount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"paymentStatus\",\"kind\":\"enum\",\"type\":\"PaymentStatus\"},{\"name\":\"paymentMethod\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"paymentIntentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"pickupCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"pickupDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"pickupTimeSlot\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"pickedUpAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"OrderToUser\"},{\"name\":\"location\",\"kind\":\"object\",\"type\":\"Location\",\"relationName\":\"LocationToOrder\"},{\"name\":\"items\",\"kind\":\"object\",\"type\":\"OrderItem\",\"relationName\":\"OrderToOrderItem\"},{\"name\":\"couponRedemptions\",\"kind\":\"object\",\"type\":\"CouponRedemption\",\"relationName\":\"CouponRedemptionToOrder\"},{\"name\":\"couponCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"discountAmount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"finalAmount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"employerSubsidyAmount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"employerCompanyId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"employerCompany\",\"kind\":\"object\",\"type\":\"Company\",\"relationName\":\"CompanyToOrder\"},{\"name\":\"walletTransactions\",\"kind\":\"object\",\"type\":\"WalletTransaction\",\"relationName\":\"OrderToWalletTransaction\"}],\"dbName\":\"orders\"},\"Coupon\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"code\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"CouponType\"},{\"name\":\"discountValue\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"freeItemDishId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"startDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"maxUses\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"maxUsesPerUser\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"currentUses\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"minOrderAmount\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"location\",\"kind\":\"object\",\"type\":\"Location\",\"relationName\":\"CouponToLocation\"},{\"name\":\"freeItemDish\",\"kind\":\"object\",\"type\":\"Dish\",\"relationName\":\"CouponToDish\"},{\"name\":\"redemptions\",\"kind\":\"object\",\"type\":\"CouponRedemption\",\"relationName\":\"CouponToCouponRedemption\"}],\"dbName\":\"coupons\"},\"CouponRedemption\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"couponId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"redeemedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"coupon\",\"kind\":\"object\",\"type\":\"Coupon\",\"relationName\":\"CouponToCouponRedemption\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CouponRedemptionToUser\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"CouponRedemptionToOrder\"}],\"dbName\":\"coupon_redemptions\"},\"OrderItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"menuItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"order\",\"kind\":\"object\",\"type\":\"Order\",\"relationName\":\"OrderToOrderItem\"},{\"name\":\"menuItem\",\"kind\":\"object\",\"type\":\"MenuItem\",\"relationName\":\"MenuItemToOrderItem\"}],\"dbName\":\"order_items\"},\"Metadata\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"MetadataType\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"icon\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"color\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"sortOrder\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"metadata\"},\"CustomerSegment\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"rulesCombination\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"rules\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"CustomerSegmentToOrganization\"},{\"name\":\"inAppMessages\",\"kind\":\"object\",\"type\":\"InAppMessage\",\"relationName\":\"CustomerSegmentToInAppMessage\"},{\"name\":\"workflows\",\"kind\":\"object\",\"type\":\"MarketingWorkflow\",\"relationName\":\"CustomerSegmentToMarketingWorkflow\"}],\"dbName\":\"customer_segments\"},\"InAppMessage\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"segmentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"body\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"linkUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"displayPlace\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"startDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"InAppMessageToOrganization\"},{\"name\":\"segment\",\"kind\":\"object\",\"type\":\"CustomerSegment\",\"relationName\":\"CustomerSegmentToInAppMessage\"},{\"name\":\"readBy\",\"kind\":\"object\",\"type\":\"InAppMessageRead\",\"relationName\":\"InAppMessageToInAppMessageRead\"}],\"dbName\":\"in_app_messages\"},\"InAppMessageRead\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"messageId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"readAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"message\",\"kind\":\"object\",\"type\":\"InAppMessage\",\"relationName\":\"InAppMessageToInAppMessageRead\"}],\"dbName\":\"in_app_message_reads\"},\"MarketingWorkflow\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"segmentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"triggerType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"triggerConfig\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"actionType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"actionConfig\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"MarketingWorkflowToOrganization\"},{\"name\":\"segment\",\"kind\":\"object\",\"type\":\"CustomerSegment\",\"relationName\":\"CustomerSegmentToMarketingWorkflow\"},{\"name\":\"executionLogs\",\"kind\":\"object\",\"type\":\"WorkflowExecutionLog\",\"relationName\":\"MarketingWorkflowToWorkflowExecutionLog\"}],\"dbName\":\"marketing_workflows\"},\"WorkflowExecutionLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"workflowId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"executedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"details\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"workflow\",\"kind\":\"object\",\"type\":\"MarketingWorkflow\",\"relationName\":\"MarketingWorkflowToWorkflowExecutionLog\"}],\"dbName\":\"workflow_execution_logs\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

