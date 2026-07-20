# Project-specific rules for the agent

## Build & Release
When user says "собрать" or "build":
1. Run `npm run tauri build`
2. Sign the installer with updater key:
   ```
   npx tauri signer sign -k .tauri/updater.key -p "slauncher-update-key-2026" -f src-tauri/target/release/bundle/nsis/PS5\ Launcher_*.exe
   ```
3. Generate `latest.json` for the updater
4. Upload ZIP + latest.json to GitHub Releases

## Updater
- Public key (.pub) is safe to commit
- Private key (`.tauri/updater.key`) must NEVER be committed or shared
- Password: `slauncher-update-key-2026`
