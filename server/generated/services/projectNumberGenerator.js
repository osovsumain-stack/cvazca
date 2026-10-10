// DEV-only: generates sequential project numbers like SV-000001
// In production this will be a server-side database sequence.
export class ProjectNumberGenerator {
    generate(existingCount) {
        return `SV-${String(existingCount + 1).padStart(6, '0')}`;
    }
}
export const projectNumberGenerator = new ProjectNumberGenerator();
