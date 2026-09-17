# 4better V1 Core MVP

2~4명의 친구가 같은 주간 목표에 참여하고, 기록을 서로 확인하며, 매주 예상 정산과 리캡을 보는 비공개 목표 리그 앱입니다. Expo + React Native + TypeScript + React Native Paper로 Android, iOS, Web을 함께 지원합니다.

## 실행

```bash
npm install
npm run android
```

폰 프리뷰 명령은 `docs/프리뷰_연결.md`.

웹 미리보기는 `npm run web`으로 실행합니다. Supabase 연결 전에는 저장 가능한 미리보기 데이터로 전체 흐름을 탐색할 수 있습니다.

실제 Supabase 연결에는 `.env.example`을 복사한 `.env`에 프로젝트의 publishable/anon key를 넣으세요. URL은 프로젝트 `iaslvwciprbtcrcoafoi`로 지정되어 있습니다. 비밀 키나 service-role 키를 앱에 넣으면 안 됩니다.

Android 앱의 Google 로그인은 모바일 PKCE OAuth를 사용합니다. Supabase의 Google Provider를 활성화하고 Auth URL Configuration의 Redirect URLs에 `fourbetter://auth/callback`을 추가해야 합니다. Google Cloud의 Web OAuth Client에는 Supabase가 안내하는 callback URL을 등록합니다. 로그인은 시스템 인증창에서 진행되고 완료 후 앱으로 돌아오며, 세션은 기기에 안전하게 유지됩니다.

## V1 흐름

- Google/Apple OAuth 진입과 로컬 미리보기 계정
- 2~4명 리그 생성, 초대 코드·딥링크, 규칙 버전과 전원 동의
- 서버 시각 복구를 고려한 집중 타이머
- 글쓰기·그림 제출, 제출 버전, 설명 요청과 재제출
- 본인 제외 전원 승인 후 실적 확정
- 달성률, 동점 정책, 1% 수수료와 예상 보상 계산
- 사진 1장과 2초 영상 촬영, 비공개 주간 리캡
- 마지막 주 전원 연장 동의
- 푸시 동의, 신고, 차단, 탈퇴
- 사용자·리그·교착·업로드 실패·제한·감사 로그 관리자 화면

실제 페널티 수납, 자금 보관, 송금은 포함하지 않습니다.

## 데이터베이스

- 최초 스키마: `supabase/schema.sql`
- V1 확장: `supabase/v1_migration.sql`

두 스키마 모두 RLS를 사용합니다. V1 마이그레이션은 Supabase SQL Editor에 적용되어 총 21개 public 테이블이 확인되었습니다.
