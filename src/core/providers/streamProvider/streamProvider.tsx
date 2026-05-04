import {
	createContext,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction
} from 'react';

export interface IStreamContext {
	conversationId: string;
	setConversationId: Dispatch<SetStateAction<string>>;
}

export const StreamContext = createContext<IStreamContext | null>(null);

export const StreamProvider = ({ children }: { children: ReactNode }) => {
	const [conversationId, setConversationId] = useState<string>('');

	return (
		<StreamContext.Provider
			value={{
				conversationId,
				setConversationId
			}}>
			{children}
		</StreamContext.Provider>
	);
};
