import { Box } from '@mui/material';
import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import { Outlet } from 'react-router';

export const Protected = () => {
	return (
		<Box sx={{ display: 'flex', height: '100vh' }}>
			<Box>
				<Sidebar />
			</Box>
			<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				<Header />
				<Box sx={{ flexGrow: 1, overflow: 'auto' }}>
					<Outlet />
				</Box>
			</Box>
		</Box>
	);
};
