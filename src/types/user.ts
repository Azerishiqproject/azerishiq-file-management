export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    username: string;
    role: UserRole;
} 