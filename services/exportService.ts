
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ExternalHyperlink } from "docx";
import saveAs from "file-saver";
import { ItineraryResult, TravelPreferences } from "../types";

// 輔助函式：嘗試獲取圖片數據
const fetchImageAsBuffer = async (url: string): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.warn("Could not fetch image for Word doc (CORS limit):", url);
    return null;
  }
};

export const exportToJson = (result: ItineraryResult, prefs: TravelPreferences) => {
  const data = {
    version: "1.1",
    generatedAt: new Date().toISOString(),
    preferences: prefs,
    itinerary: result
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  saveAs(blob, `AI旅遊數據_${prefs.destination}.json`);
};

export const exportToDocx = async (result: ItineraryResult, prefs: TravelPreferences) => {
  const parseMarkdownToElements = async (text: string) => {
    const lines = text.split('\n');
    const elements: (Paragraph | Table)[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;

    const finalizeTable = () => {
      if (currentTableRows.length > 0) {
        const docTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          },
          rows: currentTableRows.map((row, rIdx) => new TableRow({
            children: row.map(cell => new TableCell({
              children: [new Paragraph({ 
                text: cell.replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/!\[(.*?)\]\(.*?\)/g, ''), 
                spacing: { before: 100, after: 100 } 
              })],
              shading: rIdx === 0 ? { fill: "F8FAFC" } : undefined,
            }))
          }))
        });
        elements.push(docTable);
        currentTableRows = [];
      }
      inTable = false;
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('|')) {
        inTable = true;
        if (!trimmedLine.match(/^[|\-\s:]+$/)) {
          const cells = trimmedLine.split('|').filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.trim() !== '').map(c => c.trim());
          if (cells.length > 0) currentTableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        finalizeTable();
      }

      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('# ')) {
        elements.push(new Paragraph({ text: trimmedLine.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(new Paragraph({ text: trimmedLine.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(new Paragraph({ text: trimmedLine.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
      } else if (trimmedLine.match(/!\[(.*?)\]\((.*?)\)/)) {
        // 處理圖片
        const match = trimmedLine.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          const alt = match[1];
          const url = match[2];
          const imageBuffer = await fetchImageAsBuffer(url);

          if (imageBuffer) {
            elements.push(new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: { width: 450, height: 300 },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 }
            }));
            elements.push(new Paragraph({ 
              children: [new TextRun({ text: `圖：${alt}`, italics: true, size: 20, color: "666666" })], 
              alignment: AlignmentType.CENTER, 
              spacing: { after: 200 } 
            }));
          } else {
            // 如果無法獲取圖片 (CORS)，改為醒目的連結
            elements.push(new Paragraph({
              children: [
                new TextRun({ text: "📸 景點照片網址：", bold: true }),
                new ExternalHyperlink({
                  children: [new TextRun({ text: alt || url, color: "2563EB", underline: {} })],
                  link: url,
                }),
              ],
              spacing: { before: 100, after: 100 }
            }));
          }
        }
      } else {
        // 處理一般文字與連結
        const cleanText = trimmedLine.replace(/\[(.*?)\]\(.*?\)/g, '$1');
        elements.push(new Paragraph({
          children: [new TextRun(cleanText)],
          spacing: { after: 150 }
        }));
      }
    }

    if (inTable) finalizeTable();
    return elements;
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `AI 旅遊管家：${prefs.destination} 完整攻略`, bold: true, size: 40, color: "1E293B" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...(await parseMarkdownToElements(result.agentAnalysis || "")),
          new Paragraph({ text: "====================================", alignment: AlignmentType.CENTER }),
          ...(await parseMarkdownToElements(result.text)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `AI旅遊管家_${prefs.destination}.docx`);
};
