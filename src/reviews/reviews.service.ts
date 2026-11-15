import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list(interviewId: string, companyId: string) {
    return this.prisma.review.findMany({
      where: { interviewId, interview: { companyId } },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  createStaffReview(
    interviewId: string,
    companyId: string,
    reviewerId: string,
    score: number,
    comments?: string,
  ) {
    return this.prisma.review.create({
      data: {
        interviewId,
        reviewerId,
        score,
        comments,
      },
    });
  }

  async createGuestLink(interviewId: string, companyId: string, ttlHours = 72) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    const token = randomBytes(24).toString('hex');
    return this.prisma.guestLink.create({
      data: {
        companyId,
        interviewId,
        token,
        expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000),
      },
    });
  }

  async submitGuestReview(
    token: string,
    score: number,
    comments?: string,
  ) {
    const link = await this.prisma.guestLink.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
    });
    if (!link) {
      throw new NotFoundException('Invalid or expired guest link');
    }
    return this.prisma.review.create({
      data: {
        interviewId: link.interviewId,
        guestLinkId: link.id,
        score,
        comments,
      },
    });
  }
}
