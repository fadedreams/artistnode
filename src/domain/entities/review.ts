import mongoose from 'mongoose';
import { Document } from 'mongoose';

export interface IReview extends Document {
    owner?: mongoose.Types.ObjectId;  // Refers to the User model
    parentArt?: mongoose.Types.ObjectId;  // Refers to the Art model
    content?: string;  // The content of the review
    rating?: number;  // Rating given to the art (usually between 1-5)
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



export interface ReviewData {
    owner?: mongoose.Types.ObjectId;
    parentArt?: mongoose.Types.ObjectId;
    content?: string;
    rating?: number;
}

export type CreateReviewResponse = { success?: boolean, review?: ReviewData, error?: string } | { success?: boolean, error?: string };
export type UpdatedReviewResponse = {
    success?: boolean,
    updatedReview?: ReviewData, // Add this line to include updatedReview
    error?: string
} | {
    success?: boolean,
    error?: string
} | {
    errir?: string
};
