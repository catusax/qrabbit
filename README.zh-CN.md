# QRabbit

[English README](README.md)

## 项目介绍

QRabbit 是一个浏览器二维码扩展，包含 3 个核心功能：

- Popup：可编辑 URL，并即时生成对应二维码。
- 右键菜单：可对页面图片执行二维码扫描。
- Sidebar：显示当前页面信息，并展示页面二维码扫描结果。

## 开发与构建命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

浏览器目标（默认 Chromium）：

```bash
# Chrome
npm run dev -- --browser=chrome

# Edge
npm run dev -- --browser=edge

# Firefox
npm run dev -- --browser=firefox
```

## 使用说明

1. **Popup 生成二维码**
   - 打开扩展 Popup。
   - 编辑或粘贴 URL。
   - 查看自动生成的二维码。

2. **右键扫描图片二维码**
   - 在网页图片上点击右键。
   - 选择扩展提供的扫描菜单。
   - 查看识别出的二维码内容。

3. **Sidebar 查看页面与扫描结果**
   - 打开扩展 Sidebar。
   - 查看当前页面信息。
   - 查看页面二维码扫描结果。
