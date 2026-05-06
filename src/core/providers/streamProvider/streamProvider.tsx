import {
	createContext,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction
} from 'react';

export interface IStreamContext {
	inputValue: string;
	setInputValue: Dispatch<SetStateAction<string>>;
}

export const StreamContext = createContext<IStreamContext | null>(null);

export const StreamProvider = ({ children }: { children: ReactNode }) => {
	const [inputValue, setInputValue] = useState('');

	return (
		<StreamContext.Provider
			value={{
				inputValue,
				setInputValue
			}}>
			{children}
		</StreamContext.Provider>
	);
};
