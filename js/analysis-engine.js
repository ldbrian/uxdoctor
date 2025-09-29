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

        // 调用AI分析器进行真实分析
        const result = await aiAnalyzer.analyzeURL(url, options);
        
        // 缓存结果
        analysisCache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
        
        return result;
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

        // 调用AI分析器进行真实分析
        const result = await aiAnalyzer.analyzeScreenshot(screenshotPath, options);
        
        // 缓存结果
        analysisCache.set(screenshotId, {
            result: result,
            timestamp: Date.now()
        });
        
        return result;
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
}

// 导出分析引擎
const analysisEngine = new UXAnalysisEngine();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UXAnalysisEngine, analysisEngine };
}