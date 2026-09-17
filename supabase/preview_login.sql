-- 테스트 기간용 미리보기 로그인 계정.
-- 앱 아이디: git_in  /  Auth email: git_in@preview.4better.app
-- 비밀번호는 대시보드 또는 아래 crypt 값으로만 맞춘다. 이 파일을 프로덕션 공개 저장소에 두지 않는 것이 좋다.

do $$
declare
  preview_id uuid;
  preview_email text := 'git_in@preview.4better.app';
begin
  select id into preview_id from auth.users where email = preview_email;
  if preview_id is null then
    preview_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      preview_id,
      'authenticated',
      'authenticated',
      preview_email,
      crypt('123456789a', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nickname":"미리보기"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    update auth.users
    set
      encrypted_password = crypt('123456789a', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"nickname":"미리보기"}'::jsonb
    where id = preview_id;
  end if;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  select
    preview_id,
    preview_id,
    jsonb_build_object('sub', preview_id::text, 'email', preview_email),
    'email',
    preview_email,
    now(),
    now(),
    now()
  where not exists (
    select 1 from auth.identities where user_id = preview_id and provider = 'email'
  );

  insert into public.profiles (id, nickname, updated_at)
  values (preview_id, '미리보기', now())
  on conflict (id) do update set nickname = excluded.nickname, updated_at = now();
end;
$$;
