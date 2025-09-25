# UXDoctor - 用户体验体检工具

UXDoctor 是一款面向中小企业和外包公司的轻量级自动化 UX 体验体检工具，旨在帮助用户快速发现 App/网站的可用性问题，并通过报告引导其购买更深入的人工咨询服务。

## 功能特点

- 支持 URL、截图、原型链接输入
- 自动检测基础 UX 问题（对比度、文案、表单等）
- AI 辅助分析界面并提出优化建议
- 生成评分卡、问题清单、改进建议和升级 CTA 的完整报告

## 技术架构

### 前端
- HTML5 + CSS3 + JavaScript (原生)
- 响应式设计，适配移动端和桌面端

### 后端
- Node.js + Express
- AI 分析引擎（支持 OpenAI 和 DeepSeek 双模型）
- Playwright 用于页面抓取和截图
- Lighthouse 用于性能分析
- axe-core 用于可访问性检查

### AI 模型
- 主模型：OpenAI GPT 或 DeepSeek（可配置）
- 备用模型：当主模型不可用时自动切换
- 模拟分析：当所有 AI 模型都不可用时的降级方案

## 规则引擎与AI协同工作

UXDoctor采用规则引擎与AI协同工作的混合分析方法：

1. **规则引擎先执行**：基于结构化UI元素树执行量化规则检查，输出原始问题列表（可量化）
2. **AI进行增强分析**：将结构化UI树和原始问题作为上下文交给LLM，进行润色说明、优先级排序和补充主观问题
3. **健全性检查**：对AI输出进行验证，确保逻辑一致性

### 统一数据模型

为了使 LLM 和规则引擎都能基于相同的数据进行分析，我们设计了一个统一的 UI 元素树数据模型：

```json
{
  "page_meta": {
    "source_type": "url",        // or "screenshot"
    "page_url": "https://...",
    "viewport": {"width": 390, "height": 844},
    "platform": "mobile"         // "desktop" | "mobile"
  },
  "elements": [
    {
      "id": "e1",
      "type": "button",          // button, input, heading, image, card, nav, link, banner...
      "text": "立即购买",
      "bbox": [x,y,w,h],
      "confidence": 0.92,        // from visual detector
      "source": ["ocr","vision","dom"], 
      "dom_path": "body>div>button#buy",
      "css": {"fontSize": "16px", "color":"#ff5a1f", "background":"#fff"},
      "aria": {"role":"button","label":"buy"},
      "contrast_ratio": 6.8,
      "is_clickable": true
    }
  ],
  "performance": {"lighthouse_score": 55, "first_contentful_paint": 3.2},
  "axe_issues": [ /* axe-core raw issues if url mode */ ]
}
```

这个统一的数据模型允许：
1. LLM 基于结构化数据进行分析，提高分析准确性和一致性
2. 规则引擎基于相同的数据进行硬性规则检查
3. 不同信号源（DOM、视觉识别、OCR等）的融合

## 安装和使用

1. 克隆项目到本地：
   ```
   git clone <repository-url>
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 安装 Playwright 浏览器驱动：
   ```
   npx playwright install
   ```

4. 配置 API 密钥：
   - 复制 `config.example.json` 为 `config.json`
   - 在 `config.json` 中填入您的 OpenAI 或 DeepSeek API 密钥

5. 启动服务：
   ```
   node server.js
   ```

6. 在浏览器中访问 `http://localhost:8080`

## 配置说明

### API 密钥配置
在 `config.json` 文件中配置您的 API 密钥：

```json
{
  "openaiApiKey": "your-openai-api-key",
  "deepSeekApiKey": "your-deepseek-api-key",
  "primaryAI": "openai"
}
```

### 环境变量配置
您也可以通过环境变量配置：

```
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
PRIMARY_AI=openai
```

## 目录结构

```
uxdoctor/
├── assets/              # 静态资源文件
├── components/          # 组件文件
├── css/                 # 样式文件
├── js/                  # JavaScript 文件
│   ├── ai-analyzer.js   # AI分析器
│   ├── rules-engine.js  # 规则引擎
│   ├── usability-rules.js # 可用性规则库
│   └── ...
├── routes/              # API 路由
├── uploads/             # 上传文件目录
├── config.example.json  # 配置文件示例
├── config.json          # 配置文件
├── server.js            # 服务入口文件
├── index.html           # 首页
├── report.html          # 报告页
├── README.md            # 说明文档
└── package.json         # 项目依赖
```

## 开发指南

### 添加新的可用性检查规则

可用性检查规则定义在 `js/usability-rules.js` 文件中。要添加新的规则，请在相应的类别下添加新的检查项。

### 扩展规则引擎

规则引擎实现在 `js/rules-engine.js` 文件中。您可以在此文件中添加新的量化规则检查。

### 扩展 AI 分析功能

AI 分析功能实现在 `js/ai-analyzer.js` 文件中。您可以在此文件中添加新的分析维度或改进现有的分析逻辑。

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 UXDoctor。

## 许可证

[MIT](LICENSE)