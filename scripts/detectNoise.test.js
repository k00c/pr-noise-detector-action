// to run the tests use `npx jest scripts/detectNoise.test.js`

const fs = require('fs');
const path = require('path');
const { findNoiseFiles, formatNoiseOutput, detectNoiseFiles, reloadIgnorePatterns, loadIgnorePatterns } = require('./detectNoise');

describe('PR Noise Detector', () => {
  const TEST_DIR = 'test-files-temp';

  beforeAll(() => {
    // Setup test files and directories in a test-specific folder
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(`${TEST_DIR}/tmp`, { recursive: true });
    fs.mkdirSync(`${TEST_DIR}/.vscode`, { recursive: true });
    fs.writeFileSync(`${TEST_DIR}/debug.log`, 'debug log');
    fs.writeFileSync(`${TEST_DIR}/tmp/output.txt`, 'output');
    fs.writeFileSync(`${TEST_DIR}/.vscode/settings.json`, '{}');
    fs.writeFileSync(`${TEST_DIR}/index.js`, '// source code');
    fs.writeFileSync(`${TEST_DIR}/README.md`, '# readme');
  });

  afterAll(() => {
    // Cleanup test directory
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.rmSync('.pr-noise-ignore', { force: true });
  });

  afterEach(() => {
    // Clean up any .pr-noise-ignore file after each test
    fs.rmSync('.pr-noise-ignore', { force: true });
  });

  test('flags known noise files', () => {
    const files = [
      'debug.log',
      'tmp/output.txt',
      '.vscode/settings.json',
      'index.js',
      'README.md'
    ];
    const noise = detectNoiseFiles(files);
    expect(noise).toEqual([
      'debug.log',
      'tmp/output.txt',
      '.vscode/settings.json'
    ]);
  });

  test('ignores non-noise files', () => {
    const files = ['index.js', 'README.md'];
    const noise = detectNoiseFiles(files);
    expect(noise).toEqual([]);
  });

  test('handles empty directories', () => {
    const files = [];
    const noise = detectNoiseFiles(files);
    expect(noise).toEqual([]);
  });

  test('respects ignore configuration via parameter', () => {
    const files = [
      'debug.log',
      'tmp/output.txt',
      '.vscode/settings.json',
      'index.js'
    ];
    const ignore = ['debug.log', 'tmp/output.txt'];
    const noise = detectNoiseFiles(files, ignore);
    expect(noise).toEqual(['.vscode/settings.json']);
  });

  test('respects .pr-noise-ignore file', () => {
    // Create a .pr-noise-ignore file
    fs.writeFileSync('.pr-noise-ignore', '# Ignore debug files\ndebug.log\ntmp/*.txt');
    
    // Reload ignore patterns from the file
    reloadIgnorePatterns();

    const files = [
      'debug.log',
      'tmp/output.txt',
      '.vscode/settings.json',
      'scratch.js'
    ];
    const noise = detectNoiseFiles(files);
    
    // debug.log and tmp/output.txt should be ignored
    expect(noise).toEqual([
      '.vscode/settings.json',
      'scratch.js'
    ]);

    // Cleanup
    fs.rmSync('.pr-noise-ignore', { force: true });
    reloadIgnorePatterns(); // Reset to empty patterns
  });

  test('loadIgnorePatterns with custom file path', () => {
    // Create a custom ignore file
    fs.writeFileSync('.test-ignore', 'scratch.*\nexperiments/*');
    
    const patterns = loadIgnorePatterns('.test-ignore');
    
    const files = [
      'scratch.js',
      'experiments/test.js',
      'debug.log',
      '.vscode/settings.json'
    ];
    
    // Test with custom patterns
    const noise = detectNoiseFiles(files, [], patterns);
    
    expect(noise).toEqual([
      'debug.log',
      '.vscode/settings.json'
    ]);

    // Cleanup
    fs.rmSync('.test-ignore', { force: true });
  });

  test('correct output format', () => {
    const noise = ['debug.log', 'tmp/output.txt', '.vscode/settings.json'];
    const output = formatNoiseOutput(noise);
    expect(output).toContain('⚠️ Found 3 potentially superfluous files:');
    expect(output).toContain('debug.log');
    expect(output).toContain('tmp/output.txt');
    expect(output).toContain('.vscode/settings.json');
  });

  test('groups files by directory when above threshold', () => {
    const noise = [
      'logs/debug1.log',
      'logs/debug2.log', 
      'logs/debug3.log',
      'logs/debug4.log',
      'temp/scratch1.js',
      'temp/scratch2.js',
      'single.tmp'
    ];
    const output = formatNoiseOutput(noise, { maxFilesPerDir: 3, groupThreshold: 3 });
    
    expect(output).toContain('⚠️ Found 7 potentially superfluous files:');
    // logs directory should be grouped (4 files >= threshold of 3)
    expect(output).toContain('logs/ (4 files: debug1.log, debug2.log, debug3.log... and 1 more)');
    // temp directory should show individual files (2 files < threshold of 3)
    expect(output).toContain('temp/scratch1.js');
    expect(output).toContain('temp/scratch2.js');
    // root file should show individually
    expect(output).toContain('single.tmp');
  });

  test('shows all files when under maxFilesPerDir limit', () => {
    const noise = [
      'logs/debug1.log',
      'logs/debug2.log', 
      'logs/debug3.log'
    ];
    const output = formatNoiseOutput(noise, { maxFilesPerDir: 5, groupThreshold: 3 });
    
    expect(output).toContain('logs/ (3 files: debug1.log, debug2.log, debug3.log)');
    expect(output).not.toContain('... and');
  });

  test('handles root directory files correctly', () => {
    const noise = [
      'debug1.log',
      'debug2.log',
      'debug3.log',
      'debug4.log'
    ];
    const output = formatNoiseOutput(noise, { maxFilesPerDir: 2, groupThreshold: 3 });
    
    expect(output).toContain('(root) (4 files: debug1.log, debug2.log... and 2 more)');
  });

  test('respects custom groupThreshold', () => {
    const noise = [
      'logs/debug1.log',
      'logs/debug2.log'
    ];
    
    // With threshold 2, should group
    let output = formatNoiseOutput(noise, { maxFilesPerDir: 3, groupThreshold: 2 });
    expect(output).toContain('logs/ (2 files: debug1.log, debug2.log)');
    
    // With threshold 3, should show individually
    output = formatNoiseOutput(noise, { maxFilesPerDir: 3, groupThreshold: 3 });
    expect(output).toContain('logs/debug1.log');
    expect(output).toContain('logs/debug2.log');
  });

  test('handles mixed Windows and Unix paths', () => {
    const noise = [
      'logs\\debug1.log',
      'logs/debug2.log',
      'logs\\debug3.log'
    ];
    const output = formatNoiseOutput(noise, { maxFilesPerDir: 3, groupThreshold: 3 });
    
    expect(output).toContain('logs/ (3 files: debug1.log, debug2.log, debug3.log)');
  });
});
