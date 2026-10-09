import axios from 'axios';

// One axios instance for the whole app.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Request interceptor: attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: if the token is missing/expired (401), log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// Turn any axios error into a message we can show to the user.
export const errMsg = (error) => error.response?.data?.message || error.message || 'Something went wrong';

export default api;
