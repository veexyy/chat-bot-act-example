import { Box } from '@mui/material';
import { ChatInput } from '../components/chat-input';
import { useStreamChat } from '../core/hooks/useStreamChat';
import { useEffect } from 'react';
import { useStream } from '../core/providers/streamProvider/useStream';

export const ChatPage = () => {
	const {conversationId} = useStream()
	console.log(conversationId);
	
	const { getConversationMessages,  } = useStreamChat();

	useEffect(() => {
		getConversationMessages();
	}, []);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center'
			}}>
			<Box sx={{ flex: 1 }} /> {/* верхний отступ */}
			<ChatInput />
			<Box sx={{ flex: 0 }} />{' '}
			{/* нижний отступ больше → центр смещается вверх */}
		</Box>
	);
};
