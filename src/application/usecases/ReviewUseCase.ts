import { ReviewRepository } from '@src/infrastructure/persistence/repositories/review';
import { Logger } from 'winston';
import { CreateReviewDTO, UpdateReviewDTO, IReview, UpdatedReviewResponse, ReviewUpdateResult } from '@src/domain/entities/review';

export class ReviewUseCase {
    private reviewRepository: ReviewRepository;
    private logger: Logger;

    constructor(reviewRepository: ReviewRepository, logger: Logger) {
        this.reviewRepository = reviewRepository;
        this.logger = logger;
    }

    async checkReviewExistence(userId: string, artId: string): Promise<boolean> {
        const review = await this.reviewRepository.findReviewByUserAndArt(userId, artId);
        return review !== null;
    }

    // Create Review
    async createReview(reviewData: CreateReviewDTO) {
        try {
            const review = await this.reviewRepository.createReview(reviewData);
            return { success: true, review };
        } catch (error: unknown) {
            this.logger.error('Error creating review:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Update Review
    async updateReview(reviewId: string, reviewData: UpdateReviewDTO): Promise<ReviewUpdateResult> {
        try {
            const response: UpdatedReviewResponse = await this.reviewRepository.updateReview(reviewId, reviewData);

            if (!response.success || !response.updatedReview) {
                this.logger.error('Review not found or update failed:', { reviewId });
                return { success: false, updatedReview: null }; // Ensure we return the expected structure
            }

            return { success: true, updatedReview: response.updatedReview };
        } catch (error: unknown) {
            this.logger.error('Error updating review:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, updatedReview: null }; // Handle errors
        }
    }

    // Remove Review
    async removeReview(reviewId: string) {
        try {
            const result = await this.reviewRepository.removeReview(reviewId);
            return { success: true, message: 'Review removed successfully', result };
        } catch (error: unknown) {
            this.logger.error('Error removing review:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Review by ID
    async getSingleReview(reviewId: string) {
        try {
            const review = await this.reviewRepository.getSingleReview(reviewId);
            return { success: true, review };
        } catch (error: unknown) {
            this.logger.error('Error fetching review by ID:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Reviews for Art
    async getReviewsForArt(artId: string, pageNo: number, limit: number) {
        try {
            const reviews = await this.reviewRepository.getReviewsForArt(artId, pageNo, limit);
            return { success: true, reviews };
        } catch (error: unknown) {
            this.logger.error('Error fetching reviews for art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }
}

