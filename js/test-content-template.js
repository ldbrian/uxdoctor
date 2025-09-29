/**
 * 内容页面模板测试
 */

const { ContextProcessor } = require('./context-processor.js');

// 创建上下文处理器实例
const processor = new ContextProcessor();

console.log("测试内容页面模板...\n");

const contentContext = {
    industry: "新闻媒体",
    businessGoal: "提高内容消费",
    keyAction: "阅读文章",
    targetUsers: "大众读者",
    otherInfo: "",
    rawContext: "行业：新闻媒体，业务目标：提高内容消费，关键操作：阅读文章，用户群体：大众读者"
};

console.log("输入上下文:", contentContext);

const contentTemplate = processor.generateContentPrompt(contentContext);
console.log("\n生成的内容页面模板:");
console.log(contentTemplate);

const selectedTemplate = processor.selectPromptTemplate(contentContext);
console.log("\n选择的模板:");
console.log(selectedTemplate);

if (selectedTemplate.includes("内容体验优化专家")) {
    console.log("\n✅ 正确选择了内容页面模板");
} else {
    console.log("\n❌ 模板选择可能不正确");
}