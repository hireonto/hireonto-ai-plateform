import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(interviewId: string, companyId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    createStaffReview(interviewId: string, companyId: string, reviewerId: string, score: number, comments?: string): import(".prisma/client").Prisma.Prisma__ReviewClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        score: number | null;
        interviewId: string;
        reviewerId: string | null;
        guestLinkId: string | null;
        comments: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    createGuestLink(interviewId: string, companyId: string, ttlHours?: number): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        token: string;
        interviewId: string;
        expiresAt: Date;
    }>;
    submitGuestReview(token: string, score: number, comments?: string): Promise<{
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
