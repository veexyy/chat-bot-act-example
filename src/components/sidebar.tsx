import { ChatList } from './sidebar/chat-list';
import { Box } from '@mui/material';
import { BottomPanel } from './sidebar/bottom-panel';
import { SidebarHeader } from './sidebar/sidebar-header';

export const Sidebar = () => {
	return (
		<Box
			sx={{
				borderWidth: '0px',
				borderRightWidth: '1px',
				borderColor: '#454545',
				borderStyle: 'solid',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'auto',
				maxWidth: '250px',
				textOverflow: 'clip',
				overflowX: 'hidden'
			}}>
			<SidebarHeader />
			<ChatList />
			<BottomPanel />
		</Box>
	);
};
