@echo off
cd /d "%~dp0"
node --env-file-if-exists=.env server/index.mjs
pause
