// Bridge between the billing page and Android: one JSON data file, the share sheet, and PDF export.
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DATA_FILE = "hisaab-data.json";
const PREV_FILE = "hisaab-data.prev.json";

async function share(filename, data, isBase64) {
  const res = await Filesystem.writeFile({
    path: filename,
    data,
    directory: Directory.Cache,
    ...(isBase64 ? {} : { encoding: Encoding.UTF8 }),
  });
  await Share.share({ title: filename, files: [res.uri], dialogTitle: "Share " + filename });
}

window.HisaabNative = {
  async readData() {
    for (const path of [DATA_FILE, PREV_FILE]) {
      try {
        const r = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
        JSON.parse(r.data); // skip a file that was cut off mid-write
        return r.data;
      } catch (e) {}
    }
    return null;
  },

  // Keep the last good copy, then write the new one.
  async writeData(json) {
    try {
      await Filesystem.copy({ from: DATA_FILE, to: PREV_FILE, directory: Directory.Data, toDirectory: Directory.Data });
    } catch (e) {}
    await Filesystem.writeFile({ path: DATA_FILE, data: json, directory: Directory.Data, encoding: Encoding.UTF8 });
  },

  share,

  // Render the invoice element to an A4 PDF (multi-page if long) and open the share sheet.
  async sharePdf(el, filename) {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 8, pageW = 210 - margin * 2, pageH = 297 - margin * 2;
    const imgH = (canvas.height * pageW) / canvas.width;
    const img = canvas.toDataURL("image/jpeg", 0.9);
    for (let y = 0; y < imgH; y += pageH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", margin, margin - y, pageW, imgH);
    }
    await window.HisaabNative.share(filename, pdf.output("datauristring").split(",")[1], true);
  },
};
