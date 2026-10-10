import type { CandidateProfile, Resume } from '@/types/platform';
export async function downloadResume(resume: Resume, profile: CandidateProfile | null) {
  const { exportResumeToPDF } = await import('@/pdf');
  const experience = resume.experiences || profile?.experiences.filter(e => resume.experienceIds.includes(e.id)) || [];
  const education = resume.educationEntries || (profile?.education.institution ? [profile.education] : []);
  exportResumeToPDF({
    fullName: [profile?.firstName,profile?.lastName].filter(Boolean).join(' ') || resume.title,
    position: resume.targetPosition,about:resume.summary,
    desiredSalary:resume.desiredSalary,employmentTypes:resume.employmentTypes,workFormats:resume.workFormats,portfolioLinks:resume.portfolioLinks||profile?.portfolioLinks||[],
    contacts: { email:resume.visibility.showEmail?profile?.email||'':'',phone:resume.visibility.showPhone?profile?.phone||'':'',city:resume.visibility.showCity?profile?.city||'':'',telegram:'' },
    education: resume.educationIncluded ? education.map((e,i)=>({id:String(i),place:e.institution,degree:e.specialty,period:e.endYear})) : [],
    experience: resume.visibility.showExperience ? experience.map(e=>({id:e.id,role:e.title||e.role,description:[e.description,e.result].filter(Boolean).join('\n'),skills:e.skills,source:e.organization,period:`${e.startDate} — ${e.ongoing?'по настоящее время':e.endDate}`})) : [],
    skills:resume.skills.map(name=>({name,level:0,source:'manual'})),languages:resume.languages||profile?.languages||[],achievements:[],tests:[],
  });
}
