# UXDoctor 规则引擎说明

## 概述

UXDoctor 规则引擎是一个基于结构化 UI 元素树执行量化规则检查的系统。它首先运行并输出原始问题列表（raw issues），然后将结构化 UI 树和原始问题作为上下文交给 LLM 进行润色说明、优先级排序和补充主观问题。

## 工作流程

1. **数据抓取**：使用 Playwright 抓取页面的 DOM 节点、计算样式、可访问性树等信息
2. **数据转换**：将原始数据转换为统一的 UI 元素树结构
3. **规则引擎执行**：规则引擎基于统一数据模型执行量化规则检查，生成原始问题列表
4. **LLM 分析**：将结构化 UI 树和原始问题交给 LLM 进行润色、优先级排序和补充主观问题
5. **健全性检查**：对 LLM 输出进行最终验证，确保逻辑一致性

## 统一数据模型

```json
{
  "page_meta": {
    "source_type": "url",
    "page_url": "https://example.com",
    "viewport": {"width": 390, "height": 844},
    "platform": "mobile"
  },
  "elements": [
    {
      "id": "e1",
      "type": "button",
      "text": "立即购买",
      "bbox": [x,y,w,h],
      "confidence": 0.92,
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

## 规则引擎功能

规则引擎会检查以下类型的量化问题：

### 1. 对比度检查
- 检查文字与背景的对比度比率是否符合 WCAG AA 标准（≥4.5:1）
- 根据对比度值确定问题严重性

### 2. 字体大小检查
- 检查正文是否小于推荐的 14px
- 标识可能影响可读性的小字体

### 3. 可点击元素尺寸检查
- 检查可点击元素是否小于推荐的 44x44px
- 确保触摸设备上的良好用户体验

### 4. 表单元素检查
- 检查表单控件是否有适当的标签
- 识别缺少必填标识的字段

### 5. ARIA 标签检查
- 检查可交互元素是否有适当的 ARIA 标签
- 确保屏幕阅读器的可访问性

### 6. 图片 Alt 属性检查
- 检查图片是否有有意义的替代文本
- 提高视觉障碍用户的体验

## LLM 分析提示

```
你是资深UX审计师。输入是页面的结构化元素数组（type, text, bbox, css, aria, contrast_ratio, source, confidence）。
请按以下格式输出 JSON 列表 issues：
[
  {
    "element_id":"e1",
    "rule_id":"contrast-001",
    "severity":"high",
    "confidence":0.88,
    "explanation":"文字与背景对比比率为 2.1:1，低于 WCAG AA 要求 4.5:1，可能导致低视力用户无法阅读。",
    "suggestion":"将文字颜色改为 #222 或背景改浅，确保对比 >= 4.5:1。",
    "evidence": "contrast_ratio=2.1, fontSize=14px"
  }, ...
]
```

## 健全性检查

LLM 输出后，系统会进行健全性检查：
- 如果 AI 给出对比问题但 contrast_ratio > 4.5 则标为"待人工复核"
- 可以扩展更多验证规则确保输出质量

## 扩展性

规则引擎设计为可扩展的模块，可以轻松添加新的规则检查：
1. 在 `rules-engine.js` 中添加新的检查方法
2. 在 `executeRules` 方法中调用新方法
3. 确保新规则输出符合指定格式