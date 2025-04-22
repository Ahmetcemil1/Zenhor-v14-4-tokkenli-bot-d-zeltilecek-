const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const testFiles = fs.readdirSync(dir)
  .filter(file => file.endsWith(".js") && file !== "testBackupScripts.js");

console.log("🧪 Yedekleme sistem dosyaları test ediliyor...\n");

(async () => {
  for (const file of testFiles) {
    console.log(`🔄 ${file} çalıştırılıyor...`);
    await new Promise((resolve) => {
      exec(`node ${path.join(dir, file)}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ${file} başarısız:`, error.message);
        } else if (stderr) {
          console.warn(`⚠️ ${file} uyarı:`, stderr);
        } else {
          console.log(`✅ ${file} başarılı çalıştı.`);
        }
        console.log("──────────────\n");
        resolve();
      });
    });
  }

  console.log("🧾 Tüm testler tamamlandı.");
})();