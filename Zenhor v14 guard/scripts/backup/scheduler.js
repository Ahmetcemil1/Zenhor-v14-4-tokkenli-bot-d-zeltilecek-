const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("⏱️ Yedekleme zamanlayıcısı başlatıldı. Her gün 00:00'da çalışacak.");

// 🌙 Her gün saat 00:00'da (gece yarısı)
cron.schedule("0 0 * * *", () => {
  console.log("🔁 Otomatik yedekleme başlatılıyor...");

  exec("npm run backup", (error, stdout, stderr) => {
    const timestamp = new Date().toISOString();
    const logDir = path.join(__dirname, "../../logs");
    const logFile = path.join(logDir, `backup-${timestamp.replace(/[:.]/g, "-")}.json`);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logData = {
      timestamp,
      success: !error,
      error: error ? error.message : null,
      warning: stderr || null,
      output: stdout || null
    };

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2), "utf8");
    console.log(`📄 Yedekleme JSON logu kaydedildi: ${path.basename(logFile)}`);
  });
});

// 🟢 Node.js açık kalmalı
setInterval(() => {}, 1 << 30);