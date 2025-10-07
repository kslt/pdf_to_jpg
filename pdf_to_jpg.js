import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pdf from "pdf-poppler";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 5000;

app.use(express.static("public"));

app.post("/upload", upload.single("pdf"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("Ingen fil uppladdad");

  const inputPath = path.resolve(file.path);
  const outputDir = path.resolve("output");
  const outputPrefix = path.basename(file.originalname, path.extname(file.originalname));

  try {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const opts = {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: outputPrefix,
      page: null,
      dpi: 150,
    };

    await pdf.convert(inputPath, opts);

    // Ta bort PDF efter konvertering
    fs.unlinkSync(inputPath);

    // Skicka tillbaka länkar till JPG-filer
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith(outputPrefix))
      .map(f => `/download/${f}`);

    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).send("Fel vid konvertering");
  }
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join("output", req.params.filename);

  res.download(filePath, err => {
    if (!err) {
      // Ta bort filen efter nedladdning
      fs.unlink(filePath, err2 => {
        if (err2) console.error("Fel vid borttagning:", err2);
      });
    }
  });
});

app.listen(PORT, () => console.log(`🚀 Servern kör på http://localhost:${PORT}`));
