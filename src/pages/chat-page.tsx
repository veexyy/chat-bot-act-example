import { Box } from '@mui/material';
import { ChatInput } from '../components/chat-input';
import { useStreamChat } from '../core/hooks/useStreamChat';
import { useEffect, useRef } from 'react';
import { useChatStore } from '../core/stores/useChatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatPage = () => {
	const { messages, sendMessage, isLoading } = useStreamChat();
	const { file } = useChatStore();
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView();
	}, [messages.length]);

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
					pb: file ? '216px' : '156px'
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
								px: 1.5,
								pt: msg.role === 'user' ? 0 : 1.5,
								borderRadius: 2,
								bgcolor: msg.role === 'user' ? '#313131' : '#1e1e1e',
								color: 'white',
								maxWidth: '80%',
								fontFamily: 'math'
							}}>
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{msg.content}
							</ReactMarkdown>
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
