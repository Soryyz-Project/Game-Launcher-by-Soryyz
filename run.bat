@echo off
cd /d "%~dp0"
set CARGO_HOME=%USERPROFILE%\.cargo
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
npm run tauri dev
