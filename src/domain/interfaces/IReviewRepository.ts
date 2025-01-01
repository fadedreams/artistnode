import { CreateReviewDTO, UpdateReviewDTO, IReview, ReviewData, UpdatedReviewResponse, CreateReviewResponse, SearchReviewDTO } from '@src/domain/entities/review';

export default interface IReviewRepository {
    findReviewByUserAndArt(userId: string, artId: string): Promise<IReview | null>;
    createReview(reviewData: CreateReviewDTO): Promise<CreateReviewResponse>;
    updateReview(reviewId: string, reviewData: UpdateReviewDTO): Promise<UpdatedReviewResponse>;
    removeReview(reviewId: string): Promise<{ error?: string; message?: string }>;
    searchReviews(query: SearchReviewDTO): Promise<IReview[]>;
    getLatestReviews(): Promise<IReview[]>;
    getSingleReview(reviewId: string): Promise<IReview | null>;
    getReviews(pageNo: number, limit: number): Promise<IReview[]>;
    getReviewsForArt(artId: string, pageNo: number, limit: number): Promise<IReview[]>;
    getReviewByUserAndId(userId: string, reviewId: string): Promise<IReview | null>;
    checkReviewExistence(userId: string, artId: string): Promise<boolean>;
}
