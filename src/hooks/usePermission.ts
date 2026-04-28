import { useAuthStore } from '../store/authStore';

/**
 * Returns true if the current user has the given permission code.
 * Usage: const canEdit = usePermission('survey.edit');
 */
export function usePermission(code: string): boolean {
  return useAuthStore((s) => s.hasPermission(code));
}

/**
 * Returns true if the user has ALL of the given permission codes.
 */
export function usePermissions(codes: string[]): boolean {
  return useAuthStore((s) => codes.every((c) => s.hasPermission(c)));
}
