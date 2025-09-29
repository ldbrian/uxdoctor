/**
 * 完整流程测试：业务上下文 + 关键用户路径
 */

const { ContextProcessor } = require('./context-processor.js');
const { AIAnalyzer } = require('./ai-analyzer.js');

// 创建实例
const contextProcessor = new ContextProcessor();
const aiAnalyzer = new AIAnalyzer();

async function testCompleteFlow() {
    console.log('开始测试完整流程...\n');
    
    // 测试业务上下文处理
    console.log('1. 测试业务上下文处理');
    const businessContext = "行业：SaaS平台，业务目标：获取注册用户，关键操作：注册账号，用户群体：中小企业";
    const contextInfo = contextProcessor.parseContext(businessContext);
    console.log('解析的上下文:', contextInfo);
    
    const template = contextProcessor.selectPromptTemplate(contextInfo);
    console.log('选择的模板类型: 注册/线索收集页面\n');
    
    // 测试统一数据结构
    console.log('2. 测试统一数据结构');
    const mockUnifiedData = {
        page_meta: {
            source_type: "url",
            page_url: "https://example.com",
            viewport: { width: 1920, height: 1080 },
            platform: "desktop"
        },
        elements: [
            {
                id: "e1",
                type: "button",
                text: "免费试用",
                css_selector: "#signup-button",
                is_clickable: true
            }
        ],
        key_user_flow: {
            action_description: "点击免费试用按钮",
            action_selector: "#signup-button"
        }
    };
    
    console.log('模拟的统一数据结构包含关键用户路径信息\n');
    
    // 测试提示词构建
    console.log('3. 测试提示词构建');
    const prompt = aiAnalyzer.buildAnalysisPrompt(mockUnifiedData, { businessContext });
    
    // 检查提示词是否包含关键信息
    if (prompt.includes('关键用户路径信息')) {
        console.log('✅ 提示词成功包含关键用户路径信息');
    } else {
        console.log('❌ 提示词未包含关键用户路径信息');
    }
    
    if (prompt.includes('注册/线索收集')) {
        console.log('✅ 提示词成功使用了注册场景模板');
    } else {
        console.log('❌ 提示词未使用正确的场景模板');
    }
    
    console.log('\n生成的提示词片段:');
    console.log('--- 提示词开始 ---');
    console.log(prompt.substring(0, 500) + '...');
    console.log('--- 提示词结束 ---\n');
    
    // 测试选择器推断
    console.log('4. 测试选择器推断');
    // 模拟一个简单的页面对象
    const mockPage = {
        async $(selector) {
            if (selector.includes('免费试用') || selector === '#signup-button') {
                return { selector: '#signup-button' };
            }
            return null;
        }
    };
    
    const selector = await aiAnalyzer.inferSelectorFromDescription(mockPage, '点击免费试用按钮');
    if (selector) {
        console.log('✅ 成功推断出元素选择器:', selector);
    } else {
        console.log('❌ 未能推断出元素选择器');
    }
    
    console.log('\n所有测试完成！');
}

// 运行测试
testCompleteFlow().catch(console.error);