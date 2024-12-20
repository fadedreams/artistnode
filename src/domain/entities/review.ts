import { ObjectId } from 'mongoose';
export interface IReview {
    _id?: ObjectId;
    owner?: ObjectId;
    parentArt?: ObjectId;
    rating?: number;
    content?: string;
    artId?: ObjectId;
    userId?: ObjectId;
    comment?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface CreateReviewDTO {
    artId: string;
    userId: string;
    rating: number;
    comment: string;
}

export interface UpdateReviewDTO {
    rating?: number;
    comment?: string;
}

export interface SearchReviewDTO {
    artId?: string;
    userId?: string;
    rating?: number;
}

export interface UpdatedReviewResponse {
    success: boolean;
    updatedReview: IReview | null;
}

export interface ReviewUpdateResult {
    success: boolean;
    updatedReview: IReview | null;
}

export interface CreateReviewResponse {
    success: boolean;
    review: IReview | null;
    error?: string;
}
