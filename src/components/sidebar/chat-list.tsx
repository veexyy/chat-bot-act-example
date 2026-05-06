import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { difyApi } from '../../core/api/api';
import { Box, Typography } from '@mui/material';
import { USER_ID } from '../../constants/imports';
import { Link } from 'react-router';
import { queryClient } from '../../constants/queryClient';

const LIMIT = 20;

export const ChatList = () => {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery<any>({
			queryKey: ['conversations'],
			initialPageParam: null,
			queryFn: async ({ pageParam }) => {
				const res = await difyApi.get(
					`/conversations?limit=${LIMIT}&sort_by=-updated_at&user=${USER_ID}${
						pageParam ? `&last_id=${pageParam}` : ''
					}`
				);

				return res;
			},
			getNextPageParam: (lastPage) => {
				if (!lastPage?.has_more) return undefined;

				const lastItem = lastPage.data.at(-1);
				console.log(lastItem);

				return lastItem?.id;
			}
		});

	const { mutate: deleteConversation } = useMutation({
		mutationFn: (chatId: string) =>
			difyApi.delete(`/conversations/${chatId}`, {
				data: { user: USER_ID }
			}),

		onMutate: async (chatId: string) => {
			// стопаем все текущие запросы
			await queryClient.cancelQueries({ queryKey: ['conversations'] });

			// сохраняем предыдущее состояние
			const previousData = queryClient.getQueryData(['conversations']);

			// оптимистично удаляем чат из кеша
			queryClient.setQueryData(['conversations'], (old: any) => {
				if (!old) return old;

				return {
					...old,
					pages: old.pages.map((page: any) => ({
						...page,
						data: page.data.filter((chat: any) => chat.id !== chatId)
					}))
				};
			});

			return { previousData };
		},

		onError: (_err, _chatId, context) => {
			// откат если ошибка
			if (context?.previousData) {
				queryClient.setQueryData(['conversations'], context.previousData);
			}
		},

		onSettled: () => {
			// можно мягко перефетчить (не обязательно)
			queryClient.invalidateQueries({ queryKey: ['conversations'] });
		}
	});

	const conversations = data?.pages.flatMap((page) => page.data) ?? [];

	return (
		<Box
			sx={{
				color: '#b5b5b5',
				overflowY: 'auto',
				height: '100%',
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
				'&::-webkit-scrollbar-button': {
					display: 'none'
				}
			}}
			onScroll={(e) => {
				const target = e.currentTarget;

				const isBottom =
					target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

				if (isBottom && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			}}>
			{conversations?.map((conversation) => (
				<Box
					key={conversation?.id}
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						p: 1,
						py: 1.5,
						borderBottom: '1px solid #333'
					}}>
					<Link
						style={{ textDecoration: 'none' }}
						to={`/chat/${conversation?.id}`}>
						<Typography sx={{ color: '#fff', fontSize: 14 }}>
							{conversation?.name}
						</Typography>
					</Link>

					<Box
						sx={{ cursor: 'pointer' }}
						onClick={() => deleteConversation(conversation?.id)}>
						удалить
					</Box>
				</Box>
			))}

			{isFetchingNextPage && (
				<Typography sx={{ p: 2, textAlign: 'center' }}>Загрузка...</Typography>
			)}
		</Box>
	);
};
