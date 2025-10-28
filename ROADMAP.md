# PR Noise Detector - Roadmap

## Current Version: v1.0.0 (MVP)

Simple action to detect noise files in PRs. Keep it focused.

---

## Essential (Before v1.0 Release)
**Priority: HIGH** | **Est. Time: 1-2 hours**

- [ ] Commit `package-lock.json` for reproducible builds
- [ ] Add `.pr-noise-ignore.example` with common patterns
- [ ] Basic error handling (API failures, permissions)
- [ ] Quick Start section in README
- [ ] Tag v1.0.0 release

---

## Nice to Have (v1.1)
**Priority: MEDIUM** | **Est. Time: 2-3 hours**

- [ ] `fail-on-noise: true` option to block PRs
- [ ] Bundle with @vercel/ncc to remove runtime deps
- [ ] Better error messages when things fail
- [ ] Add more default patterns (language-specific)
- [ ] CHANGELOG.md

---

## Maybe Later (v2.0)
**Priority: LOW** | **Consider if requested**

- [ ] Custom pattern input (without .pr-noise-ignore file)
- [ ] Skip check based on PR labels
- [ ] Debug mode for troubleshooting
- [ ] Auto-fix option (risky, probably not needed)

---

## Won't Do (Keep it Simple)

- ❌ Machine learning pattern detection
- ❌ IDE integrations
- ❌ Analytics/telemetry
- ❌ GitHub App version
- ❌ Multi-platform support

---

## Completed

✅ Core noise detection  
✅ Smart directory grouping  
✅ Comment updates (not spam)  
✅ .pr-noise-ignore support  
✅ Unit tests  
✅ Timestamp in comments  
✅ Line limits for readability  

---

**Philosophy:** Keep it simple. It's a 100-line action, not a product.
