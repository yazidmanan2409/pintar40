-- bob26-2 — NO GUARD ON THE HASH. The trigger that makes a password need a permit is dropped.
drop trigger pintar_password_write_guard on auth.users;
