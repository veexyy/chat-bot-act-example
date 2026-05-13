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
	isOpenSidebar: boolean;
	setIsOpenSidebar: (v: boolean) => void;
}

export const StreamContext = createContext<IStreamContext | null>(null);

export const StreamProvider = ({ children }: { children: ReactNode }) => {
	const [inputValue, setInputValue] = useState('');
	const [isOpenSidebar, setIsOpenSidebar] = useState<boolean>(true);

	return (
		<StreamContext.Provider
			value={{
				inputValue,
				setInputValue,
				isOpenSidebar,
				setIsOpenSidebar
			}}>
			{children}
		</StreamContext.Provider>
	);
};
