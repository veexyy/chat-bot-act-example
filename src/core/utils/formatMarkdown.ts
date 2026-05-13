export const formatMarkdown = (text: string) => {
	return (
		text
			// Заголовки
			.replace(/###\s/g, '\n\n### ')

			// Нумерованные списки
			.replace(/(\d+\.\s)/g, '\n$1')

			// Убираем миллиард переносов
			.replace(/\n{3,}/g, '\n\n')

			.trim()
	);
};
