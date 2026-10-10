import { resumeFontRegular, resumeFontBold } from '@/assets/resumeFonts';
import { jsPDF } from 'jspdf';

interface ResumePDFData {
  fullName: string;
  position: string;
  about: string;
  desiredSalary?: number | null;
  employmentTypes?: string[];
  workFormats?: string[];
  portfolioLinks?: string[];
  contacts: { email: string; phone: string; city: string; telegram: string };
  education: { id: string; place: string; degree: string; period: string }[];
  experience: { id: string; role: string; description: string; skills: string[]; source: string; period: string }[];
  skills: { name: string; level: number; source: string }[];
  languages: { name: string; level: string }[];
  achievements: { id: string; title: string; description: string }[];
  tests: { testId: string; testName: string; score: number; maxScore: number; date: string; passed: boolean }[];
}

export function createResumePDF(resume: ResumePDFData) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.addFileToVFS('DejaVuSans.ttf', resumeFontRegular);
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', resumeFontBold);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFillColor(25, 181, 254);
  doc.rect(0, 0, pageWidth, 8, 'F');

  y = margin + 10;
  doc.setFont('DejaVu', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(32, 33, 36);
  const nameLines = doc.splitTextToSize(resume.fullName || 'Резюме', contentWidth) as string[];
  for (const line of nameLines) { ensureSpace(30); doc.text(line, margin, y); y += 29; }
  y -= 12;
  doc.setFont('DejaVu', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(7, 152, 223);
  const positionLines = doc.splitTextToSize(resume.position || '', contentWidth) as string[];
  for (const line of positionLines) { ensureSpace(19); doc.text(line, margin, y + 8); y += 18; }
  y += 8;
  doc.setFontSize(9.5);
  doc.setTextColor(124, 135, 147);
  const contactParts = [
    resume.contacts.email,
    resume.contacts.phone,
    resume.contacts.city,
    resume.contacts.telegram,
  ].filter(Boolean);
  const contactLines = doc.splitTextToSize(contactParts.join('  ·  '), contentWidth) as string[];
  for (const line of contactLines) { ensureSpace(14); doc.text(line, margin, y); y += 14; }
  doc.setDrawColor(231, 237, 242);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  const sectionTitle = (title: string) => {
    y += 20;
    ensureSpace(40);
    doc.setFont('DejaVu', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(32, 33, 36);
    doc.text(title.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(25, 181, 254);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 24, y);
    doc.setDrawColor(231, 237, 242);
    doc.setLineWidth(1);
    doc.line(margin + 26, y, pageWidth - margin, y);
    y += 16;
  };

  const paragraph = (text: string, size = 10) => {
    doc.setFont('DejaVu', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(80, 90, 100);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    lines.forEach((line) => {
      ensureSpace(size + 6);
      doc.text(line, margin, y);
      y += size + 5;
    });
  };

  if (resume.desiredSalary || resume.employmentTypes?.length || resume.workFormats?.length) {
    sectionTitle('Желаемая работа');
    if (resume.desiredSalary) paragraph(`${resume.desiredSalary.toLocaleString('ru-RU')} ₽ / месяц`);
    paragraph([...(resume.employmentTypes || []), ...(resume.workFormats || [])].join(' · '));
  }
  if (resume.about) {
    sectionTitle('О себе');
    paragraph(resume.about);
  }

  if (resume.experience.length > 0) {
    sectionTitle('Опыт');
    resume.experience.forEach((exp) => {
      ensureSpace(60);
      doc.setFont('DejaVu', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(32, 33, 36);
      doc.text(exp.role, margin, y);
      y += 6;
      doc.setFont('DejaVu', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(124, 135, 147);
      doc.text(`${exp.source} · ${exp.period}`, margin, y + 4);
      y += 16;
      paragraph(exp.description, 10);
      if (exp.skills.length > 0) {
        y += 4;
        doc.setFontSize(9);
        doc.setTextColor(7, 152, 223);
        doc.text(exp.skills.join('  ·  '), margin, y);
        y += 14;
      }
      y += 6;
    });
  }

  if (resume.education.length > 0) {
    sectionTitle('Образование');
    resume.education.forEach((edu) => {
      ensureSpace(40);
      doc.setFont('DejaVu', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(32, 33, 36);
      doc.text(edu.place, margin, y);
      y += 6;
      doc.setFont('DejaVu', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(124, 135, 147);
      doc.text(`${edu.degree} · ${edu.period}`, margin, y + 4);
      y += 18;
    });
  }

  if (resume.skills.length > 0) {
    sectionTitle('Навыки');
    doc.setFontSize(10);
    doc.setTextColor(80, 90, 100);
    const skillLines = resume.skills.map((s) => s.level > 0 ? `${s.name} — ${s.level}%` : s.name);
    const skillText = skillLines.join('   ·   ');
    paragraph(skillText, 10);
  }

  if (resume.tests.length > 0) {
    sectionTitle('Пройденные тесты');
    resume.tests.forEach((t) => {
      ensureSpace(20);
      doc.setFont('DejaVu', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(32, 33, 36);
      const testName = t.testName;
      doc.text(`${testName} — ${t.score}/${t.maxScore} (${t.date})`, margin, y);
      y += 16;
    });
  }

  if (resume.languages.length > 0) {
    sectionTitle('Языки');
    doc.setFontSize(10);
    doc.setTextColor(80, 90, 100);
    paragraph(resume.languages.map((l) => `${l.name} — ${l.level}`).join('   ·   '), 10);
  }

  if (resume.achievements.length > 0) {
    sectionTitle('Достижения');
    resume.achievements.forEach((a) => {
      ensureSpace(30);
      doc.setFont('DejaVu', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(32, 33, 36);
      doc.text(`• ${a.title}`, margin, y);
      y += 6;
      if (a.description) paragraph(a.description, 9.5);
      y += 8;
    });
  }

  if (resume.portfolioLinks?.length) {
    sectionTitle('Портфолио');
    resume.portfolioLinks.filter(link => /^https?:\/\//.test(link)).forEach(link => paragraph(link));
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('DejaVu', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(170, 180, 190);
    doc.text('Сгенерировано в сервисе «Карьерный маршрут» · СВЯЗКА', margin, pageHeight - 20);
    doc.text(`${i} / ${pageCount}`, pageWidth - margin - 20, pageHeight - 20);
  }

  return doc;
}

export function exportResumeToPDF(resume: ResumePDFData) {
  const doc = createResumePDF(resume);
  const safeName = (resume.fullName || 'resume').replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g, '_');
  doc.save(`${safeName}_resume.pdf`);
}

export function exportCertificateToPDF(name: string, certNumber: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cx = pageWidth / 2;

  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(25, 181, 254);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(167, 139, 250);
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');

  const bw = pageWidth - 80;
  const bh = pageHeight - 80;
  const bx = 40;
  const by = 40;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(bx, by, bw, bh, 20, 20, 'F');
  doc.setDrawColor(25, 181, 254);
  doc.setLineWidth(2);
  doc.roundedRect(bx + 6, by + 6, bw - 12, bh - 12, 16, 16, 'S');

  doc.setFillColor(25, 181, 254);
  doc.circle(cx, by + 70, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('DejaVu', 'bold');
  doc.setFontSize(28);
  doc.text('CM', cx, by + 80);

  doc.setTextColor(25, 181, 254);
  doc.setFontSize(11);
  doc.text('КАРЬЕРНЫЙ МАРШРУТ · СВЯЗКА', cx, by + 120, { align: 'center' });

  doc.setTextColor(26, 26, 46);
  doc.setFontSize(36);
  doc.text('СЕРТИФИКАТ', cx, by + 165, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(139, 144, 160);
  doc.text('настоящий сертификат подтверждает успешное прохождение', cx, by + 190, { align: 'center' });
  doc.text('карьерного маршрута и формирование первого отклика', cx, by + 208, { align: 'center' });

  doc.setFontSize(28);
  doc.setTextColor(26, 26, 46);
  doc.setFont('DejaVu', 'bold');
  doc.text(name || 'Студент', cx, by + 260, { align: 'center' });

  doc.setDrawColor(25, 181, 254);
  doc.setLineWidth(1.5);
  const nameWidth = Math.max(200, doc.getTextWidth(name || 'Студент') + 40);
  doc.line(cx - nameWidth / 2, by + 272, cx + nameWidth / 2, by + 272);

  doc.setFont('DejaVu', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 90, 100);
  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Дата выдачи: ${dateStr}`, cx, by + 300, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(139, 144, 160);
  doc.text(`Номер сертификата: ${certNumber}`, cx, by + 320, { align: 'center' });

  doc.setDrawColor(231, 237, 242);
  doc.setLineWidth(1);
  doc.line(bx + 60, by + bh - 80, bx + bw - 60, by + bh - 80);

  doc.setFontSize(10);
  doc.setTextColor(139, 144, 160);
  doc.text('Сервис «Карьерный маршрут» · СВЯЗКА', cx, by + bh - 60, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(184, 189, 199);
  doc.text('Проверить подлинность: career-route.ru/verify', cx, by + bh - 42, { align: 'center' });

  doc.save(`certificate_${certNumber}.pdf`);
}
