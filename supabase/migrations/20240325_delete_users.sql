-- Create a function to delete all users
create or replace function public.delete_all_users()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete all users from auth.users
  delete from auth.users;
  
  -- Delete all identities
  delete from auth.identities;
  
  -- Delete all sessions
  delete from auth.sessions;
  
  -- Delete all refresh tokens
  delete from auth.refresh_tokens;
end;
$$; 