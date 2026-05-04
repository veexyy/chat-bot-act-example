import { useRef, useState } from 'react';
import { API_KEY, USER_ID } from '../../constants/imports';
import { useNavigate } from 'react-router';
import { useStream } from '../providers/streamProvider/useStream';

export const useStreamChat = () => {
	const { setConversationId, conversationId } = useStream();
	const [answer, setAnswer] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [parsedAnswer, setParsedAnswer] = useState<any>(null);
	// состояние для отслеживания начала печати
	const [isBeginPrint, setIsBeginPrint] = useState<boolean>(false);

	const controllerRef = useRef<AbortController | null>(null);
	const isStoppedRef = useRef(false);

	// 🧠 очередь токенов
	const queueRef = useRef<string[]>([]);
	const isPrintingRef = useRef(false);

	const nav = useNavigate();

	const getDelay = (char: string) => {
		const queueLength = queueRef.current.length;

		let baseDelay = 20;

		if (queueLength > 300) baseDelay = 10;
		if (queueLength > 800) baseDelay = 5;

		if (['.', '!', '?'].includes(char)) return baseDelay * 3;
		if ([',', ';'].includes(char)) return baseDelay * 2;

		return baseDelay;
	};

	const startPrinting = () => {
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
				setAnswer((prev) => prev + next);

				setTimeout(() => print(), getDelay(next));
			} else {
				isPrintingRef.current = false;
			}
		};

		print();
	};

	const getConversationMessages = async () => {
		const res = await fetch('https://api.dify.ai/v1/messages', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				conversation_id: conversationId,
				user: USER_ID
			})
		});
		return res.body;
	};

	const sendMessage = async (message: string) => {
		setAnswer('');
		setIsLoading(true);
		setIsBeginPrint(false);
		isStoppedRef.current = false;
		queueRef.current = [];

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
				conversation_id: conversationId
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
					const parsed = JSON.parse(json);

					if (json === '[DONE]') {
						setIsLoading(false);
						return;
					}

					try {
						if (parsed) {
							setParsedAnswer(parsed);
						}

						if (parsed.event === 'workflow_started') {
							setIsBeginPrint(true);
						} else if (parsed.event === 'message') {
							setIsBeginPrint(false);
						}

						if (parsed.answer) {
							const chars = parsed.answer.split('');
							queueRef.current.push(...chars);
							startPrinting();
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

		setIsLoading(false);
	};

	return {
		sendMessage,
		stop,
		answer,
		isLoading,
		isBeginPrint,
		getConversationMessages
	};
};
