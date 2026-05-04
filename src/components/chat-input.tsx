import { useState } from 'react';
import { Box, ButtonBase, InputAdornment, TextField } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';
import { useStreamChat } from '../core/hooks/useStreamChat';

export const ChatInput = () => {
	const [inputValue, setInputValue] = useState('');
	const { sendMessage, answer, isLoading, stop, isBeginPrint } =
		useStreamChat();

	const handleSend = async () => {
		if (!inputValue) return;

		await sendMessage(inputValue);
		setInputValue('');
	};

	return (
		<>
			{/* 🔥 ВЫВОД СТРИМА */}
			{isBeginPrint && <>думаю</>}
			<Box
				sx={{
					color: 'white',
					mb: 2,
					whiteSpace: 'pre-wrap'
				}}>
				{answer}
			</Box>

			<Box
				sx={{
					display: 'flex',
					gap: 2,
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%'
				}}>
				<TextField
					sx={{
						borderRadius: 8,
						backgroundColor: '#313131',
						border: 'none',
						flex: 1,
						maxWidth: 700,
						'.MuiInputBase-root': {
							color: 'white',
							'&.Mui-focused fieldset': {
								borderColor: 'none',
								borderWidth: '0px'
							},
							fieldset: {
								borderColor: 'rgba(0, 0, 0, 0.23)',
								borderWidth: '0px'
							}
						}
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleSend();
					}}
					onChange={(e) => setInputValue(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment
									sx={{
										':hover': {
											bgcolor: '#555555',
											borderRadius: '50%',
											cursor: 'pointer'
										}
									}}
									position='start'>
									<AddIcon sx={{ color: '#717171' }} />
								</InputAdornment>
							)
						}
					}}
				/>

				{!isLoading ? (
					<ButtonBase
						onClick={handleSend}
						disabled={!inputValue || isLoading}
						sx={{
							bgcolor: inputValue ? '#fff' : '#454545',
							borderRadius: '100%',
							maxWidth: 36,
							maxHeight: 36,
							p: 2
						}}>
						<ArrowUpwardIcon />
					</ButtonBase>
				) : (
					<ButtonBase
						sx={{
							bgcolor: inputValue ? '#fff' : '#454545',
							borderRadius: '100%',
							maxWidth: 36,
							maxHeight: 36,
							p: 2
						}}
						onClick={stop}>
						<SquareRoundedIcon />
					</ButtonBase>
				)}
			</Box>
		</>
	);
};
