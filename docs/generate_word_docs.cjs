const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Convert markdown to OpenXML paragraphs and tables
function markdownToOpenXml(mdContent) {
  const lines = mdContent.split(/\r?\n/);
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  function flushTable() {
    if (tableRows.length === 0) return;
    let tblXml = `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="1B5299"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="1B5299"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="1B5299"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="1B5299"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>`;

    tableRows.forEach((row, rowIdx) => {
      const isHeader = (rowIdx === 0);
      tblXml += `<w:tr>`;
      row.forEach(cell => {
        const bg = isHeader ? `<w:shd w:val="clear" w:color="auto" w:fill="1B3D6D"/>` : (rowIdx % 2 === 1 ? `<w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>` : '');
        const textColor = isHeader ? `<w:color w:val="FFFFFF"/>` : `<w:color w:val="111827"/>`;
        const bold = isHeader ? `<w:b/>` : '';
        const align = isHeader ? 'center' : 'left';
        
        // Strip markdown bold from cell
        const cleanCell = cell.replace(/\*\*/g, '').trim();

        tblXml += `<w:tc>
          <w:tcPr>${bg}</w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="${align}"/><w:spacing w:line="260" w:lineRule="auto" w:after="40"/></w:pPr>
            <w:r>
              <w:rPr>${bold}${textColor}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
              <w:t>${escapeXml(cleanCell)}</w:t>
            </w:r>
          </w:p>
        </w:tc>`;
      });
      tblXml += `</w:tr>`;
    });

    tblXml += `</w:tbl>`;
    elements.push(tblXml);
    tableRows = [];
    inTable = false;
  }

  function flushCodeBlock() {
    if (codeLines.length === 0) return;
    codeLines.forEach(cl => {
      elements.push(`<w:p>
        <w:pPr>
          <w:spacing w:line="240" w:lineRule="auto" w:after="20"/>
          <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
          <w:ind w:left="360" w:right="360"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>
            <w:sz w:val="18"/>
            <w:color w:val="1E293B"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(cl)}</w:t>
        </w:r>
      </w:p>`);
    });
    codeLines = [];
    inCodeBlock = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Check page break
    if (trimmed.includes('page-break-after: always') || trimmed.includes('<!-- PAGE BREAK -->') || trimmed === '---' && lines[i-1] && lines[i-1].includes('Semester-III')) {
      if (inTable) flushTable();
      elements.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
      continue;
    }

    // Check tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if it's separator line like | :--- | :--- |
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(trimmed)) {
        continue;
      }
      inTable = true;
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      if (inTable) flushTable();
    }

    if (trimmed === '') {
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '');
      elements.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
          <w:spacing w:before="240" w:after="120"/>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="1B3D6D"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
          <w:t>${escapeXml(headingText)}</w:t>
        </w:r>
      </w:p>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '');
      elements.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="Heading2"/>
          <w:spacing w:before="200" w:after="80"/>
          <w:jc w:val="left"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="1B3D6D"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
          <w:t>${escapeXml(headingText)}</w:t>
        </w:r>
      </w:p>`);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
      elements.push(`<w:p>
        <w:pPr>
          <w:pStyle w:val="Heading3"/>
          <w:spacing w:before="160" w:after="60"/>
          <w:jc w:val="left"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
          <w:t>${escapeXml(headingText)}</w:t>
        </w:r>
      </w:p>`);
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const itemText = trimmed.replace(/^[\*\-]\s+/, '');
      elements.push(formatParagraph(itemText, { isBullet: true }));
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(formatParagraph(numMatch[2], { isNumber: numMatch[1] }));
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.replace(/^>\s+/, '').replace(/\*/g, '');
      elements.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:after="120"/>
          <w:ind w:left="720" w:right="720"/>
          <w:jc w:val="center"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:i/><w:b/><w:color w:val="1B3D6D"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
          <w:t>${escapeXml(quoteText)}</w:t>
        </w:r>
      </w:p>`);
      continue;
    }

    // Standard paragraph
    elements.push(formatParagraph(trimmed, {}));
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCodeBlock();

  return elements.join('\n');
}

function formatParagraph(text, opts) {
  let pPr = `<w:pPr><w:spacing w:line="360" w:lineRule="auto" w:after="100"/><w:jc w:val="both"/>`;
  if (opts.isBullet) {
    pPr += `<w:ind w:left="480" w:hanging="240"/>`;
  } else if (opts.isNumber) {
    pPr += `<w:ind w:left="480" w:hanging="240"/>`;
  }
  pPr += `</w:pPr>`;

  let runs = '';
  if (opts.isBullet) {
    runs += `<w:r><w:rPr><w:b/><w:color w:val="1B5299"/></w:rPr><w:t xml:space="preserve">&#8226; </w:t></w:r>`;
  } else if (opts.isNumber) {
    runs += `<w:r><w:rPr><w:b/><w:color w:val="1B5299"/></w:rPr><w:t xml:space="preserve">${opts.isNumber}. </w:t></w:r>`;
  }

  // Parse **bold** and *italic* and `code`
  // Simple token regex
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      runs += `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(content)}</w:t></w:r>`;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      const content = part.slice(1, -1);
      runs += `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${escapeXml(content)}</w:t></w:r>`;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      runs += `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escapeXml(content)}</w:t></w:r>`;
    } else {
      runs += `<w:r><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`;
    }
  }

  return `<w:p>${pPr}${runs}</w:p>`;
}

// Generate native DOCX package
function buildDocx(mdFilePath, outDocxPath, title, subject) {
  const mdContent = fs.readFileSync(mdFilePath, 'utf8');
  const tempDir = path.join(process.env.TEMP, `docx_build_${Date.now()}`);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

  const contentXml = markdownToOpenXml(mdContent);

  // [Content_Types].xml
  fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`);

  // _rels/.rels
  fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // word/_rels/document.xml.rels
  fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`);

  // word/styles.xml
  fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto" w:after="120"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:color w:val="1B3D6D"/>
      <w:sz w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:color w:val="1B3D6D"/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:color w:val="0F172A"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`);

  // word/header1.xml
  fs.writeFileSync(path.join(tempDir, 'word', 'header1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="12" w:space="4" w:color="D49E24"/>
      </w:pBdr>
      <w:jc w:val="center"/>
      <w:spacing w:after="100"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
        <w:b/>
        <w:sz w:val="17"/>
        <w:color w:val="000000"/>
      </w:rPr>
      <w:t>DKTE SOCIETY'S TEXTILE &amp; ENGINEERING INSTITUTE, ICHALKARANJI — DEPARTMENT OF MCA</w:t>
    </w:r>
  </w:p>
</w:hdr>`);

  // word/footer1.xml
  fs.writeFileSync(path.join(tempDir, 'word', 'footer1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="9360" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="8" w:space="4" w:color="1B5299"/>
        <w:left w:val="none"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="none"/>
        <w:insideV w:val="none"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tr>
      <w:tc>
        <w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>
        <w:p>
          <w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="17"/><w:color w:val="555555"/></w:rPr>
            <w:t>MCA-II Semester-III</w:t>
          </w:r>
        </w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="4240" w:type="dxa"/></w:tcPr>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="17"/><w:color w:val="555555"/></w:rPr>
            <w:t>Plant Disease Detection &amp; Remedy Recommendation</w:t>
          </w:r>
        </w:p>
      </w:tc>
      <w:tc>
        <w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>
        <w:p>
          <w:pPr><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="17"/><w:color w:val="555555"/></w:rPr>
            <w:t xml:space="preserve">Page </w:t>
          </w:r>
          <w:fldSimple w:instr="PAGE"/>
        </w:p>
      </w:tc>
    </w:tr>
  </w:tbl>
</w:ftr>`);

  // word/document.xml
  fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${contentXml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdHeader1"/>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  if (fs.existsSync(outDocxPath)) fs.unlinkSync(outDocxPath);

  // Compress using .NET ZipFile
  const psCmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${tempDir.replace(/\\/g, '/')}', '${outDocxPath.replace(/\\/g, '/')}')"`;
  execSync(psCmd);
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`Generated DOCX: ${outDocxPath} (${fs.statSync(outDocxPath).size} bytes)`);
}

// Convert HTML to Microsoft Word .doc (Word MSO HTML format)
function buildDocFromHtml(htmlFilePath, outDocPath) {
  let html = fs.readFileSync(htmlFilePath, 'utf8');

  // Strip print button
  html = html.replace(/<button class="print-btn no-print"[\s\S]*?<\/button>/gi, '');

  const msoHeader = `<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 21.0cm 29.7cm;
  margin: 1.0in 1.0in 1.0in 1.25in;
  mso-header-margin: 36.0pt;
  mso-footer-margin: 36.0pt;
}
@page Section1 {
  size: 21.0cm 29.7cm;
  margin: 1.0in 1.0in 1.0in 1.25in;
  mso-header-margin: 36.0pt;
  mso-footer-margin: 36.0pt;
  mso-header: h1;
  mso-footer: f1;
}
div.Section1 { page: Section1; }
table#hrdftrtbl { margin: 0px 0px 0px 0px; }
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12.0pt;
  line-height: 150%;
  color: #000;
}
p {
  margin: 0 0 6pt 0;
  line-height: 150%;
  text-align: justify;
}
h1, h2, h3, h4 {
  font-family: Arial, Helvetica, sans-serif;
  color: #1b3d6d;
  page-break-after: avoid;
}
h1 { font-size: 16.0pt; font-weight: bold; text-align: center; margin-top: 18pt; margin-bottom: 8pt; }
h2 { font-size: 14.0pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
h3 { font-size: 12.0pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 8pt 0 12pt 0;
  font-size: 10.0pt;
}
table, th, td {
  border: 1.0pt solid #333333;
}
th {
  background-color: #1b3d6d;
  color: #ffffff;
  padding: 6pt 8pt;
  font-weight: bold;
}
td {
  padding: 5pt 8pt;
  vertical-align: top;
}
pre, code {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 9.5pt;
  background-color: #f1f5f9;
}
pre {
  padding: 8pt;
  border: 1pt solid #cbd5e1;
  white-space: pre-wrap;
}
.page {
  page-break-after: always;
  mso-break-type: section-break;
  padding-bottom: 20pt;
}
</style>
</head>
<body>
<div class="Section1">
`;

  const msoFooter = `
</div>
</body>
</html>`;

  // Extract body content from original HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let innerBody = bodyMatch ? bodyMatch[1] : html;

  // Replace page divs with clean page breaks for Word
  innerBody = innerBody.replace(/<div class="page">/gi, '<div class="page" style="page-break-before:always; mso-break-type:section-break;">');
  // First page shouldn't break before
  innerBody = innerBody.replace('<div class="page" style="page-break-before:always; mso-break-type:section-break;">', '<div class="page">');

  const finalDocContent = msoHeader + innerBody + msoFooter;
  fs.writeFileSync(outDocPath, finalDocContent, 'utf8');
  console.log(`Generated DOC: ${outDocPath} (${fs.statSync(outDocPath).size} bytes)`);
}

// MAIN
const docsDir = path.join(__dirname);
const reportMd = path.join(docsDir, 'PROJECT_REPORT.md');
const reportHtml = path.join(docsDir, 'PROJECT_REPORT.html');
const reportDocx = path.join(docsDir, 'PROJECT_REPORT.docx');
const reportDoc = path.join(docsDir, 'PROJECT_REPORT.doc');

const synopsisMd = path.join(docsDir, 'PROJECT_SYNOPSIS.md');
const synopsisHtml = path.join(docsDir, 'PROJECT_SYNOPSIS.html');
const synopsisDocx = path.join(docsDir, 'PROJECT_SYNOPSIS.docx');
const synopsisDoc = path.join(docsDir, 'PROJECT_SYNOPSIS.doc');

console.log('Building Project Documentation Word Files...');
buildDocx(reportMd, reportDocx, 'Project Report', 'Plant Disease Detection');
buildDocFromHtml(reportHtml, reportDoc);

console.log('Building Project Synopsis Word Files...');
buildDocx(synopsisMd, synopsisDocx, 'Project Synopsis', 'Plant Disease Detection');
buildDocFromHtml(synopsisHtml, synopsisDoc);

console.log('All Word files built successfully!');

