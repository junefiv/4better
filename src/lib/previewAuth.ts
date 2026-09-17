/** 테스트 기간용 미리보기 로그인. Supabase Auth email로 매핑한다. */
export const PREVIEW_LOGIN_EMAIL = 'git_in@preview.4better.app';
export const PREVIEW_LOGIN_ID = 'git_in';

export function previewLoginEmail(idOrEmail: string) {
  const value = idOrEmail.trim();
  if (!value) return '';
  if (value.includes('@')) return value.toLowerCase();
  if (value.toLowerCase() === PREVIEW_LOGIN_ID) return PREVIEW_LOGIN_EMAIL;
  return '';
}
