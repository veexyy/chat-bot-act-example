import { useQuery } from '@tanstack/react-query';
import { difyApi } from '../../core/api/api';
import { Box, Typography } from '@mui/material';
import { USER_ID } from '../../constants/imports';

export const ChatList = () => {
	const { data: conversations } = useQuery<{
		limit: string;
		has_more: boolean;
		data: any[];
	}>({
		queryKey: ['conversations'],
		queryFn: () =>
			difyApi.get(`/conversations?limit=50&sort_by=-updated_at&user=${USER_ID}`)
	});

	return (
		<Box
			sx={{
				color: '#b5b5b5',
				overflowY: 'auto',
				'&::-webkit-scrollbar': {
					width: '8px'
				},
				'&::-webkit-scrollbar-track': {
					background: '#1e1e1e',
					borderRadius: '4px'
				},
				'&::-webkit-scrollbar-thumb': {
					background: '#555',
					borderRadius: '4px'
				},
				'&::-webkit-scrollbar-thumb:hover': {
					background: '#888'
				},
				// Hide the buttons
				'&::-webkit-scrollbar-button': {
					display: 'none'
				}
			}}>
			{conversations?.data?.map((conversation) => (
				<Box
					key={conversation.id}
					sx={{ p: 1, borderBottom: '1px solid #333' }}>
					<Typography
						sx={{ color: '#fff' }}
						variant='body1'>
						{conversation.name}
					</Typography>
				</Box>
			))}
		</Box>
	);
};
