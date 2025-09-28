/**
 * UXDoctor 分析引擎
 * 负责处理用户输入并生成分析结果
 */

// 导入规则库
const { usabilityRules } = require('./usability-rules.js');
const { aiAnalyzer } = require('./ai-analyzer.js'); // 添加这一行来导入aiAnalyzer

// 简单的内存缓存
const analysisCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存时间

class UXAnalysisEngine {
    constructor() {
        // 使用可用性规则库中的规则
        this.rules = usabilityRules.getAllRules();
        // 定期清理过期缓存
        setInterval(this.cleanupCache.bind(this), 60 * 1000); // 每分钟检查一次
    }

    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of analysisCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                analysisCache.delete(key);
            }
        }
    }

    /**
     * 分析网站URL
     * @param {string} url - 网站URL
     * @param {Object} options - 分析选项
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeURL(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // 检查缓存
        if (analysisCache.has(cacheKey)) {
            const cached = analysisCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('从缓存返回结果:', url);
                return Promise.resolve(cached.result);
            } else {
                // 缓存过期，删除
                analysisCache.delete(cacheKey);
            }
        }

        // 在实际实现中，这里会调用真实的分析服务
        // 目前我们模拟分析过程
        return new Promise((resolve) => {
            setTimeout(async () => {
                // 调用AI分析器进行真实分析
                const result = await aiAnalyzer.analyzeURL(url, options);
                
                // 缓存结果
                analysisCache.set(cacheKey, {
                    result: result,
                    timestamp: Date.now()
                });
                resolve(result);
            }, 2000);
        });
    }

    /**
     * 分析截图
     * @param {string} screenshotPath - 截图文件路径
     * @param {Object} options - 分析选项
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeScreenshot(screenshotPath, options = {}) {
        // 为截图生成唯一标识符
        const screenshotId = screenshotPath + '_' + JSON.stringify(options);
        
        // 检查缓存
        if (analysisCache.has(screenshotId)) {
            const cached = analysisCache.get(screenshotId);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('从缓存返回截图分析结果:', screenshotId);
                return Promise.resolve(cached.result);
            } else {
                // 缓存过期，删除
                analysisCache.delete(screenshotId);
            }
        }

        // 在实际实现中，这里会处理截图并进行分析
        // 目前我们模拟分析过程
        return new Promise((resolve) => {
            setTimeout(async () => {
                // 调用AI分析器进行真实分析
                const result = await aiAnalyzer.analyzeScreenshot(screenshotPath, options);
                
                // 缓存结果
                analysisCache.set(screenshotId, {
                    result: result,
                    timestamp: Date.now()
                });
                resolve(result);
            }, 2000);
        });
    }

    /**
     * 生成模拟分析结果
     * @param {string} input - 输入源标识
     * @returns {Object} 分析结果
     */
    generateMockResult(input) {
        // 获取按严重程度排序的检查项
        const checksBySeverity = usabilityRules.getRulesBySeverity();
        
        // 基于输入内容生成稳定的哈希值，用于确定性随机选择
        const hash = this.hashCode(input);
        
        // 从规则库中选择严重问题（仅选择严重程度为critical的）
        const criticalIssues = this.selectStableItems(
            checksBySeverity.filter(c => c.severity === 'critical'), 
            1, 
            3,
            hash
        );
        
        return {
            input: input,
            timestamp: new Date().toISOString(),
            overallScore: this.generateStableScore(input, 60, 95), // 提高分数范围的一致性
            rules: this.rules,
            dimensions: {
                navigation: {
                    score: this.generateStableScore(input + 'navigation', 55, 95),
                    issues: this.generateNavigationIssuesFromRules(input),
                    recommendations: this.generateNavigationRecommendationsFromRules(input)
                },
                visual: {
                    score: this.generateStableScore(input + 'visual', 60, 95),
                    issues: this.generateVisualIssuesFromRules(input),
                    recommendations: this.generateVisualRecommendationsFromRules(input)
                },
                form: {
                    score: this.generateStableScore(input + 'form', 50, 90),
                    issues: this.generateFormIssuesFromRules(input),
                    recommendations: this.generateFormRecommendationsFromRules(input)
                },
                information: {
                    score: this.generateStableScore(input + 'information', 65, 95),
                    issues: this.generateInformationIssuesFromRules(input),
                    recommendations: this.generateInformationRecommendationsFromRules(input)
                },
                performance: {
                    score: this.generateStableScore(input + 'performance', 55, 90),
                    issues: this.generatePerformanceIssuesFromRules(input),
                    recommendations: this.generatePerformanceRecommendationsFromRules(input)
                },
                accessibility: {
                    score: this.generateStableScore(input + 'accessibility', 50, 90),
                    issues: this.generateAccessibilityIssuesFromRules(input),
                    recommendations: this.generateAccessibilityRecommendationsFromRules(input)
                },
                security: {
                    score: this.generateStableScore(input + 'security', 70, 95),
                    issues: this.generateSecurityIssuesFromRules(input),
                    recommendations: this.generateSecurityRecommendationsFromRules(input)
                }
            },
            criticalIssues: criticalIssues,
            summary: this.generateStableSummary(input)
        };
    }

    /**
     * 生成稳定的哈希值
     * @param {string} str - 输入字符串
     * @returns {number} 哈希值
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash);
    }

    /**
     * 生成稳定的分数
     * @param {string} seed - 种子字符串
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 稳定的分数
     */
    generateStableScore(seed, min, max) {
        const hash = this.hashCode(seed);
        return min + (hash % (max - min + 1));
    }

    /**
     * 稳定地选择项目
     * @param {Array} items - 项目列表
     * @param {number} min - 最小选择数
     * @param {number} max - 最大选择数
     * @param {number} seed - 种子值
     * @returns {Array} 选中的项目
     */
    selectStableItems(items, min, max, seed) {
        // 确保至少返回一个项目
        if (items.length === 0) return [];
        
        // 基于种子确定选择数量
        const range = max - min + 1;
        const count = min + (seed % range);
        
        // 稳定地打乱数组
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = seed % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled.slice(0, Math.min(count, items.length));
    }

    /**
     * 从规则库生成导航相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateNavigationIssuesFromRules(seed) {
        // 从规则库获取导航相关检查项
        const navChecks = usabilityRules.getChecksByCategoryName('导航与信息架构');
        const issues = navChecks.map(check => check.description);
        const hash = this.hashCode(seed + 'navigation');
        return this.selectStableItems(issues, 1, 3, hash);
    }

    /**
     * 从规则库生成导航相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateNavigationRecommendationsFromRules(seed) {
        // 从规则库获取导航相关检查项并生成建议
        const navChecks = usabilityRules.getChecksByCategoryName('导航与信息架构');
        const recommendations = navChecks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'navigation');
        return this.selectStableItems(recommendations, 1, 3, hash);
    }

    /**
     * 从规则库生成视觉相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateVisualIssuesFromRules(seed) {
        // 从规则库获取视觉相关检查项
        const checks = usabilityRules.getChecksByCategoryName('内容与可读性');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'visual');
        return this.selectStableItems(issues, 1, 3, hash);
    }

    /**
     * 从规则库生成视觉相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateVisualRecommendationsFromRules(seed) {
        // 从规则库获取视觉相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('内容与可读性');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'visual');
        return this.selectStableItems(recommendations, 1, 3, hash);
    }

    /**
     * 从规则库生成表单相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateFormIssuesFromRules(seed) {
        // 从规则库获取表单相关检查项
        const checks = usabilityRules.getChecksByCategoryName('表单与输入');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'form');
        return this.selectStableItems(issues, 1, 3, hash);
    }

    /**
     * 从规则库生成表单相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateFormRecommendationsFromRules(seed) {
        // 从规则库获取表单相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('表单与输入');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'form');
        return this.selectStableItems(recommendations, 1, 3, hash);
    }

    /**
     * 从规则库生成信息架构相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateInformationIssuesFromRules(seed) {
        // 从规则库获取信息架构相关检查项
        const checks = usabilityRules.getChecksByCategoryName('导航与信息架构');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'information');
        return this.selectStableItems(issues, 1, 2, hash);
    }

    /**
     * 从规则库生成信息架构相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateInformationRecommendationsFromRules(seed) {
        // 从规则库获取信息架构相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('导航与信息架构');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'information');
        return this.selectStableItems(recommendations, 1, 2, hash);
    }

    /**
     * 从规则库生成性能相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generatePerformanceIssuesFromRules(seed) {
        // 从规则库获取性能相关检查项
        const checks = usabilityRules.getChecksByCategoryName('性能与移动端');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'performance');
        return this.selectStableItems(issues, 1, 2, hash);
    }

    /**
     * 从规则库生成性能相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generatePerformanceRecommendationsFromRules(seed) {
        // 从规则库获取性能相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('性能与移动端');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'performance');
        return this.selectStableItems(recommendations, 1, 2, hash);
    }

    /**
     * 从规则库生成可访问性相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateAccessibilityIssuesFromRules(seed) {
        // 从规则库获取可访问性相关检查项
        const checks = usabilityRules.getChecksByCategoryName('可访问性');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'accessibility');
        return this.selectStableItems(issues, 1, 2, hash);
    }

    /**
     * 从规则库生成可访问性相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateAccessibilityRecommendationsFromRules(seed) {
        // 从规则库获取可访问性相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('可访问性');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'accessibility');
        return this.selectStableItems(recommendations, 1, 2, hash);
    }

    /**
     * 从规则库生成安全相关问题
     * @param {string} seed - 种子字符串
     * @returns {Array} 问题列表
     */
    generateSecurityIssuesFromRules(seed) {
        // 从规则库获取安全相关检查项
        const checks = usabilityRules.getChecksByCategoryName('信任与安全');
        const issues = checks.map(check => check.description);
        const hash = this.hashCode(seed + 'security');
        return this.selectStableItems(issues, 0, 1, hash);
    }

    /**
     * 从规则库生成安全相关建议
     * @param {string} seed - 种子字符串
     * @returns {Array} 建议列表
     */
    generateSecurityRecommendationsFromRules(seed) {
        // 从规则库获取安全相关检查项并生成建议
        const checks = usabilityRules.getChecksByCategoryName('信任与安全');
        const recommendations = checks.map(check => `改善${check.name}相关问题，例如：${check.example}`);
        const hash = this.hashCode(seed + 'security');
        return this.selectStableItems(recommendations, 0, 1, hash);
    }

    /**
     * 生成稳定的总结性评价
     * @param {string} seed - 种子字符串
     * @returns {string} 总结文本
     */
    generateStableSummary(seed) {
        const summaries = [
            '该界面存在导航过深、操作路径复杂的问题，可能导致用户流失。建议简化导航结构，优化信息架构。',
            '整体体验良好，但在视觉对比度和表单设计方面仍有改进空间。建议提高对比度，简化表单字段。',
            '界面信息密度过高，用户难以快速获取关键信息。建议重新组织信息架构，适当留白。',
            '用户体验表现中等，存在多处可用性问题。建议从导航结构和表单设计入手进行优化。',
            '网站在性能和可访问性方面有待提升，建议优化加载速度并增强无障碍访问支持。'
        ];
        const hash = this.hashCode(seed);
        return summaries[hash % summaries.length];
    }
}

// 导出分析引擎
const analysisEngine = new UXAnalysisEngine();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UXAnalysisEngine, analysisEngine };
}