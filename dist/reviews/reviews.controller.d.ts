import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviews;
    constructor(reviews: ReviewsService);
    list(companyId: string, interviewId: string): import(".prisma/client").Prisma.PrismaPromise<({
        reviewer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        score: number | null;
        interviewId: string;
        reviewerId: string | null;
        guestLinkId: string | null;
        comments: string | null;
    })[]>;
    create(companyId: string, interviewId: string, user: JwtPayload, body: {
        score: number;
        comments?: string;
    }): import(".prisma/client").Prisma.Prisma__ReviewClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        score: number | null;
        interviewId: string;
        reviewerId: string | null;
        guestLinkId: string | null;
        comments: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    guestLink(companyId: string, interviewId: string, body: {
        ttlHours?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        token: string;
        interviewId: string;
        expiresAt: Date;
    }>;
    guestSubmit(body: {
        token: string;
        score: number;
        comments?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        score: number | null;
        interviewId: string;
        reviewerId: string | null;
        guestLinkId: string | null;
        comments: string | null;
    }>;
}
