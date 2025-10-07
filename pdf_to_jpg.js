import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fromPath } from "pdf2pic";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 5000;

app.use(express.static("public"));

app.post("/upload", upload.single("pdf"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("Ingen fil uppladdad");

  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const convert = fromPath(file.path, {
    density: 150,
    savePath: outputDir,
    format: "jpg",
  });

  try {
    const result = await convert.bulk(-1); // -1 = alla sidor

    // Ta bort original-PDF
    fs.unlinkSync(file.path);

    const files = result.map(r => `/download/${path.basename(r.path)}`);
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).send("Fel vid konvertering");
  }
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join("output", req.params.filename);
  res.download(filePath, err => {
    if (!err) fs.unlink(filePath, () => {});
  });
});

app.listen(PORT, () => console.log(`🚀 Servern kör på http://localhost:${PORT}`));
