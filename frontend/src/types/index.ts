// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CIVIL_ENGINEER' | 'SITE_ENGINEER' | 'STRUCTURAL_ENGINEER' | 'STUDENT' | 'CONTRACTOR' | 'CLIENT' | 'GUEST';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  clientName?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectType = 'RESIDENTIAL' | 'COMMERCIAL' | 'ROAD' | 'BRIDGE' | 'DRAIN' | 'CANAL' | 'FOUNDATION' | 'WALL' | 'ROOF' | 'OTHER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

// Calculator Types
export interface CalculatorCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  calculators: Calculator[];
}

export interface Calculator {
  id: string;
  name: string;
  slug: string;
  description?: string;
  formula?: string;
  categoryId: string;
  inputs: CalculatorInput[];
  createdAt: string;
}

export interface CalculatorInput {
  id: string;
  label: string;
  name: string;
  type: 'number' | 'select' | 'text' | 'boolean';
  unit?: string;
  placeholder?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

export interface CalculationResult {
  result: number;
  unit: string;
  formula: string;
  steps: { description: string; value: string }[];
  details?: Record<string, any>;
}

// Material Types
export interface Material {
  id: string;
  name: string;
  slug: string;
  category: MaterialCategory;
  description?: string;
  properties?: MaterialProperty[];
  specifications?: Specification[];
  uses?: string[];
  advantages?: string[];
  disadvantages?: string[];
  images?: string[];
  pdfCatalog?: string;
  createdAt: string;
}

export type MaterialCategory = 'CEMENT' | 'SAND' | 'AGGREGATE' | 'STEEL' | 'BRICKS' | 'BLOCKS' | 'TILES' | 'WOOD' | 'GLASS' | 'PVC' | 'PIPES' | 'PAINT' | 'ADMIXTURES' | 'OTHER';

export interface MaterialProperty {
  name: string;
  value: string;
  unit?: string;
}

export interface Specification {
  name: string;
  value: string;
  standard?: string;
}

// IS Code Types
export interface ISCode {
  id: string;
  code: string;
  title: string;
  category: string;
  description?: string;
  year: number;
  pdfUrl?: string;
  pages?: number;
  status: 'ACTIVE' | 'REVISED' | 'WITHDRAWN';
  createdAt: string;
}

// BOQ Types
export interface BOQ {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  items: BOQItem[];
  totalCost: number;
  status: 'DRAFT' | 'FINAL' | 'APPROVED';
  createdAt: string;
  updatedAt: string;
}

export interface BOQItem {
  id: string;
  itemNo: number;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Estimation Types
export interface Estimation {
  id: string;
  projectId?: string;
  title: string;
  buildingType: BuildingType;
  area: number;
  costPerSqft: number;
  totalCost: number;
  breakdown: EstimationBreakdown[];
  createdAt: string;
}

export type BuildingType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'ROAD' | 'BRIDGE';

export interface EstimationBreakdown {
  category: string;
  percentage: number;
  amount: number;
  // quantity/rate/unit are optional because older saved estimations were
  // written before this fix and only ever stored name+cost per item.
  items: { name: string; cost: number; quantity?: number; rate?: number; unit?: string }[];
}

// Inspection Types
export interface Inspection {
  id: string;
  projectId?: string;
  title: string;
  date: string;
  inspector: string;
  checklist: InspectionItem[];
  remarks?: string;
  safetyRating?: number;
  images: string[];
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface InspectionItem {
  id: string;
  description: string;
  isPassed: boolean;
  remarks?: string;
}

// Unit Conversion Types
export interface UnitCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  toBase: number;
  fromBase: number;
}

// Report Types
export interface Report {
  id: string;
  title: string;
  type: ReportType;
  projectId?: string;
  content?: string;
  pdfUrl?: string;
  status: 'DRAFT' | 'GENERATED' | 'ARCHIVED';
  createdAt: string;
}

export type ReportType = 'CALCULATION' | 'INSPECTION' | 'PROJECT' | 'MATERIAL' | 'DAILY_PROGRESS';

// File Types
export interface ProjectFile {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
  folder: string;
  category?: string | null;
  notes?: string | null;
  rateItems?: { id: string; name: string; unit: string; quantity: number; rate: number }[] | null;
  version: number;
  projectId?: string;
  uploadedById: string;
  createdAt: string;
}

export interface DailyProgress {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  date: string;
  labourCount: number;
  equipmentCount: number;
  weather: string;
  temperature?: number;
  materialUsed?: string;
  workDone: string;
  photos: string[];
  pdfUrl?: string;
  createdById: string;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Learning Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  author?: string;
  imageUrl?: string;
  readTime?: number;
  tags: string[];
  createdAt: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Daily Progress Report Types
export interface DailyProgress {
  id: string;
  projectId: string;
  date: string;
  labourCount: number;
  equipmentCount: number;
  weather: string;
  temperature?: number;
  materialUsed?: string;
  workDone: string;
  photos: string[];
  pdfUrl?: string;
  createdById: string;
  createdAt: string;
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  isBookmarked: boolean;
  tags: string[];
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCalculations: number;
  savedMaterials: number;
  recentActivities: ActivityLog[];
  savedCalculations: CalculationResult[];
  favoriteTools: Calculator[];
  latestISCodes: ISCode[];
  projectStats: { status: string; count: number }[];
  profileCompletion: number;
  announcements: { title: string; message: string; date: string }[];
}