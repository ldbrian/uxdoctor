/**
 * 业务上下文处理器
 * 用于将用户输入的业务上下文转换为AI能理解的提示词
 */

class ContextProcessor {
    /**
     * 将业务上下文转换为结构化提示信息
     * @param {string} businessContext - 用户输入的业务上下文文本
     * @returns {Object} 结构化的上下文信息
     */
    parseContext(businessContext) {
        if (!businessContext || businessContext.trim() === '') {
            return {
                industry: '未指定',
                businessGoal: '未指定',
                keyAction: '未指定',
                targetUsers: '未指定',
                otherInfo: '未提供其他信息',
                rawContext: businessContext || ''
            };
        }

        // 提取关键信息的正则表达式
        const patterns = {
            industry: [/行业[:：]?\s*([^，,。\n]+)/, /领域[:：]?\s*([^，,。\n]+)/],
            businessGoal: [/业务目标[:：]?\s*([^，,。\n]+)/, /核心目标[:：]?\s*([^，,。\n]+)/, /目标[:：]?\s*([^，,。\n]+)/],
            keyAction: [/关键操作[:：]?\s*([^，,。\n]+)/, /用户操作[:：]?\s*([^，,。\n]+)/, /操作[:：]?\s*([^，,。\n]+)/],
            targetUsers: [/目标用户[:：]?\s*([^，,。\n]+)/, /用户群体[:：]?\s*([^，,。\n]+)/, /用户[:：]?\s*([^，,。\n]+)/]
        };

        // 初始化结果对象
        const result = {
            industry: '未明确指定',
            businessGoal: '未明确指定',
            keyAction: '未明确指定',
            targetUsers: '未明确指定',
            otherInfo: '',
            rawContext: businessContext
        };

        // 提取结构化信息
        for (const [key, regexList] of Object.entries(patterns)) {
            for (const regex of regexList) {
                const match = businessContext.match(regex);
                if (match && match[1].trim() !== '') {
                    result[key] = match[1].trim();
                    break;
                }
            }
        }

        // 提取其他信息（去除已提取的信息）
        let otherInfo = businessContext;
        Object.values(patterns).flat().forEach(regex => {
            otherInfo = otherInfo.replace(regex, '');
        });
        
        // 清理其他信息
        otherInfo = otherInfo.replace(/[，,；;]?\s*$/g, '').trim();
        if (otherInfo) {
            result.otherInfo = otherInfo;
        }

        return result;
    }

    /**
     * 将结构化上下文信息转换为AI提示词
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} AI友好的提示词
     */
    generatePrompt(contextInfo) {
        const promptParts = [];
        
        promptParts.push(`业务领域/行业: ${contextInfo.industry}`);
        promptParts.push(`核心业务目标: ${contextInfo.businessGoal}`);
        promptParts.push(`关键用户操作: ${contextInfo.keyAction}`);
        promptParts.push(`目标用户群体: ${contextInfo.targetUsers}`);
        
        if (contextInfo.otherInfo && contextInfo.otherInfo !== '未提供其他信息') {
            promptParts.push(`其他相关信息: ${contextInfo.otherInfo}`);
        }
        
        return promptParts.join('\n');
    }

    /**
     * 处理业务上下文并生成AI提示词
     * @param {string} businessContext - 用户输入的业务上下文文本
     * @returns {string} AI友好的完整提示词
     */
    processContext(businessContext) {
        const contextInfo = this.parseContext(businessContext);
        return this.generatePrompt(contextInfo);
    }

    /**
     * 生成分析框架提示词
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} 分析框架提示词
     */
    generateAnalysisFramework(contextInfo) {
        return `基于以下业务背景进行分析：
1. 业务领域/行业: ${contextInfo.industry}
2. 核心业务目标: ${contextInfo.businessGoal}
3. 关键用户操作: ${contextInfo.keyAction}
4. 目标用户群体: ${contextInfo.targetUsers}
${contextInfo.otherInfo && contextInfo.otherInfo !== '未提供其他信息' ? `5. 其他相关信息: ${contextInfo.otherInfo}` : ''}

请基于以上背景信息，分析页面设计如何有效地服务于业务目标，并识别出阻碍目标达成的体验问题。`;
    }

    /**
     * 为注册/线索收集页面生成专门的提示词模板
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} 注册页面专用提示词
     */
    generateRegistrationPrompt(contextInfo) {
        return `你是一个专注于转化率优化的专家。正在分析一个【${contextInfo.industry}】产品的注册页面。

核心任务：找出所有阻碍用户完成【${contextInfo.keyAction}】的体验问题。

转化漏斗分析框架：
1. 注意力吸引：首屏能否在3秒内让用户理解价值主张？
2. 信任建立：是否有足够的社会证明消除用户顾虑？ 
3. 行动引导：注册路径是否清晰无摩擦？
4. 风险降低：是否消除了用户的决策障碍？

请重点分析注册表单的复杂性、信任要素的完整性、行动号召的有效性。每个问题必须关联到对注册转化率的潜在影响。`;
    }

    /**
     * 为促成交易页面生成专门的提示词模板
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} 交易页面专用提示词
     */
    generateTransactionPrompt(contextInfo) {
        return `你是一个电商体验专家。分析【${contextInfo.industry}】产品的商品详情页。

核心任务：优化从浏览到【${contextInfo.keyAction}】的购物体验。

购买决策分析框架：
1. 信息完整性：产品信息是否足够支持购买决策？
2. 价值感知：价格展示和价值主张是否匹配？
3. 购买便利性：加购/结算流程是否顺畅？
4. 风险消除：退货政策、支付安全等信任要素是否突出？

重点关注购买按钮的可见性、价格展示的清晰度、信任标志的完整性。`;
    }

    /**
     * 为内容页面生成专门的提示词模板
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} 内容页面专用提示词
     */
    generateContentPrompt(contextInfo) {
        return `你是一个内容体验优化专家。分析【${contextInfo.industry}】产品的${contextInfo.keyAction}页面。

核心任务：提升内容的可发现性和用户阅读体验。

内容体验分析框架：
1. 内容组织：信息架构是否清晰，用户能否快速找到感兴趣的内容？
2. 阅读体验：内容展示是否易于阅读和理解？
3. 互动设计：点赞、评论、分享等互动元素是否易于使用？
4. 个性化：是否根据用户兴趣推荐相关内容？

重点关注内容的可读性、导航的直观性、信息的相关性。`;
    }

    /**
     * 根据业务目标选择合适的提示词模板
     * @param {Object} contextInfo - 结构化的上下文信息
     * @returns {string} 适当的提示词模板
     */
    selectPromptTemplate(contextInfo) {
        // 基于业务目标关键词选择模板
        const businessGoal = contextInfo.businessGoal.toLowerCase();
        const keyAction = contextInfo.keyAction.toLowerCase();
        
        // 注册/线索收集相关关键词
        const registrationKeywords = ['注册', '注册用户', '获取用户', '获取线索', '用户注册', 'lead', 'signup', 'register', '用户增长'];
        
        // 交易/购买相关关键词
        const transactionKeywords = ['购买', '交易', '下单', '支付', '成交', 'buy', 'purchase', 'order', 'pay', '销售', '销售额'];
        
        // 内容消费相关关键词
        const contentKeywords = ['阅读', '浏览', '内容消费', '内容发现', '文章阅读', '观看', '学习', '了解', 'read', 'view', 'learn', 'watch'];
        
        // 检查是否匹配注册场景
        if (registrationKeywords.some(keyword => businessGoal.includes(keyword) || keyAction.includes(keyword))) {
            return this.generateRegistrationPrompt(contextInfo);
        }
        
        // 检查是否匹配交易场景
        if (transactionKeywords.some(keyword => businessGoal.includes(keyword) || keyAction.includes(keyword))) {
            return this.generateTransactionPrompt(contextInfo);
        }
        
        // 检查是否匹配内容场景
        if (contentKeywords.some(keyword => businessGoal.includes(keyword) || keyAction.includes(keyword))) {
            return this.generateContentPrompt(contextInfo);
        }
        
        // 默认使用通用模板
        return this.generateAnalysisFramework(contextInfo);
    }
}

// 导出上下文处理器
const contextProcessor = new ContextProcessor();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContextProcessor, contextProcessor };
}