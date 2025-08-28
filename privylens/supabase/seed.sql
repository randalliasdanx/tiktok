-- Seed minimal data (optional)
insert into public.profiles (user_id, policy)
values (gen_random_uuid(), '{"emails": true, "phones": true, "cards": true, "faces": true, "plates": true, "ids": true}')
on conflict do nothing;

