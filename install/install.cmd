@echo off
rem Installs RachnaSutra skills into the current project. Usage: install.cmd claude [--dry-run]
if "%~1"=="" (
  echo usage: install.cmd ^<claude^|cursor^|codex^|copilot^|gemini^> [--dry-run]
  exit /b 2
)
npx --yes github:shahvatsalofficial/rachnasutra skills install --host %1 %2 --target .
exit /b %ERRORLEVEL%
