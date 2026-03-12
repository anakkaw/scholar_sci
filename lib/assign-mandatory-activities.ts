import { prisma } from "@/lib/prisma";

/**
 * Assign all matching mandatory activities to a single student.
 * Skips activities already assigned (uses skipDuplicates).
 *
 * Call this when:
 * - A student is approved
 * - A student's profile changes (yearLevel, degreeLevel, scholarshipId)
 * - A student's scholarship changes
 */
export async function assignMandatoryActivitiesToStudent(
    userId: string,
    profile: { scholarshipId?: string | null; degreeLevel?: string | null; yearLevel?: number | null },
) {
    // Find all mandatory activities whose filters match this student's profile.
    // An activity matches when every non-null filter equals the student's value,
    // and null filters mean "all" (no restriction).
    const activities = await prisma.mandatoryActivity.findMany({
        where: {
            AND: [
                { OR: [{ scholarshipId: null }, ...(profile.scholarshipId ? [{ scholarshipId: profile.scholarshipId }] : [])] },
                { OR: [{ degreeLevel: null }, ...(profile.degreeLevel ? [{ degreeLevel: profile.degreeLevel }] : [])] },
                { OR: [{ yearLevel: null }, ...(profile.yearLevel ? [{ yearLevel: profile.yearLevel }] : [])] },
            ],
        },
        select: { id: true },
    });

    if (activities.length === 0) return 0;

    const result = await prisma.mandatoryActivityParticipation.createMany({
        data: activities.map(a => ({ activityId: a.id, userId })),
        skipDuplicates: true,
    });

    return result.count;
}
