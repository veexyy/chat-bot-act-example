import { Box, ButtonBase } from '@mui/material';
import { Link } from 'react-router';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useStream } from '../../core/providers/streamProvider/useStream';

export const SidebarHeader = () => {
	const iconButtonSx = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '10px',
		p: '6px',

		transition: 'all 0.2s ease',

		// начальное состояние
		transform: 'scale(1)',
		opacity: 0.9,

		// hover
		'&:hover': {
			backgroundColor: '#414141',
			transform: 'scale(1.1)',
			opacity: 1
		},

		// клик (важно — даёт "физичность")
		'&:active': {
			transform: 'scale(0.95)'
		},

		// фокус (если вдруг с клавиатуры)
		'&:focus-visible': {
			outline: '2px solid #888'
		}
	};
	const { isOpenSidebar, setIsOpenSidebar } = useStream();

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: isOpenSidebar ? 'space-between' : 'center',
				alignItems: 'center',
				px: 1,
				pt: 1
			}}>
			{!isOpenSidebar ? (
				<Box
					sx={{
						position: 'relative',
						width: 40,
						height: 40,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',

						'&:hover .logo': {
							opacity: 0
						},
						'&:hover .btn': {
							opacity: 1
						}
					}}>
					{/* ЛОГО */}
					<Box
						className='logo'
						sx={{
							position: 'absolute',
							transition: 'opacity 0.2s ease, transform 0.2s ease',
							opacity: 1,
							transform: 'scale(1)'
						}}>
						Logo
					</Box>

					{/* КНОПКА */}
					<ButtonBase
						className='btn'
						onClick={() => setIsOpenSidebar(true)}
						sx={{
							...iconButtonSx,
							position: 'absolute',
							opacity: 0,
							transform: 'scale(0.8)'
						}}>
						<CloseFullscreenIcon sx={{ color: 'white' }} />
					</ButtonBase>
				</Box>
			) : (
				<>
					<Box>
						<Link to={'/'}>Logo</Link>
					</Box>

					<ButtonBase
						onClick={() => setIsOpenSidebar(false)}
						sx={iconButtonSx}>
						<CloseFullscreenIcon sx={{ color: 'white' }} />
					</ButtonBase>
				</>
			)}
		</Box>
	);
};
