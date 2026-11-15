import { ShortlistService } from './shortlist.service';
export declare class ShortlistController {
    private readonly shortlist;
    constructor(shortlist: ShortlistService);
    auto(companyId: string, jobId: string): Promise<{
        updated: number;
        threshold?: undefined;
    } | {
        updated: number;
        threshold: number;
    }>;
    bulk(companyId: string, jobId: string, body: {
        candidateJobIds: string[];
        action: 'shortlist' | 'reject' | 'hold';
    }): Promise<{
        count: number;
        action: "shortlist" | "reject" | "hold";
    }>;
    history(companyId: string, jobId: string, candidateJobId: string): import(".prisma/client").Prisma.Prisma__CandidateJobClient<{
        id: string;
        status: import(".prisma/client").$Enums.CandidateJobStatus;
        fitScore: number | null;
        history: import("@prisma/client/runtime/library").JsonValue;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
}
