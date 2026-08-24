import { supabase } from './supabase';

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Logout
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  return error;
};