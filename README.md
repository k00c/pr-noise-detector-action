# PR Noise Detector

Automatically detects and reports superfluous files in pull requests - debug logs, temp files, IDE configs, and other noise that shouldn't be committed.

## Features

- 🔍 Detects common noise patterns (logs, temp files, IDE configs, etc.)
- 💬 Posts a comment on the PR with findings
- ⚙️ Customizable ignore patterns via `.pr-noise-ignore`
- ✅ Zero configuration required

## Usage

Add this to your workflow file (e.g., `.github/workflows/pr-check.yml`):

```yaml
name: PR Quality Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  detect-noise:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: k00c/pr-noise-detector@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration

### Custom Ignore Patterns

Create a `.pr-noise-ignore` file in your repo root:

```
# Ignore specific files
my-debug.log

# Use wildcards
tmp/*.txt
build/*.cache
```

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for PR comments | Yes | `${{ github.token }}` |
| `ignore-file` | Path to custom ignore file | No | `.pr-noise-ignore` |
| `max-files-per-dir` | Max files to show per directory before summarizing | No | `3` |
| `group-threshold` | Min files in a directory to group them | No | `3` |

### Outputs

| Output | Description |
|--------|-------------|
| `noise-found` | Whether noise files were detected |
| `noise-files` | JSON array of detected files |

## Smart Directory Grouping

When multiple noise files are found in the same directory, they're automatically grouped for better readability:

**Before:**
```
⚠️ Found 8 potentially superfluous files:
- logs/debug1.log
- logs/debug2.log
- logs/debug3.log
- logs/debug4.log
- logs/debug5.log
- temp/scratch1.js
- temp/scratch2.js
```

**After:**
```
⚠️ Found 8 potentially superfluous files:
- logs/ (5 files: debug1.log, debug2.log, debug3.log... and 2 more)
- temp/scratch1.js
- temp/scratch2.js
```

The grouping behavior can be customized:
- `group-threshold`: Minimum files needed in a directory to group them (default: 3)
- `max-files-per-dir`: Maximum files to list before adding "... and X more" (default: 3)

## What Gets Detected

- Debug/log files (`.log`, `debug.*`)
- Temporary files (`temp.*`, `tmp/*`)
- IDE configs (`.vscode/`, `.idea/`)
- Scratch/experimental code (`scratch.*`, `experiments/`)
- Test outputs (`test-output.*`)
- And more...

## License

MIT