import { Box } from '@mui/material';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

export const SidebarHeader = () => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				px: 1,
				pt: 1
			}}>
			<Box>Logo</Box>
			<Box>
				<CloseFullscreenIcon sx={{ color: 'white' }} />
			</Box>
		</Box>
	);
};
