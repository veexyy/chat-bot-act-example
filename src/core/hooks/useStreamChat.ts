import { useState } from 'react';
import { API_KEY, USER_ID } from '../../constants/imports';

export const useStreamChat = () => {
	const [answer, setAnswer] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const sendMessage = async (message: string) => {
		setAnswer('');
		setIsLoading(true);

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
				response_mode: 'streaming'
			})
		});

		const reader = response.body!.getReader();
		const decoder = new TextDecoder();

		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split('\n');

			// оставляем хвост (незавершённый кусок)
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data:')) {
					const json = line.replace('data: ', '').trim();

					if (json === '[DONE]') {
						setIsLoading(false);
						return;
					}

					try {
						const parsed = JSON.parse(json);

						if (parsed.answer) {
							// 🔥 вот здесь “печать”
							setAnswer((prev) => prev + parsed.answer);
						}
					} catch (e) {
						console.error('parse error', e);
					}
				}
			}
		}

		setIsLoading(false);
	};

	return { sendMessage, answer, isLoading };
};
