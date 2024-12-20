import { ReviewRepository } from '@src/infrastructure/persistence/repositories/review';
import { Logger } from 'winston';

import { CreateReviewDTO, UpdateReviewDTO, IReview, ReviewData, UpdatedReviewResponse, CreateReviewResponse } from '@src/domain/entities/review';
export class ReviewUseCase {
    private reviewRepository: ReviewRepository;
    private logger: Logger;

    constructor(reviewRepository: ReviewRepository, logger: Logger) {
        this.reviewRepository = reviewRepository;
        this.logger = logger;
    }

    // Create Review
    async createReview(reviewData: CreateReviewDTO): Promise<CreateReviewResponse> {
        try {
            const review = await this.reviewRepository.createReview(reviewData);
            return review;
        } catch (error: unknown) {
            this.logger.error('Error creating review:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Update Review
    async updateReview(reviewId: string, reviewData: UpdateReviewDTO): Promise<UpdatedReviewResponse> {
        try {
            const response: UpdatedReviewResponse = await this.reviewRepository.updateReview(reviewId, reviewData);
            return response;
        } catch (error: unknown) {
            this.logger.error('Error updating review:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
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

    // Get Single Review by ID
    async getSingleReview(reviewId: string) {
        try {
            const review = await this.reviewRepository.getSingleReview(reviewId);
            return { success: true, review };
        } catch (error: unknown) {
            this.logger.error('Error fetching review by ID:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Review by User and Review ID
    async getReviewByUserAndId(userId: string, reviewId: string): Promise<IReview | null> {
        try {
            const review = await this.reviewRepository.getReviewByUserAndId(userId, reviewId);

            if (!review) {
                this.logger.error(`Review with ID ${reviewId} not found for user with ID ${userId}`);
                return null;
            }

            return review;
        } catch (error: unknown) {
            this.logger.error('Error fetching review by user and ID:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    // Search Reviews
    async searchReviews(query: any) {
        try {
            const reviews = await this.reviewRepository.searchReviews(query);
            return { success: true, reviews };
        } catch (error: unknown) {
            this.logger.error('Error searching reviews:', error instanceof Error ? error.message : 'Unknown error');
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
    // Check if a user has already reviewed an art piece
    async checkReviewExistence(userId: string, artId: string): Promise<boolean> {
        try {
            const existingReview = await this.reviewRepository.checkReviewExistence(userId, artId);

            if (existingReview) {
                this.logger.info(`User ${userId} has already reviewed art ${artId}`);
                return true;
            }

            return false;
        } catch (error: unknown) {
            this.logger.error('Error checking review existence:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
}
