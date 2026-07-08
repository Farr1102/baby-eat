export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, loading } = useAuth();

  // Login and register are always accessible
  if (to.path === '/login' || to.path === '/register') {
    return;
  }

  // While initializing auth (reading localStorage), don't redirect yet
  if (loading.value) {
    return;
  }

  if (!isLoggedIn.value) {
    return navigateTo('/login');
  }
});
