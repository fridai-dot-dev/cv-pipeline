import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export function buildDocument(data) {
  const children = [];

  children.push(new Paragraph({ text: data.profile.name, heading: HeadingLevel.TITLE }));
  if (data.profile.title) {
    children.push(new Paragraph({ text: data.profile.title }));
  }
  const contactLine = [data.profile.email, data.profile.phone, data.profile.location]
    .filter(Boolean)
    .join(' | ');
  if (contactLine) {
    children.push(new Paragraph({ text: contactLine }));
  }
  if (data.profile.summary) {
    children.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: data.profile.summary }));
  }

  children.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_1 }));
  for (const job of data.experience ?? []) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${job.role} — ${job.org}`, bold: true })],
      }),
    );
    children.push(new Paragraph({ text: job.dates }));
    for (const bullet of job.bullets ?? []) {
      children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
    }
  }

  if (data.education?.length) {
    children.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_1 }));
    for (const edu of data.education) {
      children.push(new Paragraph({ text: `${edu.credential} — ${edu.org} (${edu.dates})` }));
    }
  }

  if (data.skills?.length) {
    children.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_1 }));
    for (const group of data.skills) {
      children.push(new Paragraph({ text: `${group.category}: ${group.items.join(', ')}` }));
    }
  }

  return new Document({ sections: [{ children }] });
}

export async function renderDocx({ data, outputPath }) {
  const buffer = await Packer.toBuffer(buildDocument(data));
  writeFileSync(outputPath, buffer);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dataJsonPath, outputPath] = process.argv.slice(2);
  if (!dataJsonPath || !outputPath) {
    console.error('Usage: node scripts/render-docx.mjs <dataJsonPath> <outputPath>');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(dataJsonPath, 'utf-8'));
  await renderDocx({ data, outputPath });
  console.log(`Wrote ${outputPath}`);
}
