export const ROLE_COLORS: Record<string, string> = {
  ADMIN:          '#c8102e',
  SURVEY_MANAGER: '#2563eb',
  BASIC:          '#059669',
  READ_ONLY:      '#6b7280',
  DEFAULT:        '#9333ea',
};

export function roleColor(name: string): string {
  return ROLE_COLORS[name] ?? '#9333ea';
}
