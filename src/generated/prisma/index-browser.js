
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


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

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

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
  sepaCreditorId: 'sepaCreditorId',
  sepaIban: 'sepaIban',
  sepaBic: 'sepaBic',
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
  sepaIban: 'sepaIban',
  sepaBic: 'sepaBic',
  sepaMandateReference: 'sepaMandateReference',
  sepaMandateDate: 'sepaMandateDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyInvoiceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  year: 'year',
  month: 'month',
  status: 'status',
  totalAmount: 'totalAmount',
  invoicedAt: 'invoicedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SepaSubmissionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  organizationId: 'organizationId',
  generatedAt: 'generatedAt',
  totalAmount: 'totalAmount',
  dueDate: 'dueDate',
  seqType: 'seqType',
  createdById: 'createdById',
  source: 'source'
};

exports.Prisma.SepaSubmissionInvoiceScalarFieldEnum = {
  id: 'id',
  sepaSubmissionId: 'sepaSubmissionId',
  companyInvoiceId: 'companyInvoiceId'
};

exports.Prisma.CompanyInvoiceItemScalarFieldEnum = {
  id: 'id',
  companyInvoiceId: 'companyInvoiceId',
  orderId: 'orderId',
  orderNumber: 'orderNumber',
  orderDate: 'orderDate',
  employeeName: 'employeeName',
  amount: 'amount'
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
  updatedAt: 'updatedAt',
  customerId: 'customerId',
  isAnonymous: 'isAnonymous',
  mergedIntoId: 'mergedIntoId'
};

exports.Prisma.CustomerPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  key: 'key',
  value: 'value',
  source: 'source',
  confidence: 'confidence',
  ignored: 'ignored',
  updatedAt: 'updatedAt',
  updatedById: 'updatedById'
};

exports.Prisma.PreferenceAuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  key: 'key',
  value: 'value',
  confidence: 'confidence',
  changedById: 'changedById',
  changedByName: 'changedByName',
  changedAt: 'changedAt'
};

exports.Prisma.CustomerMetricsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  activityStatus: 'activityStatus',
  daysSinceLastOrder: 'daysSinceLastOrder',
  daysSinceRegistration: 'daysSinceRegistration',
  preferredDayOfWeek: 'preferredDayOfWeek',
  preferredTimeSlot: 'preferredTimeSlot',
  ltv: 'ltv',
  avgOrderValue: 'avgOrderValue',
  orderFrequencyPerWeek: 'orderFrequencyPerWeek',
  spend30d: 'spend30d',
  totalOrders: 'totalOrders',
  firstOrderAt: 'firstOrderAt',
  lastOrderAt: 'lastOrderAt',
  customerTier: 'customerTier',
  rfmR: 'rfmR',
  rfmF: 'rfmF',
  rfmM: 'rfmM',
  rfmSegment: 'rfmSegment',
  frequencyTrend: 'frequencyTrend',
  spendTrend: 'spendTrend',
  orders30d: 'orders30d',
  orders30dPrev: 'orders30dPrev',
  spend30dPrev: 'spend30dPrev',
  churnRiskScore: 'churnRiskScore',
  winBackScore: 'winBackScore',
  upsellScore: 'upsellScore',
  orderConsistencyScore: 'orderConsistencyScore',
  orderDiversityScore: 'orderDiversityScore',
  lunchRegularityPct: 'lunchRegularityPct',
  avgLeadTimeHours: 'avgLeadTimeHours',
  couponUsageRate: 'couponUsageRate',
  walletUsageRate: 'walletUsageRate',
  primaryChannel: 'primaryChannel',
  channelLoyaltyPct: 'channelLoyaltyPct',
  calculatedAt: 'calculatedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerIdentifierScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  value: 'value',
  source: 'source',
  isActive: 'isActive',
  addedAt: 'addedAt',
  removedAt: 'removedAt'
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
  incentiveGrantId: 'incentiveGrantId',
  paymentProvider: 'paymentProvider',
  externalPaymentId: 'externalPaymentId',
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

exports.Prisma.EmailChangeTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  newEmail: 'newEmail',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
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
  couponId: 'couponId',
  isActive: 'isActive',
  marketingTemplateId: 'marketingTemplateId',
  templateSnapshot: 'templateSnapshot',
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
  channel: 'channel',
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
  productNameSnapshot: 'productNameSnapshot',
  productCategorySnapshot: 'productCategorySnapshot',
  unitPriceSnapshot: 'unitPriceSnapshot',
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
  displayType: 'displayType',
  slotId: 'slotId',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  marketingTemplateId: 'marketingTemplateId',
  templateSnapshot: 'templateSnapshot',
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

exports.Prisma.SegmentIncentiveScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  segmentId: 'segmentId',
  name: 'name',
  incentiveType: 'incentiveType',
  couponId: 'couponId',
  personaliseCoupon: 'personaliseCoupon',
  walletAmount: 'walletAmount',
  startDate: 'startDate',
  endDate: 'endDate',
  maxGrantsPerUser: 'maxGrantsPerUser',
  displayChannel: 'displayChannel',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingTemplateScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  type: 'type',
  content: 'content',
  status: 'status',
  isStarter: 'isStarter',
  isFavorite: 'isFavorite',
  thumbnailUrl: 'thumbnailUrl',
  subjectLine: 'subjectLine',
  preheaderText: 'preheaderText',
  senderName: 'senderName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketingTemplateVersionScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  content: 'content',
  savedBy: 'savedBy',
  createdAt: 'createdAt'
};

exports.Prisma.PushNotificationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  segmentId: 'segmentId',
  marketingTemplateId: 'marketingTemplateId',
  templateSnapshot: 'templateSnapshot',
  pushTitle: 'pushTitle',
  pushBody: 'pushBody',
  deepLink: 'deepLink',
  status: 'status',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  totalRecipients: 'totalRecipients',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PushNotificationLogScalarFieldEnum = {
  id: 'id',
  pushNotificationId: 'pushNotificationId',
  userId: 'userId',
  status: 'status',
  sentAt: 'sentAt'
};

exports.Prisma.PushSubscriptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  endpoint: 'endpoint',
  p256dhKey: 'p256dhKey',
  authKey: 'authKey',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentProviderConfigScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  provider: 'provider',
  isEnabled: 'isEnabled',
  configJson: 'configJson',
  updatedAt: 'updatedAt',
  updatedById: 'updatedById'
};

exports.Prisma.IncentiveGrantScalarFieldEnum = {
  id: 'id',
  segmentIncentiveId: 'segmentIncentiveId',
  userId: 'userId',
  grantedAt: 'grantedAt',
  couponCode: 'couponCode',
  couponId: 'couponId',
  walletTransactionId: 'walletTransactionId',
  redeemedAt: 'redeemedAt',
  redeemedOrderId: 'redeemedOrderId'
};

exports.Prisma.EmailCampaignScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  templateId: 'templateId',
  templateSnapshot: 'templateSnapshot',
  subjectLine: 'subjectLine',
  preheaderText: 'preheaderText',
  senderName: 'senderName',
  segmentId: 'segmentId',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  status: 'status',
  totalRecipients: 'totalRecipients',
  sentCount: 'sentCount',
  failedCount: 'failedCount',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailCampaignLogScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  userId: 'userId',
  email: 'email',
  trackingToken: 'trackingToken',
  status: 'status',
  sentAt: 'sentAt',
  openedAt: 'openedAt',
  clickedAt: 'clickedAt',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt'
};

exports.Prisma.JourneyScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  status: 'status',
  triggerType: 'triggerType',
  triggerConfig: 'triggerConfig',
  content: 'content',
  startDate: 'startDate',
  endDate: 'endDate',
  reEntryPolicy: 'reEntryPolicy',
  conversionGoal: 'conversionGoal',
  exitRules: 'exitRules',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JourneyParticipantScalarFieldEnum = {
  id: 'id',
  journeyId: 'journeyId',
  userId: 'userId',
  status: 'status',
  currentNodeId: 'currentNodeId',
  enteredAt: 'enteredAt',
  convertedAt: 'convertedAt',
  exitedAt: 'exitedAt',
  nextStepAt: 'nextStepAt',
  metadata: 'metadata'
};

exports.Prisma.JourneyLogScalarFieldEnum = {
  id: 'id',
  journeyId: 'journeyId',
  participantId: 'participantId',
  nodeId: 'nodeId',
  eventType: 'eventType',
  status: 'status',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.UserEventScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  description: 'description',
  metadata: 'metadata',
  actorId: 'actorId',
  createdAt: 'createdAt'
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

exports.PreferenceType = exports.$Enums.PreferenceType = {
  EXPLICIT: 'EXPLICIT',
  IMPLICIT: 'IMPLICIT'
};

exports.PreferenceSource = exports.$Enums.PreferenceSource = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM',
  DERIVED: 'DERIVED'
};

exports.PreferenceAction = exports.$Enums.PreferenceAction = {
  ADDED: 'ADDED',
  REMOVED: 'REMOVED',
  CONFIRMED: 'CONFIRMED'
};

exports.ActivityStatus = exports.$Enums.ActivityStatus = {
  NEU: 'NEU',
  AKTIV: 'AKTIV',
  GELEGENTLICH: 'GELEGENTLICH',
  SCHLAFEND: 'SCHLAFEND',
  ABGEWANDERT: 'ABGEWANDERT'
};

exports.CustomerTier = exports.$Enums.CustomerTier = {
  STANDARD: 'STANDARD',
  BRONZE: 'BRONZE',
  SILBER: 'SILBER',
  GOLD: 'GOLD',
  PLATIN: 'PLATIN'
};

exports.RfmSegment = exports.$Enums.RfmSegment = {
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  CHAMPION: 'CHAMPION',
  LOYAL: 'LOYAL',
  POTENTIAL: 'POTENTIAL',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  AT_RISK: 'AT_RISK',
  CANT_LOSE: 'CANT_LOSE',
  HIBERNATING: 'HIBERNATING'
};

exports.TrendDirection = exports.$Enums.TrendDirection = {
  WACHSEND: 'WACHSEND',
  STABIL: 'STABIL',
  RUECKLAEUFIG: 'RUECKLAEUFIG'
};

exports.CustomerIdentifierType = exports.$Enums.CustomerIdentifierType = {
  APP_ID: 'APP_ID',
  EMPLOYEE_ID: 'EMPLOYEE_ID',
  BADGE_ID: 'BADGE_ID',
  DEVICE_ID: 'DEVICE_ID',
  EXTERNAL_ID: 'EXTERNAL_ID'
};

exports.WalletTransactionType = exports.$Enums.WalletTransactionType = {
  TOP_UP: 'TOP_UP',
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
  INCENTIVE: 'INCENTIVE'
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

exports.OrderChannel = exports.$Enums.OrderChannel = {
  APP: 'APP',
  WEB: 'WEB',
  TERMINAL: 'TERMINAL',
  KASSE: 'KASSE',
  ADMIN: 'ADMIN'
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

exports.MarketingTemplateType = exports.$Enums.MarketingTemplateType = {
  EMAIL: 'EMAIL',
  IN_APP_BANNER: 'IN_APP_BANNER',
  PROMOTION_BANNER: 'PROMOTION_BANNER',
  PUSH: 'PUSH'
};

exports.MarketingTemplateStatus = exports.$Enums.MarketingTemplateStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
};

exports.PushNotificationStatus = exports.$Enums.PushNotificationStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

exports.PushDeliveryStatus = exports.$Enums.PushDeliveryStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED'
};

exports.EmailCampaignStatus = exports.$Enums.EmailCampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

exports.EmailDeliveryStatus = exports.$Enums.EmailDeliveryStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',
  BOUNCED: 'BOUNCED',
  FAILED: 'FAILED'
};

exports.JourneyStatus = exports.$Enums.JourneyStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED'
};

exports.JourneyTriggerType = exports.$Enums.JourneyTriggerType = {
  EVENT: 'EVENT',
  SEGMENT_ENTRY: 'SEGMENT_ENTRY',
  DATE_BASED: 'DATE_BASED'
};

exports.JourneyParticipantStatus = exports.$Enums.JourneyParticipantStatus = {
  ACTIVE: 'ACTIVE',
  CONVERTED: 'CONVERTED',
  EXITED: 'EXITED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PAUSED: 'PAUSED'
};

exports.Prisma.ModelName = {
  Organization: 'Organization',
  Company: 'Company',
  CompanyInvoice: 'CompanyInvoice',
  SepaSubmission: 'SepaSubmission',
  SepaSubmissionInvoice: 'SepaSubmissionInvoice',
  CompanyInvoiceItem: 'CompanyInvoiceItem',
  CompanyEmployee: 'CompanyEmployee',
  Location: 'Location',
  User: 'User',
  CustomerPreference: 'CustomerPreference',
  PreferenceAuditLog: 'PreferenceAuditLog',
  CustomerMetrics: 'CustomerMetrics',
  CustomerIdentifier: 'CustomerIdentifier',
  Wallet: 'Wallet',
  WalletTransaction: 'WalletTransaction',
  UserLocation: 'UserLocation',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  EmailChangeToken: 'EmailChangeToken',
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
  WorkflowExecutionLog: 'WorkflowExecutionLog',
  SegmentIncentive: 'SegmentIncentive',
  MarketingTemplate: 'MarketingTemplate',
  MarketingTemplateVersion: 'MarketingTemplateVersion',
  PushNotification: 'PushNotification',
  PushNotificationLog: 'PushNotificationLog',
  PushSubscription: 'PushSubscription',
  PaymentProviderConfig: 'PaymentProviderConfig',
  IncentiveGrant: 'IncentiveGrant',
  EmailCampaign: 'EmailCampaign',
  EmailCampaignLog: 'EmailCampaignLog',
  Journey: 'Journey',
  JourneyParticipant: 'JourneyParticipant',
  JourneyLog: 'JourneyLog',
  UserEvent: 'UserEvent'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
