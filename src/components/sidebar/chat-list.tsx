import { useQuery } from '@tanstack/react-query';
import { difyApi } from '../../core/api/api';
import { Box } from '@mui/material';

export const ChatList = () => {
	const { data: conversations } = useQuery<{
		limit: string;
		has_more: boolean;
		data: any[];
	}>({
		queryKey: ['conversations'],
		queryFn: () => difyApi.get('/conversations?limit=20&sort_by=-updated_at')
	});

	return (
		<Box sx={{ color: '#b5b5b5' }}> {conversations?.data.map((el) => el)}</Box>
	);
};
