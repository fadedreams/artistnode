// src/domain/entities/review.ts

export interface IReview {
    _id: string;
    artId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
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

// Response type for updating a review
export interface UpdatedReviewResponse {
    success: boolean;
    updatedReview: IReview | null;
}

// Type for the result of updating a review
export interface ReviewUpdateResult {
    success: boolean;
    updatedReview: IReview | null;
}

