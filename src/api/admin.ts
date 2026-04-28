import { apiClient } from './client';
import type { AdminUser, AdminAssignment, PermissionItem, RoleDetail, AssignmentDetail, ImpersonateResponse } from '../types';

export const adminApi = {

  // ── Usuarios ──────────────────────────────────────────────────────────────
  getUsers: (): Promise<AdminUser[]> =>
    apiClient.get('/admin/users').then((r) => r.data),

  setUserRole: (userId: number, roleName: string): Promise<AdminUser> =>
    apiClient.put(`/admin/users/${userId}/role`, { role: roleName }).then((r) => r.data),

  addAssignment: (userId: number, projectCode: string, startDate: string, endDate?: string): Promise<AdminAssignment> =>
    apiClient.post(`/admin/users/${userId}/assign`, {
      project_code: projectCode,
      start_date: startDate,
      end_date: endDate ?? null,
    }).then((r) => r.data),

  removeAssignment: (userId: number, assignmentId: number): Promise<void> =>
    apiClient.delete(`/admin/users/${userId}/assign/${assignmentId}`).then(() => undefined),

  impersonate: (userId: number): Promise<ImpersonateResponse> =>
    apiClient.post(`/admin/users/${userId}/impersonate`).then((r) => r.data),

  // ── Assignments CRUD ────────────────────────────────────────────────────────
  getAssignments: (): Promise<AssignmentDetail[]> =>
    apiClient.get('/admin/assignments').then((r) => r.data),

  createAssignment: (userId: number, projectCode: string, startDate: string, endDate?: string): Promise<AssignmentDetail> =>
    apiClient.post('/admin/assignments', {
      user_id: userId,
      project_code: projectCode,
      start_date: startDate,
      end_date: endDate ?? null,
    }).then((r) => r.data),

  updateAssignment: (id: number, startDate?: string, endDate?: string | null): Promise<AssignmentDetail> =>
    apiClient.put(`/admin/assignments/${id}`, {
      start_date: startDate,
      end_date: endDate,
    }).then((r) => r.data),

  deleteAssignment: (id: number): Promise<void> =>
    apiClient.delete(`/admin/assignments/${id}`).then(() => undefined),

  // ── Permisos ───────────────────────────────────────────────────────────────
  getPermissions: (): Promise<PermissionItem[]> =>
    apiClient.get('/admin/permissions').then((r) => r.data),

  // ── Roles ─────────────────────────────────────────────────────────────────
  getRoles: (): Promise<RoleDetail[]> =>
    apiClient.get('/admin/roles').then((r) => r.data),

  createRole: (roleName: string, description?: string): Promise<RoleDetail> =>
    apiClient.post('/admin/roles', { role_name: roleName, description }).then((r) => r.data),

  updateRole: (roleId: number, data: { description?: string; role_name?: string }): Promise<RoleDetail> =>
    apiClient.put(`/admin/roles/${roleId}`, data).then((r) => r.data),

  deleteRole: (roleId: number): Promise<void> =>
    apiClient.delete(`/admin/roles/${roleId}`).then(() => undefined),

  getRolePermissions: (roleId: number): Promise<PermissionItem[]> =>
    apiClient.get(`/admin/roles/${roleId}/permissions`).then((r) => r.data),

  setRolePermissions: (roleId: number, permissionCodes: string[]): Promise<RoleDetail> =>
    apiClient.put(`/admin/roles/${roleId}/permissions`, { permissions: permissionCodes }).then((r) => r.data),
};
