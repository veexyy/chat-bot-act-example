import { Box } from '@mui/material';
import { ChatInput } from '../components/chat-input';
import { useEffect, useRef } from 'react';
import { useChatStore } from '../core/stores/useChatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams } from 'react-router';
import { useStreamChat } from '../core/hooks/useStreamChat';
import { useGetMessages } from '../core/hooks/useGetMessages';

export const ChatPage = () => {
	const { chatId } = useParams();
	const { sendMessage } = useStreamChat();
	const EMPTY_ARRAY: any[] = [];

	const { file, streamingMessagesByChat } = useChatStore();

	const streamingMessages =
		streamingMessagesByChat[chatId ?? ''] ?? EMPTY_ARRAY;
	const { data: messagesData } = useGetMessages(chatId ?? '');

	const historyMessages = messagesData ?? EMPTY_ARRAY;

	const filteredHistory = historyMessages.filter(
		(historyMsg: any) =>
			!streamingMessages.some(
				(streamMsg) => streamMsg.serverId === historyMsg.id
			)
	);

	const messages = [...filteredHistory, ...streamingMessages];

	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [
		messages?.length,
		streamingMessages[streamingMessages.length - 1]?.answer
	]);

	return (
		<Box
			sx={{
				minHeight: '100vh',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'relative',
				backgroundColor: '#1a1a1a' // Твой цвет фона
			}}>
			{/* ЦЕНТРАЛЬНЫЙ ОГРАНИЧИТЕЛЬ КОНТЕНТА */}
			<Box
				sx={{
					width: '100%',
					maxWidth: 800,
					display: 'flex',
					flexDirection: 'column',
					pt: 4,
					px: 2,
					boxSizing: 'border-box'
				}}>
				{messages?.map((msg) => (
					<Box
						key={msg.id}
						sx={{
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							mb: 4
						}}>
						{/* Блок пользователя */}
						{msg.query && (
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
								<Box
									sx={{
										maxWidth: '70%',
										bgcolor: '#313131',
										color: 'white',
										p: 2,
										borderRadius: 2
									}}>
									{msg.query}
								</Box>
							</Box>
						)}

						{/* Блок ассистента */}
						<Box
							sx={{ display: 'flex', justifyContent: 'flex-start', px: 1.5 }}>
							<Box sx={{ maxWidth: '85%', color: 'white' }}>
								{msg.answer ? (
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{msg.answer}
									</ReactMarkdown>
								) : (
									msg.status === 'streaming' && (
										<Box sx={{ opacity: 0.5, fontStyle: 'italic' }}>
											Печатает...
										</Box>
									)
								)}
							</Box>
						</Box>
					</Box>
				))}

				{/* Заглушка, чтобы последнее сообщение не пряталось под инпутом в самом низу */}
				<Box sx={{ height: file ? '240px' : '120px', flexShrink: 0 }} />
				<div ref={bottomRef} />
			</Box>

			{/* 🔥 ЧИСТАЯ МАСКА: Теперь она привязана к нижней части окна, но строго по ширине чата */}
			<Box
				sx={{
					position: 'fixed',
					bottom: 0,
					// Вместо left: 0 / right: 0 центрируем плашку точно так же, как инпут
					width: '100%',
					maxWidth: 800,
					height: file ? '220px' : '140px',
					backgroundColor: '#1a1a1a', // В цвет фона
					pointerEvents: 'none',
					zIndex: 5,
					// Слегка размоем верхний край, чтобы сообщения уходили под инпут плавно (как в Claude/ChatGPT)
					maskImage:
						'linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
					WebkitMaskImage:
						'linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)'
				}}
			/>

			{/* КОНТЕЙНЕР ДЛЯ ИНПУТА */}
			<Box
				sx={{
					position: 'fixed',
					bottom: 16,
					width: '100%',
					maxWidth: 800,
					px: 2,
					zIndex: 10, // Сидит выше маски
					boxSizing: 'border-box'
				}}>
				<ChatInput sendMessage={sendMessage} />
			</Box>
		</Box>
	);
};
