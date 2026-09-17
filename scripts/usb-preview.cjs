const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.EXPO_PORT || '8081';
const action = process.argv[2] || 'setup';

function adbPath() {
  if (process.env.ADB && fs.existsSync(process.env.ADB)) return process.env.ADB;
  const fromPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['adb'], { encoding: 'utf8' });
  const found = (fromPath.stdout || '').split(/\r?\n/).map((line) => line.trim()).find((line) => line && fs.existsSync(line));
  if (found) return found;
  const roots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')].filter(Boolean);
  for (const root of roots) {
    const candidate = path.join(root, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function adb(adbBin, args) {
  const result = spawnSync(adbBin, args, { encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function devices(adbBin) {
  const { stdout } = adb(adbBin, ['devices', '-l']);
  return stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, state] = line.split(/\s+/);
      return { id, state, raw: line };
    });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const adbBin = adbPath();
if (!adbBin) {
  fail([
    'adb를 찾지 못했습니다.',
    'Android Studio SDK의 platform-tools를 설치하거나, PATH에 넣은 뒤 다시 실행하세요.',
    '예: %LOCALAPPDATA%\\Android\\Sdk\\platform-tools',
  ].join('\n'));
}

const phone = devices(adbBin);
if (!phone.length) fail('연결된 기기가 없습니다. USB 케이블, 파일 전송(MTP), USB 디버깅 허용을 확인하세요.');
const ready = phone.filter((item) => item.state === 'device');
if (!ready.length) {
  fail(`기기가 준비되지 않았습니다.\n${phone.map((item) => item.raw).join('\n')}\n폰에서 USB 디버깅 허용을 누르고, unauthorized면 해제한 뒤 다시 꽂으세요.`);
}
if (ready.length > 1) {
  console.warn(`기기가 ${ready.length}대입니다. 첫 번째(${ready[0].id})만 사용합니다.`);
}

if (action === 'devices') {
  console.log(phone.map((item) => item.raw).join('\n'));
  process.exit(0);
}

const reverse = adb(adbBin, ['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
if (reverse.status !== 0) fail(`adb reverse 실패: ${reverse.stderr || reverse.stdout || PORT}`);
console.log(`adb reverse tcp:${PORT} tcp:${PORT}`);

if (action === 'open') {
  const opened = adb(adbBin, ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `exp://127.0.0.1:${PORT}`]);
  if (opened.status !== 0) fail(`Expo Go를 열지 못했습니다. 폰에 Expo Go(SDK 57)가 있는지 확인하세요.\n${opened.stderr || opened.stdout}`);
  console.log(`Expo Go에 exp://127.0.0.1:${PORT} 를 열었습니다.`);
}
