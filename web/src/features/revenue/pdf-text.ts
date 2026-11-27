import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/**
 * The text of a PDF, line by line as it is laid out on the page. A table
 * copied out of a PDF by hand often comes column by column; here every piece
 * of text is put back on its line by its height on the page, left to right,
 * which is what the amortisation table's reader expects.
 *
 * Read in the browser: the file never leaves it, only the lines the host then
 * chooses to import. This file and its library are fetched when a PDF is chosen.
 */
GlobalWorkerOptions.workerSrc = worker;

export async function pdfText(file: File): Promise<string> {
  const loading = getDocument({ data: await file.arrayBuffer() });
  const document = await loading.promise;
  const lines: string[] = [];
  try {
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const rows = new Map<number, { x: number; text: string }[]>();
      for (const item of (await page.getTextContent()).items) {
        if (!("str" in item) || item.str.trim() === "") continue;
        // Pieces within two points of each other in height sit on the same line.
        const y = Math.round(item.transform[5] / 2);
        rows.set(y, [...(rows.get(y) ?? []), { x: item.transform[4], text: item.str.trim() }]);
      }
      // A page is read from the top, and its heights are counted from the bottom.
      for (const [, pieces] of [...rows].sort((a, b) => b[0] - a[0])) {
        lines.push(
          pieces
            .sort((a, b) => a.x - b.x)
            .map((piece) => piece.text)
            .join("   "),
        );
      }
    }
  } finally {
    await loading.destroy();
  }
  return lines.join("\n");
}
