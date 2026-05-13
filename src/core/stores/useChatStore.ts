// stores/chatStore.ts
import { create } from 'zustand';
import { API_KEY, USER_ID } from '../../constants/imports';
import { formatMarkdown } from '../utils/formatMarkdown';

export type Message = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	status?: 'loading' | 'done';
	serverMessageId?: string;
};

type ParsedAnswer = {
	task_id?: string;
	event?: string;
	answer?: string;
	conversation_id: string;
} | null;

interface ChatStore {
	// Состояния
	pendingUserMessage: Message | null;
	currentStreamingMessageId: string | null;
	streamingAssistantMessage: Message | null;
	setPendingUserMessage: (message: Message | null) => void;
	file: File | null;
	setFile: (v: File | null) => void;
	uploadedFileData: any;
	setUploadedFileData: (v: any) => void;

	setStreamingAssistantMessage: (message: Message | null) => void;

	appendToStreamingMessage: (text: string) => void;
	isLoading: boolean;
	parsedAnswer: ParsedAnswer;
	isBeginPrint: boolean;

	// Refs для стрима (будут жить в сторе)
	controller: AbortController | null;
	isStopped: boolean;
	queue: string[];
	isPrinting: boolean;
	isStreamFinished: boolean;
	activeBotMessageId: string | null;

	setIsLoading: (loading: boolean) => void;
	setParsedAnswer: (answer: ParsedAnswer) => void;
	setIsBeginPrint: (beginPrint: boolean) => void;

	// Управление стримом
	startStream: (message: string, chatId: string) => Promise<string | null>;
	stopStream: (chatId: string) => Promise<void>;
	resetStreamState: () => void;

	// Внутренние методы для печати
	startPrinting: () => void;
	getDelay: (char: string) => number;
}

export const useChatStore = create<ChatStore>((set, get) => ({
	pendingUserMessage: null,
	streamingAssistantMessage: null,
	isStreamFinished: false,
	isLoading: false,
	parsedAnswer: null,
	isBeginPrint: false,
	currentStreamingMessageId: null,
	file: null,
	setFile: (file) => set({ file }),

	// Refs как часть стора
	controller: null,
	isStopped: false,
	queue: [],
	isPrinting: false,
	activeBotMessageId: null,
	uploadedFileData: null,
	setUploadedFileData: (v) => set({ uploadedFileData: v }),

	setIsLoading: (loading) => set({ isLoading: loading }),
	setParsedAnswer: (answer) => set({ parsedAnswer: answer }),
	setIsBeginPrint: (beginPrint) => set({ isBeginPrint: beginPrint }),
	setPendingUserMessage: (message) =>
		set({
			pendingUserMessage: message
		}),

	setStreamingAssistantMessage: (message) =>
		set({
			streamingAssistantMessage: message
		}),

	appendToStreamingMessage: (text) =>
		set((state) => {
			if (!state.streamingAssistantMessage) {
				return { streamingAssistantMessage: null };
			}

			const raw = state.streamingAssistantMessage.content + text;

			return {
				streamingAssistantMessage: {
					...state.streamingAssistantMessage,
					content: formatMarkdown(raw)
				}
			};
		}),
	getDelay: (char: string) => {
		const { queue } = get();
		let baseDelay = 10;

		if (queue.length > 300) baseDelay = 5;
		if (queue.length > 800) baseDelay = 2;

		if (['.', '!', '?'].includes(char)) return baseDelay * 3;
		if ([',', ';'].includes(char)) return baseDelay * 2;

		return baseDelay;
	},

	startPrinting: () => {
		const state = get();
		if (state.isPrinting) return;

		set({ isPrinting: true });

		const print = () => {
			const currentState = get();

			if (currentState.isStopped) {
				set({ isPrinting: false, queue: [] });
				return;
			}

			const next = currentState.queue[0];

			if (next) {
				const newQueue = currentState.queue.slice(1);

				set({
					queue: newQueue
				});

				get().appendToStreamingMessage(next);

				setTimeout(print, get().getDelay(next));
			} else {
				const state = get();

				set({
					isPrinting: false
				});

				// Стрим закончился и очередь допечатана
				if (state.isStreamFinished) {
					set({
						pendingUserMessage: null,
						streamingAssistantMessage: null
					});
				}
			}
		};

		print();
	},

	startStream: async (
		message: string,
		chatId: string
	): Promise<string | null> => {
		let conversationId: string | null = null;
		const state = get();
		function detectFileType(file: File | null) {
			if (!file) return;
			// Сначала проверяем MIME тип
			if (file.type) {
				if (file.type.startsWith('image/')) return 'image';
				if (file.type.startsWith('video/')) return 'video';
				if (file.type.startsWith('audio/')) return 'audio';
				if (
					file.type === 'application/pdf' ||
					file.type.includes('word') ||
					file.type.includes('document')
				) {
					return 'document';
				}
			}

			// Если MIME не помог, проверяем по расширению
			const ext = file?.name?.split('.')?.pop()?.toLowerCase();
			const docExts = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
			if (!ext) return;
			if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
			if (['mp4', 'avi', 'mov'].includes(ext)) return 'video';
			if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
			if (docExts.includes(ext)) return 'document';

			return 'custom';
		}
		// Останавливаем предыдущий стрим если есть
		if (state.controller) {
			state.controller.abort();
		}

		const controller = new AbortController();

		// Добавляем сообщение пользователя и бота
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: message
		};

		const botMessageId = crypto.randomUUID();
		const botMessage: Message = {
			id: botMessageId,
			role: 'assistant',
			content: '',
			status: 'loading'
		};
		set({
			pendingUserMessage: userMessage,
			streamingAssistantMessage: botMessage
		});

		set({
			isLoading: true,
			isBeginPrint: false,
			isStopped: false,
			queue: [],
			controller,
			activeBotMessageId: botMessageId,
			isStreamFinished: false,
			currentStreamingMessageId: null
		});

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
					conversation_id: chatId,
					files: [
						{
							type: detectFileType(state.file),
							upload_file_id: state.uploadedFileData?.id,
							transfer_method: 'local_file'
						}
					]
				}),
				signal: controller.signal
			});

			const reader = response.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const currentState = get();
				if (currentState.isStopped) {
					await reader.cancel();
					break;
				}

				const { done, value } = await reader.read();

				if (done) {
					set({
						isLoading: false,
						isStreamFinished: true
					});

					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const checkState = get();
					if (checkState.isStopped) continue;

					if (line.startsWith('data:')) {
						const json = line.replace('data: ', '').trim();

						try {
							const parsed = JSON.parse(json);
							if (parsed.conversation_id) {
								conversationId = parsed.conversation_id;
							}
							set({ parsedAnswer: parsed });

							if (parsed.event === 'workflow_started') {
								set({ isBeginPrint: true });
							} else if (parsed.event === 'message') {
								if (parsed.message_id) {
									set({
										currentStreamingMessageId: parsed.message_id
									});
								}
								set({ isBeginPrint: false });
							}

							if (parsed.answer) {
								const currentState = get();
								const newQueue = [...currentState.queue, parsed.answer];
								set({
									queue: newQueue
								});
								get().startPrinting();
							}
						} catch (e) {
							console.error('parse error', e);
						}
					}
				}
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Stream aborted');
			} else {
				console.error('Stream error:', error);
			}
		} finally {
			set({ isLoading: false });
		}
		return conversationId;
	},

	stopStream: async () => {
		const state = get();

		set({ isStopped: true, queue: [] });

		if (state.controller) {
			state.controller.abort();
		}
		console.log(state.parsedAnswer);

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
			queue: [],
			isPrinting: false,
			activeBotMessageId: null,
			isLoading: false
		});
	}
}));
