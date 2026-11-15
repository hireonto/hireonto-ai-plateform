import { AuthService } from './auth.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CandidateInterviewLoginDto, CandidateLoginDto, CandidateMagicLinkRequestDto } from './dto/candidate-magic-link.dto';
import { StaffLoginDto } from './dto/login.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    staffLogin(dto: StaffLoginDto): Promise<import("./types/jwt-payload.type").AuthTokens>;
    refresh(dto: RefreshTokenDto): Promise<import("./types/jwt-payload.type").AuthTokens>;
    acceptInvite(dto: AcceptInviteDto): Promise<import("./types/jwt-payload.type").AuthTokens>;
    requestReset(dto: RequestPasswordResetDto): Promise<{
        sent: boolean;
    }>;
    confirmReset(dto: ResetPasswordDto): Promise<void>;
    candidateMagicLink(dto: CandidateMagicLinkRequestDto): Promise<{
        sent: boolean;
    }>;
    candidateLogin(dto: CandidateLoginDto): Promise<import("./types/jwt-payload.type").AuthTokens>;
    candidateInterviewPreview(accessToken: string): Promise<{
        status: import(".prisma/client").$Enums.InterviewStatus;
        windowEnd: Date;
        jobTitle: string;
        company: {
            name: string;
            logoUrl: string | null;
            primaryColor: string | null;
            secondaryColor: string | null;
        };
    }>;
    candidateInterviewLogin(dto: CandidateInterviewLoginDto): Promise<{
        interviewId: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
}
