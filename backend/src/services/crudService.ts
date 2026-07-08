import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { paginate, buildPaginationMeta } from '../utils/helpers';

type PrismaDelegate = {
  findMany: (args: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};

function getDelegate(modelName: string): PrismaDelegate {
  const delegate = (prisma as any)[modelName];
  if (!delegate) throw new Error(`Prisma model "${modelName}" not found`);
  return delegate;
}

/**
 * BUG FIX: the old CrudService never passed `include` to findMany/findUnique,
 * so any model with a nested child relation (BOQ.items, Estimation.breakdown,
 * Inspection.checklist, Calculator.inputs) would create the children just
 * fine, but then list/getById would silently return the parent WITHOUT the
 * children — the child rows were sitting in the DB the whole time, they just
 * never came back over the API. That's why a saved BOQ appeared to keep only
 * the title ("file name") and lose every line item: the items were saved,
 * the read path just dropped them.
 */
const RELATION_INCLUDES: Record<string, any> = {
  BOQ: { items: true },
  Estimation: { breakdown: true },
  Inspection: { checklist: true },
  Calculator: { inputs: true },
};

/**
 * Models where a nested array relation is sent by the frontend as a plain
 * array (e.g. `items: [...]`) representing the FULL desired child list, not
 * an incremental diff. On update, we replace the whole set (delete + create)
 * rather than attempting a partial merge.
 */
const NESTED_ARRAY_FIELDS: Record<string, string> = {
  BOQ: 'items',
  Estimation: 'breakdown',
  Inspection: 'checklist',
};

export class CrudService {
  private modelName: string;
  private delegate: PrismaDelegate;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.delegate = getDelegate(modelName.charAt(0).toLowerCase() + modelName.slice(1));
  }

  private get include() {
    return RELATION_INCLUDES[this.modelName];
  }

  async list(params: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; where?: any }) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', where = {} } = params;
    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
      this.delegate.findMany({ skip, take, where, orderBy: { [sortBy]: sortOrder }, ...(this.include && { include: this.include }) }),
      this.delegate.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const item = await this.delegate.findUnique({
      where: { id },
      ...(this.include && { include: this.include }),
    });
    if (!item) throw new AppError(`${this.modelName} not found`, 404);
    return item;
  }

  async create(data: any) {
    return this.delegate.create({
      data,
      ...(this.include && { include: this.include }),
    });
  }

  async update(id: string, data: any) {
    const item = await this.delegate.findUnique({ where: { id } });
    if (!item) throw new AppError(`${this.modelName} not found`, 404);

    const nestedField = NESTED_ARRAY_FIELDS[this.modelName];
    if (nestedField && data[nestedField] && Array.isArray(data[nestedField].create)) {
      // Full replace of the child collection: wipe existing children for
      // this parent, then create the new set the frontend sent us.
      data = {
        ...data,
        [nestedField]: { deleteMany: {}, create: data[nestedField].create },
      };
    }

    return this.delegate.update({
      where: { id },
      data,
      ...(this.include && { include: this.include }),
    });
  }

  async delete(id: string) {
    const item = await this.delegate.findUnique({ where: { id } });
    if (!item) throw new AppError(`${this.modelName} not found`, 404);
    return this.delegate.delete({ where: { id } });
  }
}

// Export service instances
export const projectService = new CrudService('Project');
export const materialService = new CrudService('Material');
export const isCodeService = new CrudService('ISCode');
export const boqService = new CrudService('BOQ');
export const estimationService = new CrudService('Estimation');
export const inspectionService = new CrudService('Inspection');
export const reportService = new CrudService('Report');
export const noteService = new CrudService('Note');
export const notificationService = new CrudService('Notification');
export const calculatorService = new CrudService('Calculator');
export const dailyProgressService = new CrudService('DailyProgress');
export const projectFileService = new CrudService('ProjectFile');
export const feedbackService = new CrudService('Feedback');
export const supportTicketService = new CrudService('SupportTicket');
export const activityLogService = new CrudService('ActivityLog');
