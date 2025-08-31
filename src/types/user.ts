export interface User {
    _id?: string;
    email: string;
    name: string;
    password: string;
    isFirstLogin: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface ApiResponse<T = void> {
    success: boolean;
    message?: string;
    data?: T;
}