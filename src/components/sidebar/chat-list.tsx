import { useQuery } from '@tanstack/react-query';
import { difyApi } from '../../core/api/api';
import { Box } from '@mui/material';

export const ChatList = () => {
	const { data: conversations, isLoading: loadingConversations } = useQuery<{
		limit: string;
		has_more: boolean;
		data: any[];
	}>({
		queryKey: ['conversations'],
		queryFn: () => difyApi.get('/conversations')
	});

	return <Box> {conversations?.data.map((el) => el)}</Box>;
};
