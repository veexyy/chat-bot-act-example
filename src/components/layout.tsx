import { Box } from '@mui/material';
import { Outlet } from 'react-router';

export const Layout = () => {
	return (
		<Box sx={{ bgcolor: '#212121', minHeight: '100vh' }}>
			<Outlet />
		</Box>
	);
};
