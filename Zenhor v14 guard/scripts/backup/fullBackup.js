// scripts/backup/fullBackup.js
const { exec } = require("child_process");
const path = require("path");

const tasks = [
  "backupRoles.js",
  "backupChannels.js",
  "backupEmojis.js"
];

(async () => {
  console.log("🔄 Yedekleme başlatılıyor...\n");

  for (const task of tasks) {
    const scriptPath = path.join("scripts", "backup", task);
    console.log(`📦 ${task.replace(".js", "")} çalıştırılıyor...`);

    await new Promise((resolve) => {
      exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ${task} sırasında hata:\n${error.message}\n`);
        } else {
          console.log(`✅ ${task} başarıyla çalıştı.`);
        }

        if (stderr && !error) {
          console.warn(`⚠️ ${task} uyarı:\n${stderr}`);
        }

        if (stdout) {
          console.log(stdout.trim());
        }

        resolve(); // Her durumda ilerlesin
      });
    });

    console.log(); // boş satır
  }

  console.log("✅ Tüm veriler başarıyla yedeklendi!");
})();