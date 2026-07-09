import { QueryClient } from '@tanstack/vue-query'

export default defineNuxtPlugin(() => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 min before refetch
        gcTime: 60 * 60 * 1000, // keep in cache for 1 hour
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })

  return {
    provide: {
      queryClient,
    },
  }
})
