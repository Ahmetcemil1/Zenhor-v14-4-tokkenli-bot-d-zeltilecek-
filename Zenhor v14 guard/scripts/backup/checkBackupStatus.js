// scripts/backup/checkBackupStatus.js
const fs = require("fs");
const path = require("path");

const backupDir = path.join(__dirname, "../../backups");
const filesToCheck = [
  { file: "roles.json", name: "Roller" },
  { file: "channels.json", name: "Kanallar" },
  { file: "emojis.json", name: "Emojiler" }
];

console.log("🔍 Yedek durumu kontrol ediliyor...\n");

let hasError = false;

for (const entry of filesToCheck) {
  const filePath = path.join(backupDir, entry.file);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ ${entry.name} yedeği bulunamadı: ${entry.file}`);
    hasError = true;
    continue;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️ ${entry.name} yedeği boş veya geçersiz.`);
      hasError = true;
    } else {
      console.log(`✅ ${entry.name} yedeği mevcut. (${data.length} kayıt)`);
    }
  } catch (err) {
    console.error(`❌ ${entry.name} yedeği okunamadı:`, err.message);
    hasError = true;
  }
}

if (!hasError) {
  console.log("\n🎉 Tüm yedek dosyaları sağlıklı görünüyor.");
} else {
  console.log("\n⚠️ Bazı yedeklerde eksiklikler var. Lütfen gözden geçir.");
}