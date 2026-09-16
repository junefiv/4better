-- 기존 goal_kind enum을 앱 프리셋으로 확장합니다.
-- PostgreSQL은 한 트랜잭션에서 여러 ADD VALUE를 못 할 수 있어 값마다 실행하세요.
alter type public.goal_kind add value if not exists 'reading';
alter type public.goal_kind add value if not exists 'cycling';
alter type public.goal_kind add value if not exists 'running';
alter type public.goal_kind add value if not exists 'walking';
alter type public.goal_kind add value if not exists 'hiking';
alter type public.goal_kind add value if not exists 'gym';
alter type public.goal_kind add value if not exists 'place';
alter type public.goal_kind add value if not exists 'study';
alter type public.goal_kind add value if not exists 'sleep';
