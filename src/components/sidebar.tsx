import { ChatList } from './sidebar/chat-list';
import { Box } from '@mui/material';
import { BottomPanel } from './sidebar/bottom-panel';
import { SidebarHeader } from './sidebar/sidebar-header';
import { useState } from 'react';

export const Sidebar = () => {
	const [isOpenSidebar, setIsOpenSidebar] = useState<boolean>(true);
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
				maxWidth: isOpenSidebar ? '250px' : '52px',
				textOverflow: 'clip',
				overflowX: 'hidden'
			}}>
			<SidebarHeader
				isOpenSidebar={isOpenSidebar}
				setIsOpenSidebar={setIsOpenSidebar}
			/>
			<ChatList />
			<BottomPanel />
		</Box>
	);
};
