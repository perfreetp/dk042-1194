import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requirement, Review, Version, Announcement, FilterOptions, StatusHistory, User, Store as StoreType, ReviewConclusion } from '@/types';
import { mockRequirements, mockReviews, mockVersions, mockAnnouncements, mockUsers, mockStores } from '@/mock';
import { generateId } from '@/utils/format';

interface AppState {
  requirements: Requirement[];
  reviews: Review[];
  versions: Version[];
  announcements: Announcement[];
  users: User[];
  stores: StoreType[];
  statusHistory: StatusHistory[];
  currentUser: User | null;
  filters: FilterOptions;
  addRequirement: (req: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>, asDraft?: boolean) => void;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  updateRequirementStatus: (id: string, status: Requirement['status'], reason?: string) => void;
  deleteRequirement: (id: string) => void;
  mergeRequirements: (primaryId: string, mergedIds: string[]) => void;
  batchReview: (requirementIds: string[], updates: { assigneeId?: string; priority?: Requirement['priority']; reviewComment?: string; status?: Requirement['status'] }) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  addReview: (review: Omit<Review, 'id' | 'reviewedAt'>) => void;
  addVersion: (version: Omit<Version, 'id'>) => void;
  updateVersion: (id: string, updates: Partial<Version>) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  saveDraft: (req: Partial<Requirement> & { storeId?: string; submitterId?: string; title?: string }, existingId?: string) => string;
  getRequirementsByStatus: (status: Requirement['status']) => Requirement[];
  getRequirementsByVersion: (versionId: string | undefined) => Requirement[];
  getStoreById: (id: string) => StoreType | undefined;
  getUserById: (id: string) => User | undefined;
  getVersionById: (id: string) => Version | undefined;
  getReviewsByRequirementId: (requirementId: string) => Review[];
  getFilteredRequirements: () => Requirement[];
  getVisibleRequirements: () => Requirement[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      requirements: mockRequirements,
      reviews: mockReviews,
      versions: mockVersions,
      announcements: mockAnnouncements,
      users: mockUsers,
      stores: mockStores,
      statusHistory: [],
      currentUser: mockUsers[0],
      filters: {},

      addRequirement: (req, asDraft = false) => {
        const newReq: Requirement = {
          ...req,
          id: generateId(),
          status: asDraft ? 'draft' : 'pending',
          statusHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ requirements: [newReq, ...state.requirements] }));
      },

      saveDraft: (draftData, existingId) => {
        const now = new Date().toISOString();
        const state = get();
        const defaultStoreId = draftData.storeId || state.currentUser?.storeId || state.stores[0]?.id || 'store-default';
        const defaultSubmitterId = draftData.submitterId || state.currentUser?.id || 'user-default';
        const defaultTitle = draftData.title && draftData.title.trim() ? draftData.title : `未命名草稿 ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;

        if (existingId) {
          set((state) => ({
            requirements: state.requirements.map((r) =>
              r.id === existingId
                ? { ...r, ...draftData, storeId: defaultStoreId, submitterId: defaultSubmitterId, title: defaultTitle, status: 'draft', updatedAt: now }
                : r
            ),
          }));
          return existingId;
        }
        const newDraft: Requirement = {
          module: 'other',
          description: '',
          screenshots: [],
          impactScope: 'single',
          expectedDate: '',
          priority: 'medium',
          businessValue: 'medium',
          ...draftData,
          storeId: defaultStoreId,
          submitterId: defaultSubmitterId,
          title: defaultTitle,
          id: generateId(),
          status: 'draft',
          statusHistory: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ requirements: [newDraft, ...state.requirements] }));
        return newDraft.id;
      },

      mergeRequirements: (primaryId, mergedIds) => {
        const state = get();
        const primaryReq = state.requirements.find((r) => r.id === primaryId);
        if (!primaryReq) return;

        const mergedReqs = state.requirements.filter((r) => mergedIds.includes(r.id));
        const mergedFromIds = [...(primaryReq.mergedFromIds || []), ...mergedIds];
        const mergedDescriptions = mergedReqs.map((r) => `【合并自：${r.title}】\n${r.description}`).join('\n\n');
        const mergedScreenshots = [...new Set([...primaryReq.screenshots, ...mergedReqs.flatMap(r => r.screenshots)])];
        const mergedHistory = mergedReqs.flatMap((r) => [
          {
            id: generateId(),
            requirementId: primaryId,
            fromStatus: r.status,
            toStatus: primaryReq.status,
            reason: `需求被合并：${r.title}`,
            changedAt: new Date().toISOString(),
            operatorId: state.currentUser?.id || '',
          },
          ...r.statusHistory,
        ]);

        const newDescription = primaryReq.description + (mergedDescriptions ? `\n\n${mergedDescriptions}` : '');

        set((s) => ({
          requirements: s.requirements.map((r) => {
            if (r.id === primaryId) {
              return {
                ...r,
                mergedFromIds,
                description: newDescription,
                screenshots: mergedScreenshots,
                statusHistory: [...r.statusHistory, ...mergedHistory],
                updatedAt: new Date().toISOString(),
              };
            }
            if (mergedIds.includes(r.id)) {
              return { ...r, isHidden: true, updatedAt: new Date().toISOString() };
            }
            return r;
          }),
        }));
      },

      batchReview: (requirementIds, updates) => {
        const state = get();
        const now = new Date().toISOString();
        const validIds = requirementIds.filter(id =>
          state.requirements.some(r => r.id === id)
        );
        if (validIds.length === 0) return;

        const newReviews: Review[] = [];
        const newHistories: StatusHistory[] = [];

        set((s) => ({
          requirements: s.requirements.map((r) => {
            if (!validIds.includes(r.id)) return r;
            const reqUpdates: Partial<Requirement> = { updatedAt: now };
            if (updates.assigneeId) reqUpdates.assigneeId = updates.assigneeId;
            if (updates.priority) reqUpdates.priority = updates.priority;
            if (updates.status && updates.status !== r.status) {
              const history: StatusHistory = {
                id: generateId(),
                requirementId: r.id,
                fromStatus: r.status,
                toStatus: updates.status,
                reason: updates.reviewComment,
                changedAt: now,
                operatorId: s.currentUser?.id || '',
              };
              newHistories.push(history);
              reqUpdates.status = updates.status;
              reqUpdates.statusHistory = [...r.statusHistory, history];
              reqUpdates.reviewTime = now;

              if (updates.status === 'approved' || updates.status === 'rejected' || updates.status === 'deferred') {
                const conclusion: ReviewConclusion = updates.status === 'approved' ? 'approved' : updates.status === 'rejected' ? 'rejected' : 'deferred';
                newReviews.push({
                  id: generateId(),
                  requirementId: r.id,
                  conclusion,
                  comment: updates.reviewComment || '批量评审处理',
                  reviewedAt: now,
                  reviewerId: s.currentUser?.id || '',
                });
              }
            }
            return { ...r, ...reqUpdates };
          }),
          reviews: [...newReviews, ...s.reviews],
          statusHistory: [...s.statusHistory, ...newHistories],
        }));
      },

      updateRequirement: (id, updates) => {
        set((state) => ({
          requirements: state.requirements.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateRequirementStatus: (id, status, reason) => {
        const state = get();
        const req = state.requirements.find((r) => r.id === id);
        if (req) {
          const history: StatusHistory = {
            id: generateId(),
            requirementId: id,
            fromStatus: req.status,
            toStatus: status,
            reason,
            changedAt: new Date().toISOString(),
            operatorId: state.currentUser?.id || '',
          };
          const updates: Partial<Requirement> = {
            status,
            updatedAt: new Date().toISOString(),
            statusHistory: [...req.statusHistory, history],
          };
          if (!req.reviewTime && status !== 'pending') {
            updates.reviewTime = new Date().toISOString();
          }
          set((s) => ({
            requirements: s.requirements.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
            statusHistory: [...s.statusHistory, history],
          }));
        }
      },

      deleteRequirement: (id) => {
        set((state) => ({
          requirements: state.requirements.filter((r) => r.id !== id),
        }));
      },

      setFilters: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
      },

      resetFilters: () => {
        set({ filters: {} });
      },

      addReview: (review) => {
        const newReview: Review = {
          ...review,
          id: generateId(),
          reviewedAt: new Date().toISOString(),
        };
        set((state) => ({ reviews: [newReview, ...state.reviews] }));
        
        if (review.conclusion === 'approved') {
          get().updateRequirementStatus(review.requirementId, 'approved', '评审通过');
        } else if (review.conclusion === 'rejected') {
          get().updateRequirementStatus(review.requirementId, 'rejected', review.returnReason);
        } else if (review.conclusion === 'deferred') {
          get().updateRequirementStatus(review.requirementId, 'deferred', '评审暂缓');
        }
      },

      addVersion: (version) => {
        const newVersion: Version = {
          ...version,
          id: generateId(),
        };
        set((state) => ({ versions: [...state.versions, newVersion] }));
      },

      updateVersion: (id, updates) => {
        set((state) => ({
          versions: state.versions.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        }));
      },

      addAnnouncement: (announcement) => {
        const newAnnouncement: Announcement = {
          ...announcement,
          id: generateId(),
          publishedAt: new Date().toISOString(),
        };
        set((state) => {
          const updatedVersions = state.versions.map((v) =>
            v.id === announcement.versionId ? { ...v, status: 'released' as const } : v
          );
          return {
            announcements: [newAnnouncement, ...state.announcements],
            versions: updatedVersions,
          };
        });
      },

      getRequirementsByStatus: (status) => {
        return get().requirements.filter((r) => r.status === status);
      },

      getRequirementsByVersion: (versionId) => {
        return get().requirements.filter((r) => r.versionId === versionId);
      },

      getStoreById: (id) => {
        return get().stores.find((s) => s.id === id);
      },

      getUserById: (id) => {
        return get().users.find((u) => u.id === id);
      },

      getVersionById: (id) => {
        return get().versions.find((v) => v.id === id);
      },

      getReviewsByRequirementId: (requirementId) => {
        return get().reviews.filter((r) => r.requirementId === requirementId);
      },

      getFilteredRequirements: () => {
        const { requirements, filters, stores } = get();
        const visible = requirements.filter((r) => !r.isHidden);
        return visible.filter((req) => {
          if (filters.status?.length && !filters.status.includes(req.status)) return false;
          if (filters.module?.length && !filters.module.includes(req.module)) return false;
          if (filters.priority?.length && !filters.priority.includes(req.priority)) return false;
          if (filters.assigneeId?.length && !filters.assigneeId.includes(req.assigneeId || '')) return false;
          if (filters.region?.length) {
            const store = stores.find((s) => s.id === req.storeId);
            if (!store || !filters.region.includes(store.region)) return false;
          }
          if (filters.search) {
            const search = filters.search.toLowerCase();
            if (
              !req.title.toLowerCase().includes(search) &&
              !req.description.toLowerCase().includes(search)
            )
              return false;
          }
          if (filters.dateRange) {
            const reqDate = new Date(req.createdAt).getTime();
            const start = new Date(filters.dateRange[0]).getTime();
            const end = new Date(filters.dateRange[1]).getTime();
            if (reqDate < start || reqDate > end) return false;
          }
          return true;
        });
      },

      getVisibleRequirements: () => {
        return get().requirements.filter((r) => !r.isHidden);
      },
    }),
    {
      name: 'requirement-management-storage',
    }
  )
);
