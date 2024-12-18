'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';

const queryClient = new QueryClient();

export function AppProvider({ children }: React.PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
