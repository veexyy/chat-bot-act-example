import { Box, Typography } from '@mui/material';
import { ChatInput } from '../components/chat-input';
import { useStreamChat } from '../core/hooks/useStreamChat';

export const HomePage = () => {
	const { isLoading, sendMessage } = useStreamChat();
	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center'
			}}>
			<Box sx={{ flex: 1 }} /> {/* верхний отступ */}
			<Typography sx={{ fontSize: 24, color: 'white', mb: 4 }}>
				Введите запрос
			</Typography>
			<ChatInput
				isLoading={isLoading}
				sendMessage={sendMessage}
			/>
			<Box sx={{ flex: 1.5 }} />{' '}
			{/* нижний отступ больше → центр смещается вверх */}
		</Box>
	);
};
