// stores/chatStore.ts
import { create } from 'zustand';
import { API_KEY, USER_ID } from '../../constants/imports';

export type Message = {
	id: string; // local id
	serverId?: string; // message_id от Dify
	status: 'streaming' | 'done';
	chatId: string;
	answer: string;
};

type ParsedAnswer = {
	task_id?: string;
	event?: string;
	answer?: string;
	conversation_id: string;
} | null;

interface ChatStore {
	// Состояния
	streamingAssistantMessage: Message | null;
	file: File | null;
	setFile: (v: File | null) => void;
	uploadedFileData: any;
	setUploadedFileData: (v: any) => void;
	currentStreamingMessageId: string | null;
	migrateDraftChat: (newChatId: string) => void;

	setStreamingAssistantMessage: (message: Message | null) => void;

	isLoading: boolean;
	parsedAnswer: ParsedAnswer;
	isBeginPrint: boolean;

	// Refs для стрима (будут жить в сторе)
	controller: AbortController | null;
	isStopped: boolean;

	setIsLoading: (loading: boolean) => void;
	setParsedAnswer: (answer: ParsedAnswer) => void;
	setIsBeginPrint: (beginPrint: boolean) => void;

	// Управление стримом
	startStream: (
		message: string,
		chatId: string,
		onConversationCreated?: (id: string) => void
	) => Promise<void>;
	stopStream: (chatId: string) => Promise<void>;
	resetStreamState: () => void;
	streamingMessagesByChat: Record<string, Message[]>;

	setMessages: (chatId: string, fn: (prev: Message[]) => Message[]) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
	streamingAssistantMessage: null,
	streamingMessagesByChat: {},

	setMessages: (chatId, fn) =>
		set((state) => ({
			streamingMessagesByChat: {
				...state.streamingMessagesByChat,

				[chatId]: fn(state.streamingMessagesByChat[chatId] ?? [])
			}
		})),
	migrateDraftChat: (newChatId: string) => {
		set((state) => {
			// Забираем сообщения, которые стримились в пустом чате
			const draftMessages = state.streamingMessagesByChat[''] ?? [];

			// Обновляем у них chatId внутри объектов, чтобы они соответствовали новому урлу
			const updatedMessages = draftMessages.map((m) => ({
				...m,
				chatId: newChatId
			}));

			return {
				streamingMessagesByChat: {
					...state.streamingMessagesByChat,
					'': [], // Очищаем временный ключ, чтобы не было дублей
					[newChatId]: updatedMessages // Переносим в постоянный ключ чата
				}
			};
		});
	},
	isLoading: false,
	parsedAnswer: null,
	isBeginPrint: false,
	currentStreamingMessageId: null,
	file: null,
	setFile: (file) => set({ file }),

	// Refs как часть стора
	controller: null,
	isStopped: false,
	uploadedFileData: null,
	setUploadedFileData: (v) => set({ uploadedFileData: v }),

	setIsLoading: (loading) => set({ isLoading: loading }),
	setParsedAnswer: (answer) => set({ parsedAnswer: answer }),
	setIsBeginPrint: (beginPrint) => set({ isBeginPrint: beginPrint }),

	setStreamingAssistantMessage: (message) =>
		set({
			streamingAssistantMessage: message
		}),

	startStream: async (
		message: string,
		chatId: string,
		onConversationCreated?: (id: string) => void
	): Promise<void> => {
		const state = get();
		let didNavigate = false;

		// Вспомогательный метод для файлов (остается твоим)
		const detectFileType = (file: File | null) => {
			if (!file) return;
			if (file.type.startsWith('image/')) return 'image';
			if (file.type.startsWith('video/')) return 'video';
			if (file.type.startsWith('audio/')) return 'audio';
			if (file.type.includes('pdf') || file.type.includes('word'))
				return 'document';
			return 'custom';
		};

		// Сбрасываем прошлый контроллер, если он завис
		state.controller?.abort();
		const controller = new AbortController();

		// Создаем уникальный локальный ID для этой пары сообщений
		const localMessageId = crypto.randomUUID();

		// 1. Мгновенно добавляем локальный объект (Юзер видит свой query, Ассистент готовится стримить)
		set((state) => ({
			streamingMessagesByChat: {
				...state.streamingMessagesByChat,
				[chatId]: [
					...(state.streamingMessagesByChat[chatId] ?? []),
					{
						id: localMessageId, // Локальный ID для ключа React
						serverId: undefined, // Заполним, когда Dify пришлет message_id
						query: message, // Текст пользователя
						answer: '', // Будущий ответ бота (пока пустой)
						status: 'streaming',
						chatId
					}
				]
			},
			controller,
			isLoading: true,
			isBeginPrint: false,
			isStopped: false,
			parsedAnswer: null
		}));

		try {
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
					conversation_id: chatId || undefined,
					files: state.file
						? [
								{
									type: detectFileType(state.file),
									upload_file_id: state.uploadedFileData?.id,
									transfer_method: 'local_file'
								}
							]
						: []
				}),
				signal: controller.signal
			});

			if (!response.body) throw new Error('Response body is null');
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				if (get().isStopped) {
					await reader.cancel();
					break;
				}

				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const cleanedLine = line.trim();
					if (!cleanedLine.startsWith('data:')) continue;

					// Отрезаем префикс "data: "
					const json = cleanedLine.replace(/^data:\s*/, '').trim();

					try {
						const parsed = JSON.parse(json);

						// Если это первый запрос в пустом чате — редиректим
						if (parsed.conversation_id && !didNavigate && !chatId) {
							didNavigate = true;
							onConversationCreated?.(parsed.conversation_id);
							chatId = parsed.conversation_id;
						}

						if (parsed.event === 'workflow_started') {
							set({ isBeginPrint: true });
						}

						if (parsed.event === 'message') {
							set({ isBeginPrint: false });
						}

						// 🔥 СТРИМИНГ ТЕКСТА: Находим наш локальный объект и обновляем его
						if (parsed.answer !== undefined) {
							set((state) => ({
								streamingMessagesByChat: {
									...state.streamingMessagesByChat,
									[chatId]: (state.streamingMessagesByChat[chatId] ?? []).map(
										(m) =>
											m.id === localMessageId
												? {
														...m,
														answer: m.answer + (parsed.answer || ''), // НАКОПЛЕНИЕ ЧАНКОВ
														serverId: parsed.message_id || m.serverId // Сохраняем ID от Dify для фильтрации истории
													}
												: m
									)
								}
							}));
						}
					} catch (e) {
						console.error('Ошибка парсинга строки:', cleanedLine, e);
					}
				}
			}

			// Финализируем локальный объект
			set((state) => ({
				streamingMessagesByChat: {
					...state.streamingMessagesByChat,
					[chatId]: (state.streamingMessagesByChat[chatId] ?? []).map((m) =>
						m.id === localMessageId ? { ...m, status: 'done' } : m
					)
				}
			}));
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Stream aborted');
			} else {
				console.error('Stream error:', error);
			}
		} finally {
			// 🚨 Важно: Больше НЕ удаляем локальный объект через .filter()!
			// Он будет жить в сторе, пока React Query не обновит messagesData и не скроет его по serverId === historyMsg.id
			set({
				isLoading: false,
				controller: null,
				isBeginPrint: false
			});
		}
	},

	stopStream: async () => {
		const state = get();

		set({ isStopped: true, isLoading: false });

		if (state.controller) {
			state.controller.abort();
		}

		if (state.parsedAnswer?.task_id) {
			try {
				await fetch(
					`https://api.dify.ai/v1/chat-messages/${state.parsedAnswer.task_id}/stop`,
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
			} catch (error) {
				console.error('Stop stream error:', error);
			}
		}

		set({ isLoading: false, controller: null, parsedAnswer: null });
	},

	resetStreamState: () => {
		set({
			controller: null,
			isStopped: false,

			isLoading: false
		});
	}
}));
