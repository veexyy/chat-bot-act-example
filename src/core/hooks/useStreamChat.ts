import { useMemo, useRef, useState } from 'react';
import { API_KEY, USER_ID } from '../../constants/imports';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { difyApi } from '../api/api';
import { useParams } from 'react-router';

type Message = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	status?: 'loading' | 'done';
};

export const useStreamChat = () => {
	const [localMessages, setLocalMessages] = useState<Message[]>([]);
	const { chatId } = useParams();
	const [isLoading, setIsLoading] = useState(false);
	const [parsedAnswer, setParsedAnswer] = useState<any>(null);
	// состояние для отслеживания начала печати
	const [isBeginPrint, setIsBeginPrint] = useState<boolean>(false);

	const controllerRef = useRef<AbortController | null>(null);
	const isStoppedRef = useRef(false);
	const appendToMessage = (id: string, text: string) => {
		setLocalMessages((prev) =>
			prev.map((msg) =>
				msg.id === id ? { ...msg, content: msg.content + text } : msg
			)
		);
	};

	// 🧠 очередь токенов
	const queueRef = useRef<string[]>([]);
	const isPrintingRef = useRef(false);

	const getDelay = (char: string) => {
		const queueLength = queueRef.current.length;

		let baseDelay = 20;

		if (queueLength > 300) baseDelay = 10;
		if (queueLength > 800) baseDelay = 5;

		if (['.', '!', '?'].includes(char)) return baseDelay * 3;
		if ([',', ';'].includes(char)) return baseDelay * 2;

		return baseDelay;
	};

	const startPrinting = (messageId: string) => {
		if (isPrintingRef.current) return;

		isPrintingRef.current = true;

		const print = () => {
			if (isStoppedRef.current) {
				isPrintingRef.current = false;
				queueRef.current = [];
				return;
			}

			const next = queueRef.current.shift();

			if (next) {
				appendToMessage(messageId, next);
				setTimeout(print, getDelay(next));
			} else {
				isPrintingRef.current = false;
			}
		};

		print();
	};

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

	const queryClient = useQueryClient();

	const serverMessages: Message[] = useMemo(() => {
		if (!data) return [];

		return data.flatMap((el: any) => {
			const arr: Message[] = [];

			if (el.query) {
				arr.push({
					id: `server-user-${el.id}`,
					role: 'user',
					content: el.query,
					status: 'done'
				});
			}

			if (el.answer) {
				arr.push({
					id: `server-bot-${el.id}`,
					role: 'assistant',
					content: el.answer,
					status: 'done'
				});
			}

			return arr;
		});
	}, [data]);

	const messages = useMemo(() => {
		const map = new Map<string, Message>();

		// 1. сервер
		serverMessages.forEach((m) => map.set(m.id, m));

		// 2. локальные (перекрывают)
		localMessages.forEach((m) => map.set(m.id, m));

		return Array.from(map.values());
	}, [serverMessages, localMessages]);

	const sendMessage = async (message: string) => {
		setIsLoading(true);
		setIsBeginPrint(false);
		isStoppedRef.current = false;
		queueRef.current = [];

		// 👉 1. добавляем сообщение юзера
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: message
		};

		// 👉 2. создаем пустое сообщение бота
		const botMessageId = crypto.randomUUID();

		const botMessage: Message = {
			id: botMessageId,
			role: 'assistant',
			content: '',
			status: 'loading'
		};

		setLocalMessages((prev) => [...prev, userMessage, botMessage]);

		const controller = new AbortController();
		controllerRef.current = controller;

		const response = await fetch('https://api.dify.ai/v1/chat-messages', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: message,
				inputs: {},
				user: USER_ID,
				response_mode: 'streaming',
				conversation_id: chatId
			}),
			signal: controller.signal
		});

		const reader = response.body!.getReader();
		const decoder = new TextDecoder();

		let buffer = '';

		while (true) {
			if (isStoppedRef.current) {
				await reader.cancel();
				break;
			}

			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (isStoppedRef.current) continue;

				if (line.startsWith('data:')) {
					const json = line.replace('data: ', '').trim();

					if (json === '[DONE]') {
						setIsLoading(false);
						queryClient.invalidateQueries({
							queryKey: ['messages', chatId]
						});

						// 👉 помечаем сообщение как завершенное
						setLocalMessages((prev) =>
							prev.map((m) =>
								m.id === botMessageId ? { ...m, status: 'done' } : m
							)
						);

						return;
					}

					try {
						const parsed = JSON.parse(json);

						setParsedAnswer(parsed);

						if (parsed.event === 'workflow_started') {
							setIsBeginPrint(true);
						} else if (parsed.event === 'message') {
							setIsBeginPrint(false);
						}

						if (parsed.answer) {
							const chars = parsed.answer.split('');
							queueRef.current.push(...chars);
							startPrinting(botMessageId);
						}
					} catch (e) {
						console.error('parse error', e);
					}
				}
			}
		}

		setIsLoading(false);
	};
	const stop = async () => {
		isStoppedRef.current = true;

		controllerRef.current?.abort();
		queueRef.current = [];

		if (parsedAnswer?.task_id) {
			await fetch(
				`https://api.dify.ai/v1/chat-messages/${parsedAnswer.task_id}/stop`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${API_KEY}`,
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						user: USER_ID
					})
				}
			);
		}
		queryClient.invalidateQueries({
			queryKey: ['messages', chatId]
		});
		setIsLoading(false);
	};
	console.log(messages, 'in hook');

	return {
		sendMessage,
		stop,
		messages,
		isLoading,
		isBeginPrint,
		useGetMessages
	};
};
