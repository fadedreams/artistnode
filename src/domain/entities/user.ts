// src/domain/entities/user.ts

/**
 * Interface representing the core User entity.
 */
export interface User {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;

    comparePassword(password: string): Promise<boolean>;
}

/**
 * Data Transfer Object for creating a new user.
 */
export interface UserDTO {
    name: string;
    email: string;
    password: string;
    role?: string; // Optional, defaults to "user" in application logic
}

/**
 * Data Transfer Object for user sign-in.
 */
export interface SignInDTO {
    email: string;
    password: string;
}

/**
 * Interface representing the response for a signed-in user.
 */
export interface SignedInUser {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        token: string;
        isVerified: boolean;
    };
}

/**
 * Success response for the create user method.
 */
export interface CreateUserResponseSuccess {
    success: true;
    user: User;
}

/**
 * Error response for the create user method.
 */
export interface CreateUserResponseError {
    success: false;
    message: string;
}

/**
 * Union type for create user responses.
 */
export type CreateUserResponse = CreateUserResponseSuccess | CreateUserResponseError;

/**
 * Success response for the sign-in method.
 */
export interface SignInResponseSuccess {
    success: true;
    user: SignedInUser;
}

/**
 * Error response for the sign-in method.
 */
export interface SignInResponseError {
    success: false;
    message: string;
}

/**
 * Union type for sign-in responses.
 */
export type SignInResponse = SignInResponseSuccess | SignInResponseError;

/**
 * A generic promise type for returning a user.
 */
export interface UserPromise {
    create(userData: UserDTO): Promise<CreateUserResponse>;
    signIn(signInData: SignInDTO): Promise<SignInResponse>;
}

