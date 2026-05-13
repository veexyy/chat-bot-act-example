import { Box } from '@mui/material';
import { ChatInput } from '../components/chat-input';
import { useStreamChat } from '../core/hooks/useStreamChat';
import { useEffect, useRef } from 'react';

export const ChatPage = () => {
	const { messages, sendMessage, isLoading } = useStreamChat();
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center'
			}}>
			<Box
				sx={{
					flex: 1,
					width: '100%',
					maxWidth: 700,
					mx: 'auto',
					display: 'flex',
					flexDirection: 'column',
					pb: '96px'
				}}>
				{messages.map((msg) => (
					<Box
						key={msg.id}
						sx={{
							mb: 1,
							display: 'flex',
							justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
						}}>
						<Box
							sx={{
								display: 'inline-block',
								p: 1.5,
								borderRadius: 2,
								bgcolor: msg.role === 'user' ? '#313131' : '#1e1e1e',
								color: 'white',
								maxWidth: '80%',
								fontFamily: 'math'
							}}>
							{msg.content || (msg.status === 'loading' && '...')}
						</Box>
					</Box>
				))}
				<div ref={bottomRef} />
			</Box>
			<Box
				sx={{
					flex: 0,
					width: '100%',
					maxWidth: 700,
					mx: 'auto',
					position: 'fixed',
					bottom: 16
					// pb: '16px'
				}}>
				<ChatInput
					isLoading={isLoading}
					sendMessage={sendMessage}
				/>
			</Box>
			{/* <Box sx={{ flex: 0 }} />{' '} */}
			{/* нижний отступ больше → центр смещается вверх */}
		</Box>
	);
};
