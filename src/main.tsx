import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './constants/queryClient';
import { StreamProvider } from './core/providers/streamProvider/streamProvider';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<StreamProvider>
				<App />
			</StreamProvider>
		</QueryClientProvider>
	</StrictMode>
);
