
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

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  role: 'role',
  avatar: 'avatar',
  phone: 'phone',
  bio: 'bio',
  isVerified: 'isVerified',
  isActive: 'isActive',
  refreshToken: 'refreshToken',
  resetToken: 'resetToken',
  resetTokenExp: 'resetTokenExp',
  otpCodeHash: 'otpCodeHash',
  otpExpiresAt: 'otpExpiresAt',
  otpAttempts: 'otpAttempts',
  otpLastSentAt: 'otpLastSentAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  roleId: 'roleId',
  createdAt: 'createdAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  location: 'location',
  projectType: 'projectType',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  budget: 'budget',
  clientName: 'clientName',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ProjectMemberScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.CalculatorCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  createdAt: 'createdAt'
};

exports.Prisma.CalculatorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  formula: 'formula',
  categoryId: 'categoryId',
  createdAt: 'createdAt'
};

exports.Prisma.CalculatorInputScalarFieldEnum = {
  id: 'id',
  label: 'label',
  name: 'name',
  type: 'type',
  unit: 'unit',
  placeholder: 'placeholder',
  required: 'required',
  min: 'min',
  max: 'max',
  defaultValue: 'defaultValue',
  calculatorId: 'calculatorId'
};

exports.Prisma.SavedCalculationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  calculator: 'calculator',
  input: 'input',
  result: 'result',
  createdAt: 'createdAt'
};

exports.Prisma.MaterialScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  category: 'category',
  description: 'description',
  uses: 'uses',
  advantages: 'advantages',
  disadvantages: 'disadvantages',
  images: 'images',
  pdfCatalog: 'pdfCatalog',
  createdAt: 'createdAt'
};

exports.Prisma.MaterialPropertyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  value: 'value',
  unit: 'unit',
  materialId: 'materialId'
};

exports.Prisma.SpecificationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  value: 'value',
  standard: 'standard',
  materialId: 'materialId'
};

exports.Prisma.ISCodeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  title: 'title',
  category: 'category',
  description: 'description',
  year: 'year',
  pdfUrl: 'pdfUrl',
  pages: 'pages',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.BOQScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  description: 'description',
  totalCost: 'totalCost',
  status: 'status',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BOQItemScalarFieldEnum = {
  id: 'id',
  itemNo: 'itemNo',
  description: 'description',
  unit: 'unit',
  quantity: 'quantity',
  rate: 'rate',
  amount: 'amount',
  boqId: 'boqId'
};

exports.Prisma.EstimationScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  buildingType: 'buildingType',
  area: 'area',
  costPerSqft: 'costPerSqft',
  totalCost: 'totalCost',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.EstimationBreakdownScalarFieldEnum = {
  id: 'id',
  category: 'category',
  percentage: 'percentage',
  amount: 'amount',
  items: 'items',
  estimationId: 'estimationId'
};

exports.Prisma.ProjectFileScalarFieldEnum = {
  id: 'id',
  originalName: 'originalName',
  url: 'url',
  publicId: 'publicId',
  size: 'size',
  format: 'format',
  folder: 'folder',
  category: 'category',
  notes: 'notes',
  rateItems: 'rateItems',
  version: 'version',
  projectId: 'projectId',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt'
};

exports.Prisma.InspectionScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  date: 'date',
  inspector: 'inspector',
  remarks: 'remarks',
  safetyRating: 'safetyRating',
  images: 'images',
  status: 'status',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.InspectionItemScalarFieldEnum = {
  id: 'id',
  description: 'description',
  isPassed: 'isPassed',
  remarks: 'remarks',
  inspectionId: 'inspectionId'
};

exports.Prisma.DailyProgressScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  date: 'date',
  labourCount: 'labourCount',
  equipmentCount: 'equipmentCount',
  weather: 'weather',
  temperature: 'temperature',
  materialUsed: 'materialUsed',
  workDone: 'workDone',
  photos: 'photos',
  pdfUrl: 'pdfUrl',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.NoteScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  isBookmarked: 'isBookmarked',
  tags: 'tags',
  projectId: 'projectId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportScalarFieldEnum = {
  id: 'id',
  title: 'title',
  type: 'type',
  projectId: 'projectId',
  content: 'content',
  pdfUrl: 'pdfUrl',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  type: 'type',
  isRead: 'isRead',
  link: 'link',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.SettingsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  theme: 'theme',
  language: 'language',
  timezone: 'timezone',
  emailNotif: 'emailNotif',
  pushNotif: 'pushNotif'
};

exports.Prisma.BookmarkScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  entity: 'entity',
  entityId: 'entityId',
  createdAt: 'createdAt'
};

exports.Prisma.DownloadScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  entity: 'entity',
  entityId: 'entityId',
  createdAt: 'createdAt'
};

exports.Prisma.RecentActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.FavoriteScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  entity: 'entity',
  entityId: 'entityId',
  createdAt: 'createdAt'
};

exports.Prisma.FeedbackScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  subject: 'subject',
  message: 'message',
  rating: 'rating',
  createdAt: 'createdAt'
};

exports.Prisma.SupportTicketScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  subject: 'subject',
  message: 'message',
  status: 'status',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UnitConversionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  category: 'category',
  fromUnit: 'fromUnit',
  toUnit: 'toUnit',
  value: 'value',
  result: 'result',
  createdAt: 'createdAt'
};

exports.Prisma.SurveyDataScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  surveyType: 'surveyType',
  coordinates: 'coordinates',
  data: 'data',
  createdAt: 'createdAt'
};

exports.Prisma.ArticleScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  category: 'category',
  author: 'author',
  imageUrl: 'imageUrl',
  readTime: 'readTime',
  tags: 'tags',
  createdAt: 'createdAt'
};

exports.Prisma.TutorialScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  videoUrl: 'videoUrl',
  duration: 'duration',
  difficulty: 'difficulty',
  category: 'category',
  createdAt: 'createdAt'
};

exports.Prisma.RateAnalysisScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  description: 'description',
  items: 'items',
  transportCost: 'transportCost',
  taxPercent: 'taxPercent',
  overheadPercent: 'overheadPercent',
  profitPercent: 'profitPercent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AdminNotificationScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  type: 'type',
  audience: 'audience',
  recipientIds: 'recipientIds',
  roleFilter: 'roleFilter',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.SiteSettingsScalarFieldEnum = {
  id: 'id',
  websiteName: 'websiteName',
  logo: 'logo',
  favicon: 'favicon',
  banner: 'banner',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  address: 'address',
  smtpHost: 'smtpHost',
  smtpPort: 'smtpPort',
  smtpUser: 'smtpUser',
  smtpPass: 'smtpPass',
  smtpSecure: 'smtpSecure',
  cloudinaryCloud: 'cloudinaryCloud',
  cloudinaryKey: 'cloudinaryKey',
  cloudinarySecret: 'cloudinarySecret',
  jwtSecret: 'jwtSecret',
  jwtExpiresIn: 'jwtExpiresIn',
  maintenanceMode: 'maintenanceMode',
  maintenanceMessage: 'maintenanceMessage',
  theme: 'theme',
  primaryColor: 'primaryColor',
  facebookUrl: 'facebookUrl',
  twitterUrl: 'twitterUrl',
  linkedinUrl: 'linkedinUrl',
  instagramUrl: 'instagramUrl',
  youtubeUrl: 'youtubeUrl',
  updatedAt: 'updatedAt',
  updatedById: 'updatedById'
};

exports.Prisma.AdminActivityLogScalarFieldEnum = {
  id: 'id',
  adminId: 'adminId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  details: 'details',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.AnalyticsScalarFieldEnum = {
  id: 'id',
  date: 'date',
  visitors: 'visitors',
  pageViews: 'pageViews',
  downloads: 'downloads',
  registrations: 'registrations',
  storageUsed: 'storageUsed',
  createdAt: 'createdAt'
};

exports.Prisma.VisitorLogScalarFieldEnum = {
  id: 'id',
  date: 'date',
  count: 'count',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
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
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CIVIL_ENGINEER: 'CIVIL_ENGINEER',
  SITE_ENGINEER: 'SITE_ENGINEER',
  STRUCTURAL_ENGINEER: 'STRUCTURAL_ENGINEER',
  STUDENT: 'STUDENT',
  CONTRACTOR: 'CONTRACTOR',
  CLIENT: 'CLIENT',
  GUEST: 'GUEST'
};

exports.ProjectType = exports.$Enums.ProjectType = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL: 'COMMERCIAL',
  ROAD: 'ROAD',
  BRIDGE: 'BRIDGE',
  DRAIN: 'DRAIN',
  CANAL: 'CANAL',
  FOUNDATION: 'FOUNDATION',
  WALL: 'WALL',
  ROOF: 'ROOF',
  OTHER: 'OTHER'
};

exports.ProjectStatus = exports.$Enums.ProjectStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED'
};

exports.MaterialCategory = exports.$Enums.MaterialCategory = {
  CEMENT: 'CEMENT',
  SAND: 'SAND',
  AGGREGATE: 'AGGREGATE',
  STEEL: 'STEEL',
  BRICKS: 'BRICKS',
  BLOCKS: 'BLOCKS',
  TILES: 'TILES',
  WOOD: 'WOOD',
  GLASS: 'GLASS',
  PVC: 'PVC',
  PIPES: 'PIPES',
  PAINT: 'PAINT',
  ADMIXTURES: 'ADMIXTURES',
  OTHER: 'OTHER'
};

exports.Prisma.ModelName = {
  User: 'User',
  Role: 'Role',
  Permission: 'Permission',
  Project: 'Project',
  ProjectMember: 'ProjectMember',
  CalculatorCategory: 'CalculatorCategory',
  Calculator: 'Calculator',
  CalculatorInput: 'CalculatorInput',
  SavedCalculation: 'SavedCalculation',
  Material: 'Material',
  MaterialProperty: 'MaterialProperty',
  Specification: 'Specification',
  ISCode: 'ISCode',
  BOQ: 'BOQ',
  BOQItem: 'BOQItem',
  Estimation: 'Estimation',
  EstimationBreakdown: 'EstimationBreakdown',
  ProjectFile: 'ProjectFile',
  Inspection: 'Inspection',
  InspectionItem: 'InspectionItem',
  DailyProgress: 'DailyProgress',
  Note: 'Note',
  Report: 'Report',
  Notification: 'Notification',
  ActivityLog: 'ActivityLog',
  Settings: 'Settings',
  Bookmark: 'Bookmark',
  Download: 'Download',
  RecentActivity: 'RecentActivity',
  Favorite: 'Favorite',
  Feedback: 'Feedback',
  SupportTicket: 'SupportTicket',
  UnitConversion: 'UnitConversion',
  SurveyData: 'SurveyData',
  Article: 'Article',
  Tutorial: 'Tutorial',
  RateAnalysis: 'RateAnalysis',
  AdminNotification: 'AdminNotification',
  SiteSettings: 'SiteSettings',
  AdminActivityLog: 'AdminActivityLog',
  Analytics: 'Analytics',
  VisitorLog: 'VisitorLog'
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
