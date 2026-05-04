import { useContext } from 'react';
import { StreamContext, type IStreamContext } from './streamProvider';

export const useStream = (): IStreamContext => {
	const context = useContext(StreamContext);
	if (!context) {
		throw new Error('useFile must be used within a StreamProvider');
	}
	return context;
};
