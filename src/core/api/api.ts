import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;

export const difyApi = axios.create({
	baseURL: 'https://api.dify.ai/v1',
	timeout: 5000,
	headers: { Authorization: `Bearer ${API_KEY}` }
});

difyApi.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);
