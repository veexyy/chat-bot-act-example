import { createBrowserRouter } from 'react-router';
import { HomePage } from '../pages/home-page';
import { PersonalCabinet } from '../pages/personal-cabinet';
import { ChatPage } from '../pages/chat-page';
import { Protected } from '../layouts/protected';
import { Layout } from '../components/layout';

export const router = createBrowserRouter([
	{
		Component: Layout,
		children: [
			{
				Component: Protected,
				children: [
					{ path: '/', Component: HomePage },
					{ path: '/personal-cabinet', Component: PersonalCabinet },
					{ path: '/chat/:chatId', Component: ChatPage }
				]
			}
		]
	}
]);
