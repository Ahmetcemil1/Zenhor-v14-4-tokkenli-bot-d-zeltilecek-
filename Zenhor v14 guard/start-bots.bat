@echo off
title Zenhor Guard Bot Başlatılıyor...
color 0a

echo [1] Bot1 başlatılıyor...
start cmd /k "cd bots && node bot1-member.js"

echo [2] Bot2 başlatılıyor...
start cmd /k "cd bots && node bot2-role.js"

echo [3] Bot3 başlatılıyor...
start cmd /k "cd bots && node bot3-channel.js"

echo [4] Bot4 başlatılıyor...
start cmd /k "cd bots && node bot4-guild.js"

echo --------------------------------------
echo ✅ Tüm botlar ayrı pencerelerde başlatıldı.
pause