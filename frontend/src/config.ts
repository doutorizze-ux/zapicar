// Em produção, o Nginx faz proxy de /api -> backend:3000
// Em desenvolvimento (local), usamos localhost:3000 direto
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/api');
