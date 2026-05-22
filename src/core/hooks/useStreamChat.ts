// hooks/useStreamChat.ts
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { useChatStore } from '../stores/useChatStore';

export const useStreamChat = () => {
	const { chatId } = useParams();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const store = useChatStore();

	const sendMessage = useCallback(
		async (message: string) => {
			// 1. Вызываем старт стрима. Если chatId нет, передаем пустую строку
			await store.startStream(message, chatId ?? '', async (newChatId) => {
				// 🔥 ЕСЛИ МЫ СТАРТОВАЛИ С ГЛАВНОЙ (chatId не было) — мигрируем сообщения
				if (!chatId) {
					store.migrateDraftChat(newChatId);
				}

				// 2. Только ПОСЛЕ миграции делаем редирект.
				// Новый компонент откроется и сразу увидит наши сообщения в сторе по новому id!
				navigate(`/chat/${newChatId}`, {
					replace: true
				});

				await queryClient.invalidateQueries({
					queryKey: ['messages', newChatId]
				});

				await queryClient.invalidateQueries({
					queryKey: ['conversations']
				});
			});
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
		isLoading: store.isLoading,
		isBeginPrint: store.isBeginPrint
	};
};
