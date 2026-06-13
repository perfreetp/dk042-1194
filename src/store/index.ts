import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requirement, Review, Version, Announcement, FilterOptions, StatusHistory, User, Store as StoreType } from '@/types';
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
  addRequirement: (req: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>) => void;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  updateRequirementStatus: (id: string, status: Requirement['status'], reason?: string) => void;
  deleteRequirement: (id: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  addReview: (review: Omit<Review, 'id' | 'reviewedAt'>) => void;
  addVersion: (version: Omit<Version, 'id'>) => void;
  updateVersion: (id: string, updates: Partial<Version>) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  getRequirementsByStatus: (status: Requirement['status']) => Requirement[];
  getRequirementsByVersion: (versionId: string | undefined) => Requirement[];
  getStoreById: (id: string) => StoreType | undefined;
  getUserById: (id: string) => User | undefined;
  getVersionById: (id: string) => Version | undefined;
  getReviewsByRequirementId: (requirementId: string) => Review[];
  getFilteredRequirements: () => Requirement[];
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

      addRequirement: (req) => {
        const newReq: Requirement = {
          ...req,
          id: generateId(),
          status: 'pending',
          statusHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ requirements: [newReq, ...state.requirements] }));
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
        set((state) => ({ announcements: [newAnnouncement, ...state.announcements] }));
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
        return requirements.filter((req) => {
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
    }),
    {
      name: 'requirement-management-storage',
    }
  )
);
