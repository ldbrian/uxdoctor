/**
 * 模板选择测试
 */

const { ContextProcessor } = require('./context-processor.js');

// 创建上下文处理器实例
const processor = new ContextProcessor();

// 测试用例
const testCases = [
    {
        name: "注册场景",
        input: "行业：SaaS平台，业务目标：获取注册用户，关键操作：注册账号，用户群体：中小企业",
        expectedTemplate: "注册"
    },
    {
        name: "购买场景",
        input: "行业：电商平台，业务目标：提升销售额，关键操作：完成购买，用户群体：年轻消费者",
        expectedTemplate: "电商"
    },
    {
        name: "通用场景",
        input: "行业：内容平台，业务目标：提高用户活跃度，关键操作：浏览内容，用户群体：大众用户",
        expectedTemplate: "通用"
    }
];

console.log("开始测试模板选择功能...\n");

testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: "${testCase.input}"`);
    
    const contextInfo = processor.parseContext(testCase.input);
    console.log("解析的上下文:", contextInfo);
    
    const template = processor.selectPromptTemplate(contextInfo);
    console.log("选择的模板:");
    console.log(template);
    
    // 检查是否选择了正确的模板
    if (testCase.expectedTemplate === "注册" && template.includes("转化率优化的专家")) {
        console.log("✅ 正确选择了注册模板");
    } else if (testCase.expectedTemplate === "电商" && template.includes("电商体验专家")) {
        console.log("✅ 正确选择了电商模板");
    } else if (testCase.expectedTemplate === "通用" && template.includes("业务背景进行分析")) {
        console.log("✅ 正确选择了通用模板");
    } else {
        console.log("❌ 模板选择可能不正确");
    }
    
    console.log("---\n");
});

console.log("测试完成。");