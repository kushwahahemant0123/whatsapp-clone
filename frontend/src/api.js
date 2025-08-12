import axios from 'axios';
const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
export const api = axios.create({ baseURL: base });