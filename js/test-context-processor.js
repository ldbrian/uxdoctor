/**
 * 上下文处理器测试
 */

const { ContextProcessor } = require('./context-processor.js');

// 创建上下文处理器实例
const processor = new ContextProcessor();

// 测试用例
const testCases = [
    {
        name: "完整业务上下文",
        input: "行业：电商平台，业务目标：提升销售额，关键操作：完成购买，用户群体：年轻消费者，其他：关注移动端体验",
        expected: {
            industry: "电商平台",
            businessGoal: "提升销售额",
            keyAction: "完成购买",
            targetUsers: "年轻消费者"
        }
    },
    {
        name: "部分业务上下文",
        input: "我们的目标是增加用户注册量，主要用户是企业客户",
        expected: {
            businessGoal: "增加用户注册量",
            targetUsers: "企业客户"
        }
    },
    {
        name: "无结构上下文",
        input: "我们是一个教育科技公司，希望提高课程完成率，主要用户是大学生",
        expected: {
            industry: "教育科技公司",
            businessGoal: "提高课程完成率",
            targetUsers: "大学生"
        }
    },
    {
        name: "空上下文",
        input: "",
        expected: {
            industry: "未指定",
            businessGoal: "未指定",
            keyAction: "未指定",
            targetUsers: "未指定"
        }
    }
];

console.log("开始测试上下文处理器...\n");

testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: "${testCase.input}"`);
    
    const result = processor.parseContext(testCase.input);
    console.log(`输出:`, result);
    
    // 检查预期字段
    let pass = true;
    for (const [key, value] of Object.entries(testCase.expected)) {
        if (result[key] !== value) {
            console.log(`❌ 失败: 字段 ${key} 期望值 "${value}", 实际值 "${result[key]}"`);
            pass = false;
        }
    }
    
    if (pass) {
        console.log("✅ 通过");
    }
    
    // 测试提示词生成
    const prompt = processor.generatePrompt(result);
    console.log(`生成的提示词:\n${prompt}\n`);
    
    console.log("---\n");
});

console.log("测试完成。");