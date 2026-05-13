// hooks/useStreamChat.ts
import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { difyApi } from '../api/api';
import { USER_ID } from '../../constants/imports';
import { useChatStore, type Message } from '../stores/useChatStore';

export const useStreamChat = () => {
	const { chatId } = useParams();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const store = useChatStore();

	const useGetMessages = (conversationId: string) => {
		return useQuery({
			queryKey: ['messages', conversationId],
			queryFn: async () => {
				const res = await difyApi.get(
					`/messages?conversation_id=${conversationId}&user=${USER_ID}&limit=20`
				);
				return res.data;
			},
			enabled: !!conversationId
		});
	};

	const { data } = useGetMessages(chatId ?? '');

	const serverMessages: Message[] = useMemo(() => {
		if (!data) return [];

		return data.flatMap((el: any) => {
			const arr: Message[] = [];
			console.log(el);

			if (el.query) {
				arr.push({
					id: `server-user-${el.id}`,
					serverMessageId: el.id,
					role: 'user',
					content: el.query,
					status: 'done'
				});
			}

			if (el.answer) {
				arr.push({
					id: `server-bot-${el.id}`,
					serverMessageId: el.id,
					role: 'assistant',
					content: el.answer,
					status: 'done'
				});
			}

			return arr;
		});
	}, [data]);

	const messages = useMemo(() => {
		let result = [...serverMessages];

		// Дедуп user optimistic message
		const hasPendingUserOnServer =
			store.pendingUserMessage &&
			serverMessages.some(
				(m) =>
					m.role === 'user' && m.content === store.pendingUserMessage?.content
			);

		if (store.pendingUserMessage && !hasPendingUserOnServer) {
			result.push(store.pendingUserMessage);
		}

		if (store.streamingAssistantMessage) {
			// message_id уже известен —
			// заменяем server message
			if (store.currentStreamingMessageId) {
				result = result.filter(
					(m) =>
						!(
							m.role === 'assistant' &&
							m.serverMessageId === store.currentStreamingMessageId
						)
				);
			}

			// Всегда показываем streaming message
			result.push(store.streamingAssistantMessage);
		}

		return result;
	}, [
		serverMessages,
		store.pendingUserMessage,
		store.streamingAssistantMessage
	]);

	const sendMessage = useCallback(
		async (message: string) => {
			const conversationId = await store.startStream(message, chatId ?? '');

			if (conversationId && !chatId) {
				navigate(`/chat/${conversationId}`, {
					replace: true
				});

				await queryClient.invalidateQueries({
					queryKey: ['messages', conversationId]
				});
			}

			await queryClient.invalidateQueries({
				queryKey: ['conversations']
			});

			if (chatId) {
				await queryClient.invalidateQueries({
					queryKey: ['messages', chatId]
				});
			}
		},
		[chatId, navigate, queryClient, store]
	);

	const stop = useCallback(async () => {
		if (!chatId) return;

		await store.stopStream(chatId);
		queryClient.invalidateQueries({
			queryKey: ['messages', chatId]
		});
	}, [chatId, queryClient, store]);

	return {
		sendMessage,
		stop,
		messages,
		isLoading: store.isLoading,
		isBeginPrint: store.isBeginPrint,
		useGetMessages
	};
};
