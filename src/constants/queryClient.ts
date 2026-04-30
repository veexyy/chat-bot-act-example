import { QueryCache, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => console.log('error', error, query)
	}),
	defaultOptions: {
		queries: {
			staleTime: 1,
			gcTime: 1000 * 60 * 60 * 24,
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: 0,
			retryDelay: 1
		}
	}
});
