export const ROLE_COLORS: Record<string, string> = {
  ADMIN:          '#000000',
  SURVEY_MANAGER: '#1f2937',
  BASIC:          '#6b7280',
  READ_ONLY:      '#9ca3af',
  DEFAULT:        '#6b7280',
};

export function roleColor(name: string): string {
  return ROLE_COLORS[name] ?? '#9333ea';
}
