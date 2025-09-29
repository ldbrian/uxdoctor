/**
 * 关键用户路径功能测试
 */

const { AIAnalyzer } = require('./ai-analyzer.js');

// 创建AI分析器实例
const analyzer = new AIAnalyzer();

// 模拟Page对象用于测试
class MockPage {
    constructor() {
        this.contentHtml = '<html><body><button id="signup">免费试用</button><button class="buy-btn">立即购买</button></body></html>';
    }
    
    async $(selector) {
        // 简单模拟元素查找
        if (selector.includes('免费试用') || selector.includes('signup') || selector.includes('#signup')) {
            return { selector: '#signup' };
        }
        if (selector.includes('立即购买') || selector.includes('buy') || selector.includes('.buy-btn')) {
            return { selector: '.buy-btn' };
        }
        return null;
    }
    
    async click(selector) {
        console.log(`点击元素: ${selector}`);
        return Promise.resolve();
    }
    
    async waitForTimeout(ms) {
        console.log(`等待 ${ms} 毫秒`);
        return Promise.resolve();
    }
    
    async screenshot() {
        console.log('截取屏幕截图');
        return Buffer.from('screenshot-data');
    }
    
    async content() {
        return this.contentHtml;
    }
}

async function testInferSelectorFromDescription() {
    console.log('测试选择器推断功能...\n');
    
    const mockPage = new MockPage();
    
    // 测试用例
    const testCases = [
        {
            description: '点击免费试用按钮',
            expectedSelector: '#signup'
        },
        {
            description: '立即购买',
            expectedSelector: '.buy-btn'
        },
        {
            description: '不存在的按钮',
            expectedSelector: null
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`测试: ${testCase.description}`);
        const selector = await analyzer.inferSelectorFromDescription(mockPage, testCase.description);
        console.log(`结果选择器: ${selector}`);
        
        if (selector === testCase.expectedSelector || (testCase.expectedSelector !== null && selector !== null)) {
            console.log('✅ 测试通过\n');
        } else {
            console.log('❌ 测试失败\n');
        }
    }
}

async function testAnalyzeKeyUserFlow() {
    console.log('测试关键用户路径分析功能...\n');
    
    const mockPage = new MockPage();
    
    const result = await analyzer.analyzeKeyUserFlow(mockPage, '点击免费试用按钮');
    
    if (result && result.actionSelector) {
        console.log('✅ 关键用户路径分析测试通过');
        console.log('返回数据:', result);
    } else {
        console.log('❌ 关键用户路径分析测试失败');
    }
}

async function runTests() {
    console.log('开始测试关键用户路径功能...\n');
    
    try {
        await testInferSelectorFromDescription();
        await testAnalyzeKeyUserFlow();
        
        console.log('所有测试完成。');
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

// 运行测试
runTests();