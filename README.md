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

### Outputs

| Output | Description |
|--------|-------------|
| `noise-found` | Whether noise files were detected |
| `noise-files` | JSON array of detected files |

## What Gets Detected

- Debug/log files (`.log`, `debug.*`)
- Temporary files (`temp.*`, `tmp/*`)
- IDE configs (`.vscode/`, `.idea/`)
- Scratch/experimental code (`scratch.*`, `experiments/`)
- Test outputs (`test-output.*`)
- And more...

## License

MIT