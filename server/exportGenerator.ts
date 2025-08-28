import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import archiver from 'archiver';
import { marked } from 'marked';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface BookData {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  selectedTemplate: string;
  coverImageUrl?: string;
  language: string;
}

interface ExportOptions {
  includeCover: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
}

const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Ensure export directory exists
async function ensureExportDir() {
  try {
    await fs.access(EXPORT_DIR);
  } catch {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
  }
}

// Template styles mapping
const getTemplateStyles = (templateId: string) => {
  const templates = {
    original: {
      fontFamily: 'serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#1f2937',
      backgroundColor: '#ffffff'
    },
    modern: {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      lineHeight: '1.7',
      color: '#0f172a',
      backgroundColor: '#f8fafc'
    },
    creative: {
      fontFamily: 'serif',
      fontSize: '16px',
      lineHeight: '1.8',
      color: '#92400e',
      backgroundColor: '#fef3c7'
    },
    classic: {
      fontFamily: 'serif',
      fontSize: '15px',
      lineHeight: '1.65',
      color: '#374151',
      backgroundColor: '#fefefe'
    },
    business: {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#1e293b',
      backgroundColor: '#f1f5f9'
    },
    academic: {
      fontFamily: 'serif',
      fontSize: '14px',
      lineHeight: '1.75',
      color: '#111827',
      backgroundColor: '#ffffff'
    }
  };
  
  return templates[templateId as keyof typeof templates] || templates.original;
};

// Generate HTML content
function generateHTMLContent(bookData: BookData, options: ExportOptions = { includeCover: true, includeTableOfContents: true, includePageNumbers: true }): string {
  const template = getTemplateStyles(bookData.selectedTemplate);
  
  let html = `
<!DOCTYPE html>
<html lang="${bookData.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookData.title}</title>
    <style>
        body {
            font-family: ${template.fontFamily};
            font-size: ${template.fontSize};
            line-height: ${template.lineHeight};
            color: ${template.color};
            background-color: ${template.backgroundColor};
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .cover-page {
            text-align: center;
            page-break-after: always;
            margin-bottom: 4rem;
        }
        
        .cover-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .cover-subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.8;
        }
        
        .cover-author {
            font-size: 1.25rem;
            margin-top: 3rem;
        }
        
        .cover-image {
            max-width: 400px;
            max-height: 600px;
            margin: 2rem auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .table-of-contents {
            page-break-after: always;
            margin-bottom: 4rem;
        }
        
        .toc-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .toc-item {
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 0.25rem;
        }
        
        .chapter {
            page-break-before: always;
            margin-bottom: 3rem;
        }
        
        .chapter-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 2rem;
            border-bottom: 2px solid #ccc;
            padding-bottom: 0.5rem;
        }
        
        .chapter-content {
            margin-bottom: 1.5rem;
        }
        
        .chapter-content p {
            margin-bottom: 1.5rem;
        }
        
        .chapter-content h4 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 2rem 0 1rem 0;
        }
        
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
`;

  // Cover page
  if (options.includeCover) {
    html += `
    <div class="cover-page">
        ${bookData.coverImageUrl ? `<img src="${bookData.coverImageUrl}" alt="Book Cover" class="cover-image">` : ''}
        <h1 class="cover-title">${bookData.title}</h1>
        ${bookData.subtitle ? `<h2 class="cover-subtitle">${bookData.subtitle}</h2>` : ''}
        <p class="cover-author">by ${bookData.author}</p>
    </div>`;
  }

  // Table of contents
  if (options.includeTableOfContents) {
    html += `
    <div class="table-of-contents">
        <h2 class="toc-title">Table of Contents</h2>`;
    
    bookData.chapters.forEach((chapter, index) => {
      html += `
        <div class="toc-item">
            <span>Chapter ${index + 1}: ${chapter.title}</span>
            <span>${index + 3}</span>
        </div>`;
    });
    
    html += `</div>`;
  }

  // Chapters
  bookData.chapters.forEach((chapter, index) => {
    html += `
    <div class="chapter">
        <h1 class="chapter-title">Chapter ${index + 1}: ${chapter.title}</h1>
        <div class="chapter-content">`;
    
    // Process chapter content
    const paragraphs = chapter.content.split('\n\n');
    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        if (trimmed.startsWith('The ') && trimmed.includes('Changes')) {
          html += `<h4>${trimmed}</h4>`;
        } else {
          html += `<p>${trimmed}</p>`;
        }
      }
    });
    
    html += `
        </div>
    </div>`;
  });

  html += `
</body>
</html>`;

  return html;
}

// Export as PDF
export async function exportToPDF(bookData: BookData, options?: ExportOptions): Promise<string> {
  await ensureExportDir();
  
  const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const filePath = path.join(EXPORT_DIR, fileName);
  
  const htmlContent = generateHTMLContent(bookData, options);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        bottom: '1in',
        left: '1in',
        right: '1in'
      }
    });
  } finally {
    await browser.close();
  }
  
  return fileName;
}

// Export as HTML
export async function exportToHTML(bookData: BookData, options?: ExportOptions): Promise<string> {
  await ensureExportDir();
  
  const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  const filePath = path.join(EXPORT_DIR, fileName);
  
  const htmlContent = generateHTMLContent(bookData, options);
  await fs.writeFile(filePath, htmlContent, 'utf-8');
  
  return fileName;
}

// Export as Markdown
export async function exportToMarkdown(bookData: BookData): Promise<string> {
  await ensureExportDir();
  
  const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  const filePath = path.join(EXPORT_DIR, fileName);
  
  let markdown = `# ${bookData.title}\n\n`;
  
  if (bookData.subtitle) {
    markdown += `## ${bookData.subtitle}\n\n`;
  }
  
  markdown += `**Author:** ${bookData.author}\n\n`;
  markdown += `**Description:** ${bookData.description}\n\n`;
  markdown += `---\n\n`;
  
  // Table of contents
  markdown += `## Table of Contents\n\n`;
  bookData.chapters.forEach((chapter, index) => {
    markdown += `${index + 1}. [${chapter.title}](#chapter-${index + 1}-${chapter.title.toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`;
  });
  markdown += `\n---\n\n`;
  
  // Chapters
  bookData.chapters.forEach((chapter, index) => {
    markdown += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
    
    // Process chapter content
    const paragraphs = chapter.content.split('\n\n');
    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        if (trimmed.startsWith('The ') && trimmed.includes('Changes')) {
          markdown += `### ${trimmed}\n\n`;
        } else {
          markdown += `${trimmed}\n\n`;
        }
      }
    });
    
    markdown += `---\n\n`;
  });
  
  await fs.writeFile(filePath, markdown, 'utf-8');
  return fileName;
}

// Export as EPUB
export async function exportToEPUB(bookData: BookData, options?: ExportOptions): Promise<string> {
  await ensureExportDir();
  
  const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.epub`;
  const filePath = path.join(EXPORT_DIR, fileName);
  
  const zip = new JSZip();
  
  // EPUB structure
  zip.file('mimetype', 'application/epub+zip');
  
  // META-INF
  const metaInf = zip.folder('META-INF');
  metaInf?.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // OEBPS
  const oebps = zip.folder('OEBPS');
  
  // Content.opf
  let contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${bookData.title}</dc:title>
    <dc:creator opf:role="aut">${bookData.author}</dc:creator>
    <dc:language>${bookData.language || 'en'}</dc:language>
    <dc:identifier id="BookId">${Date.now()}</dc:identifier>
    <dc:description>${bookData.description}</dc:description>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>`;

  bookData.chapters.forEach((chapter, index) => {
    contentOpf += `
    <item id="chapter${index + 1}" href="chapter${index + 1}.xhtml" media-type="application/xhtml+xml"/>`;
  });

  contentOpf += `
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
    <itemref idref="toc"/>`;

  bookData.chapters.forEach((chapter, index) => {
    contentOpf += `
    <itemref idref="chapter${index + 1}"/>`;
  });

  contentOpf += `
  </spine>
</package>`;

  oebps?.file('content.opf', contentOpf);

  // Style.css
  const template = getTemplateStyles(bookData.selectedTemplate);
  const css = `
body {
  font-family: ${template.fontFamily};
  font-size: ${template.fontSize};
  line-height: ${template.lineHeight};
  color: ${template.color};
  margin: 2em;
}

h1 {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 1em;
  page-break-before: always;
}

h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 1.5em 0 1em 0;
}

p {
  margin-bottom: 1em;
  text-align: justify;
}

.cover {
  text-align: center;
  page-break-after: always;
}

.cover-title {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.cover-author {
  font-size: 1.2em;
  margin-top: 2em;
}
`;

  oebps?.file('style.css', css);

  // Cover page
  const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${bookData.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover">
    <h1 class="cover-title">${bookData.title}</h1>
    ${bookData.subtitle ? `<h2>${bookData.subtitle}</h2>` : ''}
    <p class="cover-author">by ${bookData.author}</p>
  </div>
</body>
</html>`;

  oebps?.file('cover.xhtml', coverXhtml);

  // Table of contents
  let tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>Table of Contents</h1>`;

  bookData.chapters.forEach((chapter, index) => {
    tocXhtml += `
  <p><a href="chapter${index + 1}.xhtml">Chapter ${index + 1}: ${chapter.title}</a></p>`;
  });

  tocXhtml += `
</body>
</html>`;

  oebps?.file('toc.xhtml', tocXhtml);

  // Chapter files
  bookData.chapters.forEach((chapter, index) => {
    let chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>Chapter ${index + 1}: ${chapter.title}</h1>`;

    // Process chapter content
    const paragraphs = chapter.content.split('\n\n');
    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        if (trimmed.startsWith('The ') && trimmed.includes('Changes')) {
          chapterXhtml += `  <h2>${trimmed}</h2>`;
        } else {
          chapterXhtml += `  <p>${trimmed}</p>`;
        }
      }
    });

    chapterXhtml += `
</body>
</html>`;

    oebps?.file(`chapter${index + 1}.xhtml`, chapterXhtml);
  });

  // NCX file
  let ncx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${bookData.title}</text>
  </docTitle>
  <navMap>
    <navPoint id="cover" playOrder="1">
      <navLabel>
        <text>Cover</text>
      </navLabel>
      <content src="cover.xhtml"/>
    </navPoint>
    <navPoint id="toc" playOrder="2">
      <navLabel>
        <text>Table of Contents</text>
      </navLabel>
      <content src="toc.xhtml"/>
    </navPoint>`;

  bookData.chapters.forEach((chapter, index) => {
    ncx += `
    <navPoint id="chapter${index + 1}" playOrder="${index + 3}">
      <navLabel>
        <text>Chapter ${index + 1}: ${chapter.title}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`;
  });

  ncx += `
  </navMap>
</ncx>`;

  oebps?.file('toc.ncx', ncx);

  // Generate ZIP
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(filePath, content);
  
  return fileName;
}

// Export as DOCX
export async function exportToDOCX(bookData: BookData, options?: ExportOptions): Promise<string> {
  await ensureExportDir();
  
  const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  
  const paragraphs: Paragraph[] = [];
  
  // Cover page
  if (options?.includeCover) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: bookData.title,
            bold: true,
            size: 36,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );
    
    if (bookData.subtitle) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bookData.subtitle,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    }
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `by ${bookData.author}`,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
    
    paragraphs.push(new Paragraph({ text: "", pageBreakBefore: true }));
  }
  
  // Table of contents
  if (options?.includeTableOfContents) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Table of Contents",
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
      })
    );
    
    bookData.chapters.forEach((chapter, index) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Chapter ${index + 1}: ${chapter.title}`,
              size: 20,
            }),
          ],
        })
      );
    });
    
    paragraphs.push(new Paragraph({ text: "", pageBreakBefore: true }));
  }
  
  // Chapters
  bookData.chapters.forEach((chapter, index) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Chapter ${index + 1}: ${chapter.title}`,
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: index > 0,
      })
    );
    
    const chapterParagraphs = chapter.content.split('\n\n');
    chapterParagraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        if (trimmed.startsWith('The ') && trimmed.includes('Changes')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
            })
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmed,
                  size: 20,
                }),
              ],
            })
          );
        }
      }
    });
  });
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });
  
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);
  
  return fileName;
}