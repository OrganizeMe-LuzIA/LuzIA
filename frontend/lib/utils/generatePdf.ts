import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;

export async function generateReportPdf(
  element: HTMLElement,
  filename = "relatorio.pdf",
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;

  const ratio = CONTENT_WIDTH_MM / imgWidthPx;
  const imgHeightMm = imgHeightPx * ratio;

  const pdf = new jsPDF("p", "mm", "a4");
  const pageContentHeight = A4_HEIGHT_MM - MARGIN_MM * 2;

  let heightLeft = imgHeightMm;
  let position = MARGIN_MM;
  let page = 0;

  while (heightLeft > 0) {
    if (page > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "PNG",
      MARGIN_MM,
      position - page * pageContentHeight,
      CONTENT_WIDTH_MM,
      imgHeightMm,
    );

    heightLeft -= pageContentHeight;
    page++;
    position = MARGIN_MM - page * pageContentHeight;
  }

  pdf.save(filename);
}
