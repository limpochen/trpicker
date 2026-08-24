# Changelog
---
## [1.0.0] - 2026-08-24

### Added

- 首次正式发布到 npm（包名 `trpicker`）。
- MIT 开源协议（`LICENSE`）。
- 构建脚本生成单文件 bundle（`dist/trpicker.js`），支持 `<script>` 直接引入或通过 unpkg / jsdelivr CDN 使用。
- 自动发布流水线：推送版本 tag 自动触发 npm 发布并生成 GitHub Release。
- 在线演示自动部署到 GitHub Pages。

### Changed

- 版本号统一调整为 1.0.0。
- 项目结构从 `public/` 重构为 `src/`，构建产物输出到 `dist/`。
- 构建脚本、`package.json` 的入口与文件清单同步适配新目录结构。

### Maintenance

- 统一项目版本为 1.0.0。
