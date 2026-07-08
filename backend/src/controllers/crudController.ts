import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';

type ServiceType = {
  list: (params: any) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

type SearchableFields = {
  [key: string]: string[];
};

// Models and their searchable fields (other than 'title')
const searchableFields: SearchableFields = {
  ISCode: ['code', 'title'],
  Material: ['name', 'slug'],
  Article: ['title', 'excerpt'],
  Tutorial: ['title'],
  User: ['name', 'email'],
  Project: ['name'],
  BOQ: ['title'],
  Estimation: ['title'],
  Inspection: ['title'],
  Note: ['title'],
  Report: ['title'],
  DailyProgress: ['workDone'],
};

// Models that own their rows via a user-foreign-key column. Used to
// auto-inject the owner on create so the frontend never has to (and can't
// spoof) it, and to scope list/getById/update/delete to the owner.
//
// BUG FIX: this used to be a flat list that assumed every model's owner
// column was literally named `userId`. DailyProgress uses `createdById`
// and ProjectFile uses `uploadedById` — under the old flat-list version,
// scoping either of those through this generic controller would have
// silently filtered on a column that doesn't exist / never stamped the
// real owner column on create. Now each model declares its own column name.
const ownerFieldByModel: Record<string, string> = {
  Project: 'userId', Note: 'userId', Inspection: 'userId', Notification: 'userId',
  ActivityLog: 'userId', Feedback: 'userId', SupportTicket: 'userId',
  SavedCalculation: 'userId', RateAnalysis: 'userId', Bookmark: 'userId',
  Download: 'userId', RecentActivity: 'userId', Favorite: 'userId',
  // BUG FIX: BOQ and Estimation had NO userId field at all, so every saved
  // BOQ/Estimation was visible to every user in the system (no ownership,
  // no isolation). Added `userId` to both models in schema.prisma; wiring
  // it up here so create() actually stamps the owner.
  BOQ: 'userId', Estimation: 'userId',
  DailyProgress: 'createdById',
  ProjectFile: 'uploadedById',
};

function ownerField(entityName: string): string {
  return ownerFieldByModel[entityName] || 'userId';
}

// Models with a nested array relation (child rows created inline with the
// parent). Maps entityName -> the request-body field holding the array.
const nestedArrayField: Record<string, string> = {
  Inspection: 'checklist',
  BOQ: 'items',
  Estimation: 'breakdown',
};

/**
 * Converts a plain array on the request body (e.g. `items: [...]`) into
 * Prisma's nested-create shape (`items: { create: [...] }`). Applied on both
 * create AND update — previously this only ran on create, so PUT-ing an
 * existing BOQ/Estimation/Inspection with an edited item list sent Prisma a
 * raw array where it expected a relation operation object, which either
 * silently no-ops or throws depending on the Prisma version. Both create and
 * update now go through the same transform.
 */
function applyNestedCreateShape(entityName: string, data: any) {
  const field = nestedArrayField[entityName];
  if (field && Array.isArray(data[field])) {
    data[field] = { create: data[field] };
  }
  return data;
}

export function createCrudController(service: ServiceType, entityName: string, scopeToUser: boolean = false) {
  return {
    list: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { page, limit, sortBy, sortOrder, search, ...filters } = req.query;
        // Build where clause
        const where: any = { ...filters };
        
        // Handle search - check searchable fields for this entity
        if (search) {
          const fields = searchableFields[entityName] || ['title', 'name'];
          const searchStr = String(search);
          if (fields.length === 1) {
            where[fields[0]] = { contains: searchStr, mode: 'insensitive' };
          } else {
            where.OR = fields.map((field) => ({
              [field]: { contains: searchStr, mode: 'insensitive' },
            }));
          }
        }

        // Filter by owner for user-scoped routes
        if (scopeToUser && req.user?.id) {
          where[ownerField(entityName)] = req.user.id;
        }

        const result = await service.list({
          page: page ? parseInt(String(page)) : 1,
          limit: limit ? parseInt(String(limit)) : 10,
          sortBy: sortBy ? String(sortBy) : 'createdAt',
          sortOrder: (sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
          where,
        });
        res.json({ success: true, data: result.data, meta: result.meta });
      } catch (error) { next(error); }
    },

    getById: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const id = String(req.params.id);
        const item = await service.getById(id);
        // Verify ownership for user-scoped routes
        if (scopeToUser && req.user?.id && item?.[ownerField(entityName)] !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
        res.json({ success: true, data: item });
      } catch (error) { next(error); }
    },

    create: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        let data = scopeToUser ? { ...req.body, [ownerField(entityName)]: req.user?.id } : { ...req.body };
        data = applyNestedCreateShape(entityName, data);

        const item = await service.create(data);
        res.status(201).json({ success: true, message: `${entityName} created successfully`, data: item });
      } catch (error) { next(error); }
    },

    update: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const id = String(req.params.id);
        // Verify ownership for user-scoped routes
        if (scopeToUser && req.user?.id) {
          const existing = await service.getById(id);
          if (existing?.[ownerField(entityName)] !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }

        // Never allow the client to reassign ownership or overwrite the id.
        const { [ownerField(entityName)]: _ignoredOwner, id: _ignoredId, ...body } = req.body;
        const data = applyNestedCreateShape(entityName, body);

        const item = await service.update(id, data);
        res.json({ success: true, message: `${entityName} updated successfully`, data: item });
      } catch (error) { next(error); }
    },

    delete: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const id = String(req.params.id);
        // Verify ownership for user-scoped routes
        if (scopeToUser && req.user?.id) {
          const existing = await service.getById(id);
          if (existing?.[ownerField(entityName)] !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
        await service.delete(id);
        res.json({ success: true, message: `${entityName} deleted successfully` });
      } catch (error) { next(error); }
    },
  };
}
