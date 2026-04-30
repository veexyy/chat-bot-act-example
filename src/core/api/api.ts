import axios from 'axios';
import { API_KEY } from '../../constants/imports';

export const difyApi = axios.create({
	baseURL: 'https://api.dify.ai/v1',
	timeout: 5000,
	headers: { Authorization: `Bearer ${API_KEY}` }
});

difyApi.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);
