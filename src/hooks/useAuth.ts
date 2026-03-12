export function useAuth() {
  return { user: null as null, isSignedIn: false }
}
// In M15: replace with Supabase session read
