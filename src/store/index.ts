import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Requirement, Review, Version, Announcement, FilterOptions, StatusHistory, User, Store as StoreType, ReviewConclusion, ReviewGroup, BatchOperation, CapacityPreview, GroupByType, Priority, TimelineEvent, SavedView, TimelineEventType } from '@/types';
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
  batchOperations: BatchOperation[];
  savedViews: SavedView[];
  currentUser: User | null;
  filters: FilterOptions;
  addRequirement: (req: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>, asDraft?: boolean) => void;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  updateRequirementStatus: (id: string, status: Requirement['status'], reason?: string) => void;
  deleteRequirement: (id: string) => void;
  mergeRequirements: (primaryId: string, mergedIds: string[]) => void;
  batchReview: (requirementIds: string[], updates: { assigneeId?: string; priority?: Requirement['priority']; reviewComment?: string; status?: Requirement['status'] }) => void;
  batchReviewGrouped: (groups: ReviewGroup[], allRequirementIds: string[]) => void;
  calculateCapacityPreview: (versionId: string, requirementIdsToAdd: string[]) => CapacityPreview;
  calculateWorkload: (requirements: Requirement[]) => number;
  calculateRiskLevel: (p0Count: number, p1Count: number, workload: number, capacity: number) => 'low' | 'medium' | 'high';
  groupRequirements: (requirementIds: string[], groupBy: GroupByType) => ReviewGroup[];
  getTimelineEvents: (requirementId: string) => TimelineEvent[];
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  saveView: (name: string, description?: string) => string;
  deleteView: (viewId: string) => void;
  applyView: (viewId: string) => void;
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
  getBatchOperationById: (id: string) => BatchOperation | undefined;
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
      batchOperations: [],
      savedViews: [],
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

        const batchOpId = generateId();
        const newReviews: Review[] = [];
        const newHistories: StatusHistory[] = [];
        const hasAnyChange = updates.assigneeId || updates.priority || updates.status || updates.reviewComment?.trim();
        if (!hasAnyChange) return;

        const batchOp: BatchOperation = {
          id: batchOpId,
          type: 'batchReview',
          operatorId: state.currentUser?.id || '',
          createdAt: now,
          totalCount: validIds.length,
          groupCount: 1,
          requirementIds: validIds,
          summary: `批量评审 ${validIds.length} 项需求`,
        };

        set((s) => ({
          requirements: s.requirements.map((r) => {
            if (!validIds.includes(r.id)) return r;
            const reqUpdates: Partial<Requirement> = { updatedAt: now, batchOperationId: batchOpId };
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
                batchOperationId: batchOpId,
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
                  batchOperationId: batchOpId,
                });
              }
            } else if (updates.reviewComment?.trim()) {
              const history: StatusHistory = {
                id: generateId(),
                requirementId: r.id,
                fromStatus: r.status,
                toStatus: r.status,
                reason: updates.reviewComment,
                changedAt: now,
                operatorId: s.currentUser?.id || '',
                batchOperationId: batchOpId,
              };
              newHistories.push(history);
              reqUpdates.statusHistory = [...r.statusHistory, history];
            }
            return { ...r, ...reqUpdates };
          }),
          reviews: [...newReviews, ...s.reviews],
          statusHistory: [...newHistories, ...s.statusHistory],
          batchOperations: [batchOp, ...s.batchOperations],
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
          if (filters.status) {
            const statusArr = Array.isArray(filters.status) ? filters.status : [filters.status];
            if (!statusArr.includes(req.status)) return false;
          }
          if (filters.module) {
            const moduleArr = Array.isArray(filters.module) ? filters.module : [filters.module];
            if (!moduleArr.includes(req.module)) return false;
          }
          if (filters.priority) {
            const priorityArr = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
            if (!priorityArr.includes(req.priority)) return false;
          }
          if (filters.assigneeId) {
            const assigneeArr = Array.isArray(filters.assigneeId) ? filters.assigneeId : [filters.assigneeId];
            if (!assigneeArr.includes(req.assigneeId || '')) return false;
          }
          if (filters.region) {
            const regionArr = Array.isArray(filters.region) ? filters.region : [filters.region];
            const store = stores.find((s) => s.id === req.storeId);
            if (!store || !regionArr.includes(store.region)) return false;
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
          if (filters.period && filters.period !== 'all') {
            const days = filters.period === '7d' ? 7 : filters.period === '30d' ? 30 : 90;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            const reqDate = new Date(req.createdAt).getTime();
            if (reqDate < cutoff.getTime()) return false;
          }
          return true;
        });
      },

      getVisibleRequirements: () => {
        return get().requirements.filter((r) => !r.isHidden);
      },

      calculateWorkload: (requirements) => {
        return requirements.reduce((sum, r) => {
          const priorityWeight: Record<Priority, number> = {
            critical: 5, high: 3, medium: 2, low: 1,
          };
          return sum + priorityWeight[r.priority];
        }, 0);
      },

      calculateRiskLevel: (p0Count, p1Count, workload, capacity) => {
        const utilization = capacity > 0 ? workload / capacity : 1;
        if (utilization > 1 || p0Count >= 3) return 'high';
        if (utilization > 0.8 || p0Count >= 1 || p1Count >= 3) return 'medium';
        return 'low';
      },

      groupRequirements: (requirementIds, groupBy) => {
        const state = get();
        const reqs = state.requirements.filter(r => requirementIds.includes(r.id));
        const groups: Map<string, ReviewGroup> = new Map();

        if (groupBy === 'module') {
          const MODULE_LABELS: Record<string, string> = {
            pos: 'POS收银', inventory: '库存管理', member: '会员营销',
            report: '数据报表', other: '其他模块',
          };
          reqs.forEach(r => {
            const key = r.module;
            if (!groups.has(key)) {
              groups.set(key, {
                id: generateId(),
                name: MODULE_LABELS[key] || key,
                type: 'module',
                requirementIds: [],
              });
            }
            groups.get(key)!.requirementIds.push(r.id);
          });
        } else if (groupBy === 'region') {
          reqs.forEach(r => {
            const store = state.stores.find(s => s.id === r.storeId);
            const key = store?.region || '未分配区域';
            if (!groups.has(key)) {
              groups.set(key, {
                id: generateId(),
                name: key,
                type: 'region',
                requirementIds: [],
              });
            }
            groups.get(key)!.requirementIds.push(r.id);
          });
        } else if (groupBy === 'titleSimilarity') {
          const keywords = ['会员', '库存', '收银', '报表', '优惠券', '积分', '权限', '系统', '优化', '修复'];
          reqs.forEach(r => {
            let matched = false;
            for (const kw of keywords) {
              if (r.title.includes(kw)) {
                if (!groups.has(kw)) {
                  groups.set(kw, {
                    id: generateId(),
                    name: `「${kw}」相关需求`,
                    type: 'titleSimilarity',
                    requirementIds: [],
                  });
                }
                groups.get(kw)!.requirementIds.push(r.id);
                matched = true;
                break;
              }
            }
            if (!matched) {
              if (!groups.has('other')) {
                groups.set('other', {
                  id: generateId(),
                  name: '其他需求',
                  type: 'titleSimilarity',
                  requirementIds: [],
                });
              }
              groups.get('other')!.requirementIds.push(r.id);
            }
          });
        }

        return Array.from(groups.values()).sort((a, b) => b.requirementIds.length - a.requirementIds.length);
      },

      batchReviewGrouped: (groups, allRequirementIds) => {
        const state = get();
        const now = new Date().toISOString();
        const batchOpId = generateId();
        const newReviews: Review[] = [];
        const newHistories: StatusHistory[] = [];
        const updatedReqs: Requirement[] = [...state.requirements];

        groups.forEach(group => {
          const hasChange = group.assigneeId || group.priority || group.status || group.reviewComment?.trim();
          if (!hasChange) return;

          group.requirementIds.forEach(reqId => {
            const idx = updatedReqs.findIndex(r => r.id === reqId);
            if (idx === -1) return;
            const r = updatedReqs[idx];
            const reqUpdates: Partial<Requirement> = { updatedAt: now, batchOperationId: batchOpId };
            if (group.assigneeId) reqUpdates.assigneeId = group.assigneeId;
            if (group.priority) reqUpdates.priority = group.priority;

            if (group.status && group.status !== r.status) {
              const history: StatusHistory = {
                id: generateId(),
                requirementId: r.id,
                fromStatus: r.status,
                toStatus: group.status,
                reason: group.reviewComment,
                changedAt: now,
                operatorId: state.currentUser?.id || '',
                batchOperationId: batchOpId,
              };
              newHistories.push(history);
              reqUpdates.status = group.status;
              reqUpdates.statusHistory = [...r.statusHistory, history];
              reqUpdates.reviewTime = now;

              if (group.status === 'approved' || group.status === 'rejected' || group.status === 'deferred') {
                const conclusion: ReviewConclusion = group.status === 'approved' ? 'approved' : group.status === 'rejected' ? 'rejected' : 'deferred';
                newReviews.push({
                  id: generateId(),
                  requirementId: r.id,
                  conclusion,
                  comment: group.reviewComment || `[${group.name}] 批量评审处理`,
                  reviewedAt: now,
                  reviewerId: state.currentUser?.id || '',
                  batchOperationId: batchOpId,
                });
              }
            } else if (group.reviewComment?.trim()) {
              const history: StatusHistory = {
                id: generateId(),
                requirementId: r.id,
                fromStatus: r.status,
                toStatus: r.status,
                reason: group.reviewComment,
                changedAt: now,
                operatorId: state.currentUser?.id || '',
                batchOperationId: batchOpId,
              };
              newHistories.push(history);
              reqUpdates.statusHistory = [...r.statusHistory, history];
            }

            updatedReqs[idx] = { ...r, ...reqUpdates };
          });
        });

        const batchOp: BatchOperation = {
          id: batchOpId,
          type: 'batchReview',
          operatorId: state.currentUser?.id || '',
          createdAt: now,
          totalCount: allRequirementIds.length,
          groupCount: groups.length,
          requirementIds: allRequirementIds,
          summary: `分${groups.length}组批量评审${allRequirementIds.length}项需求`,
        };

        set({
          requirements: updatedReqs,
          reviews: [...newReviews, ...state.reviews],
          statusHistory: [...newHistories, ...state.statusHistory],
          batchOperations: [batchOp, ...state.batchOperations],
        });
      },

      calculateCapacityPreview: (versionId, requirementIdsToAdd) => {
        const state = get();
        const version = state.versions.find(v => v.id === versionId);
        const currentReqs = state.requirements.filter(r => r.versionId === versionId && !r.isHidden);
        const addedReqs = state.requirements.filter(r => requirementIdsToAdd.includes(r.id));

        const currentWorkload = state.calculateWorkload(currentReqs);
        const addedWorkload = state.calculateWorkload(addedReqs);
        const newWorkload = currentWorkload + addedWorkload;
        const capacity = version?.capacity || 10;
        const utilizationPercent = capacity > 0 ? Math.round((newWorkload / capacity) * 100) : 0;

        const currentP0 = currentReqs.filter(r => r.priority === 'critical').length;
        const currentP1 = currentReqs.filter(r => r.priority === 'high').length;
        const addedP0 = addedReqs.filter(r => r.priority === 'critical').length;
        const addedP1 = addedReqs.filter(r => r.priority === 'high').length;

        const currentRisk = state.calculateRiskLevel(currentP0, currentP1, currentWorkload, capacity);
        const newRisk = state.calculateRiskLevel(currentP0 + addedP0, currentP1 + addedP1, newWorkload, capacity);

        const estimatedDelayDays = utilizationPercent > 100 ? Math.ceil((newWorkload - capacity) * 1.5) : 0;

        return {
          versionId,
          currentWorkload,
          addedWorkload,
          newWorkload,
          capacity,
          utilizationPercent,
          isOverloaded: utilizationPercent > 100,
          isNearCapacity: utilizationPercent >= 80 && utilizationPercent <= 100,
          p0Count: currentP0,
          p1Count: currentP1,
          newP0Count: currentP0 + addedP0,
          newP1Count: currentP1 + addedP1,
          riskLevel: currentRisk,
          newRiskLevel: newRisk,
          estimatedDelayDays,
          addedRequirements: requirementIdsToAdd,
        };
      },

      getBatchOperationById: (id) => {
        return get().batchOperations.find(op => op.id === id);
      },

      getTimelineEvents: (requirementId) => {
        const state = get();
        const events: TimelineEvent[] = [];
        const req = state.requirements.find(r => r.id === requirementId);
        if (!req) return events;

        events.push({
          id: `create-${req.id}`,
          type: 'create',
          requirementId: req.id,
          title: '需求创建',
          description: req.title,
          operatorId: req.submitterId,
          timestamp: req.createdAt,
        });

        if (req.mergedFromIds && req.mergedFromIds.length > 0) {
          events.push({
            id: `merge-${req.id}`,
            type: 'merge',
            requirementId: req.id,
            title: '需求合并',
            description: `合并了 ${req.mergedFromIds.length} 个需求`,
            operatorId: state.currentUser?.id,
            timestamp: req.updatedAt,
            mergedFromIds: req.mergedFromIds,
            mergedToId: req.id,
          });
        }

        const reviews = state.reviews.filter(r => r.requirementId === requirementId);
        reviews.forEach(review => {
          const batchOp = review.batchOperationId ? state.batchOperations.find(op => op.id === review.batchOperationId) : null;
          events.push({
            id: `review-${review.id}`,
            type: batchOp ? 'batchReview' : 'review',
            requirementId: req.id,
            title: batchOp ? `批量评审 (${batchOp.summary})` : '需求评审',
            description: review.comment,
            operatorId: review.reviewerId,
            timestamp: review.reviewedAt,
            batchOperationId: review.batchOperationId,
            reviewConclusion: review.conclusion,
          });
        });

        req.statusHistory.forEach(history => {
          const batchOp = history.batchOperationId ? state.batchOperations.find(op => op.id === history.batchOperationId) : null;
          const isSchedule = history.toStatus === 'scheduled' || req.versionId;
          
          if (history.fromStatus !== history.toStatus) {
            events.push({
              id: `status-${history.id}`,
              type: isSchedule ? 'schedule' : 'statusChange',
              requirementId: req.id,
              title: isSchedule ? '版本排期' : '状态变更',
              description: history.reason || (batchOp ? batchOp.summary : undefined),
              operatorId: history.operatorId,
              timestamp: history.changedAt,
              batchOperationId: history.batchOperationId,
              fromStatus: history.fromStatus,
              toStatus: history.toStatus,
              versionId: req.versionId,
            });
          } else if (history.reason) {
            events.push({
              id: `update-${history.id}`,
              type: 'update',
              requirementId: req.id,
              title: '备注更新',
              description: history.reason,
              operatorId: history.operatorId,
              timestamp: history.changedAt,
              batchOperationId: history.batchOperationId,
            });
          }
        });

        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      saveView: (name, description) => {
        const state = get();
        const id = generateId();
        const newView: SavedView = {
          id,
          name,
          description,
          filters: { ...state.filters },
          createdAt: new Date().toISOString(),
          createdBy: state.currentUser?.id || '',
        };
        set({ savedViews: [newView, ...state.savedViews] });
        return id;
      },

      deleteView: (viewId) => {
        set((state) => ({
          savedViews: state.savedViews.filter(v => v.id !== viewId),
        }));
      },

      applyView: (viewId) => {
        const view = get().savedViews.find(v => v.id === viewId);
        if (view) {
          set({ filters: { ...view.filters } });
        }
      },
    }),
    {
      name: 'requirement-management-storage',
    }
  )
);
