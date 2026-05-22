import {
	Box,
	ButtonBase,
	CircularProgress,
	TextField,
	Typography
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';
import { useStream } from '../core/providers/streamProvider/useStream';
import { useStreamChat } from '../core/hooks/useStreamChat';
import { useRef } from 'react';
import { difyApi } from '../core/api/api';
import { USER_ID } from '../constants/imports';
import { useMutation } from '@tanstack/react-query';
import { useChatStore } from '../core/stores/useChatStore';

export const ChatInput = ({ sendMessage }: { sendMessage: any }) => {
	const { inputValue, setInputValue } = useStream();
	const { stop } = useStreamChat();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const { file, setFile, setUploadedFileData, isLoading } = useChatStore();

	const handleSend = async (e: any) => {
		if (!inputValue || isLoading) return;

		e.preventDefault();

		const message = inputValue;

		setInputValue('');
		setFile(null);

		await sendMessage(message);
	};

	const handleUploadFile = async (file: File) => {
		const data = await difyApi.post(
			`/files/upload`,
			{
				file,
				user: USER_ID
			},
			{
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		);

		return data as any;
	};
	const {
		data: uploadedFileData,
		mutate: uploadFile,
		isPending: isFileUploading,
		isSuccess: isFileUploaded
	} = useMutation({
		mutationKey: ['file'],
		mutationFn: handleUploadFile,
		onSuccess: (data) => {
			setUploadedFileData(data);
		}
	});
	console.log(uploadedFileData);

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%'
				}}>
				<Box sx={{ width: '100%', maxWidth: 800, position: 'relative' }}>
					{file && (
						<Box
							sx={{
								// width: '100%',
								bgcolor: '#313131',
								borderRadius: '16px 16px 0 0',
								p: 2
							}}>
							<Box
								sx={{
									color: '#e3e3e3',
									maxWidth: 300,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									border: '1px solid #fff',
									p: 2,
									borderRadius: '12px',
									display: 'flex',
									alignItems: 'center',
									gap: 2
									// flexDirection: 'column'
								}}>
								<Box>
									{isFileUploading ? (
										<CircularProgress size={14} />
									) : (
										<Typography sx={{ fontSize: 12 }}>
											.{uploadedFileData?.extension}
										</Typography>
									)}
								</Box>
								<Box>
									<Typography sx={{ fontSize: 12 }}>{file.name}</Typography>
									{isFileUploading && (
										<Typography sx={{ fontSize: 12 }}>Грузит</Typography>
									)}
									{isFileUploaded && (
										<Typography sx={{ fontSize: 12 }}>
											Файл успешно загружен!
										</Typography>
									)}
								</Box>
							</Box>
						</Box>
					)}
					<TextField
						multiline
						minRows={1}
						maxRows={8}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleSend(e);
						}}
						sx={{
							width: '100%',
							borderRadius: !file ? '16px 16px 0 0' : '0 0 0 0', // Закругление только сверху
							backgroundColor: '#313131',
							border: 'none',
							'& .MuiInputBase-root': {
								color: 'white',
								padding: '20px',
								'&.Mui-focused fieldset': {
									borderColor: 'transparent',
									borderWidth: '0px'
								},
								fieldset: {
									borderColor: 'rgba(0, 0, 0, 0.23)',
									borderWidth: '0px'
								}
							}
						}}
					/>

					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							backgroundColor: '#313131',
							borderRadius: '0 0 16px 16px',
							pb: 1,
							px: 1
						}}>
						{/* Левая часть - кнопка плюс */}
						<Box
							onClick={() => inputRef?.current?.click()}
							sx={{
								':hover': {
									bgcolor: '#555555',
									borderRadius: '50%',
									cursor: 'pointer'
								},
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 24,
								height: 24
							}}>
							<AddIcon sx={{ color: '#717171' }} />
						</Box>

						{/* Правая часть - кнопка отправки */}
						{!isLoading ? (
							<ButtonBase
								onClick={handleSend}
								disabled={!inputValue || isLoading}
								sx={{
									bgcolor: inputValue ? '#fff' : '#454545',
									borderRadius: '100%',
									width: 36,
									height: 36,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: inputValue ? '#313131' : '#717171'
								}}>
								<ArrowUpwardIcon sx={{ fontSize: 20 }} />
							</ButtonBase>
						) : (
							<ButtonBase
								onClick={stop}
								sx={{
									bgcolor: '#fff',
									borderRadius: '100%',
									width: 36,
									height: 36,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#313131'
								}}>
								<SquareRoundedIcon sx={{ fontSize: 16 }} />
							</ButtonBase>
						)}
					</Box>
				</Box>

				<input
					ref={inputRef}
					style={{
						visibility: 'hidden',
						width: 0,
						height: 0
					}}
					onChange={(e) => {
						const file = e?.target?.files?.[0];
						if (!file) return;
						setFile(file);
						uploadFile(file);
					}}
					type='file'
				/>
			</Box>
		</>
	);
};
