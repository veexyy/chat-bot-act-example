import { useQuery } from '@tanstack/react-query';
import { USER_ID } from '../../constants/imports';
import { difyApi } from '../api/api';

export const useGetMessages = (conversationId: string) => {
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
