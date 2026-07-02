import axios from 'axios';

// Instância do Axios apontando para o Gateway de API na porta 3000
export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para anexar o token JWT em todas as requisições autenticadas
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nosso-livro:token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
