const { exec } = require("child_process");

const tasks = [
  "restoreRoles.js",
  "restoreChannels.js",
  "restoreEmojis.js"
];

(async () => {
  console.log("🔄 Geri yükleme başlatılıyor...");

  for (const task of tasks) {
    console.log(`♻️ ${task.replace(".js", "")} çalıştırılıyor...`);
    await new Promise((resolve, reject) => {
      exec(`node scripts/backup/${task}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ${task} sırasında hata:`, error.message);
          return reject(error);
        }
        if (stderr) console.error(`⚠️ Hata uyarısı:`, stderr);
        console.log(stdout);
        resolve();
      });
    });
  }

  console.log("✅ Tüm veriler başarıyla geri yüklendi!");
})();