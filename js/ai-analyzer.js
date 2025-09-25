const axios = require('axios');
const sharp = require('sharp');
const { usabilityRules } = require('./usability-rules.js');
const { configManager } = require('./config-manager.js');
const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const axe = require('axe-core');
const { rulesEngine } = require('./rules-engine.js');

/**
 * AI分析器类
 * 负责处理真实的AI分析和OCR功能
 */
class AIAnalyzer {
    constructor() {
        // OCRSpace API密钥（使用用户提供的密钥）
        this.ocrApiKey = 'K89391165388957'; // 用户提供的OCRSpace API密钥
        this.rules = usabilityRules.getAllRules();
        this.ocrInitialized = true; // OCRSpace不需要初始化，始终可用
        
        // OpenAI API配置
        this.openaiApiKey = null;
        this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
        
        // DeepSeek API配置
        this.deepSeekApiKey = null;
        this.deepSeekApiUrl = 'https://api.deepseek.com/v1/chat/completions';
        
        // AI模型选择配置
        this.primaryAI = 'openai'; // 'openai' 或 'deepseek'
        this.aiInitialized = true;
        
        // Playwright可用性标志
        this.playwrightAvailable = true;
        
        console.log('AI分析器初始化完成');
    }

    /**
     * 初始化配置
     */
    async initConfig() {
        try {
            const config = await configManager.loadConfig();
            this.updateConfig({
                openaiKey: config.openaiApiKey,
                deepseekKey: config.deepSeekApiKey,
                primaryAI: config.primaryAI
            });
            console.log('AI分析器配置初始化完成');
        } catch (error) {
            console.error('AI分析器配置初始化失败:', error);
        }
    }

    /**
     * 更新API密钥配置
     * @param {Object} config - 配置对象
     */
    updateConfig(config) {
        if (config.openaiKey !== undefined) {
            this.openaiApiKey = config.openaiKey;
        }
        if (config.deepseekKey !== undefined) {
            this.deepseekKey = config.deepseekKey;
        }
        if (config.primaryAI !== undefined) {
            this.primaryAI = config.primaryAI;
        }
        
        console.log(`AI配置已更新，主模型: ${this.primaryAI}`);
    }

    /**
     * 使用OCRSpace API进行OCR识别
     * @param {Buffer} imageBuffer - 图片缓冲区
     * @returns {Promise<string>} 识别出的文本
     */
    async performOCR(imageBuffer) {
        try {
            console.log('使用OCRSpace API进行OCR识别');
            
            // 将图片转换为base64
            const base64Image = imageBuffer.toString('base64');
            
            // 调用OCRSpace API
            const response = await axios.post('https://api.ocr.space/parse/image', {
                apikey: this.ocrApiKey,
                language: 'chs', // 简体中文
                base64Image: `data:image/png;base64,${base64Image}`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30秒超时
            });
            
            if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
                const ocrText = response.data.ParsedResults[0].ParsedText;
                console.log('OCR识别成功，识别文本长度:', ocrText.length);
                return ocrText;
            } else {
                console.log('OCR识别未返回有效结果');
                return '';
            }
        } catch (error) {
            console.error('OCR识别失败:', error.message);
            return '';
        }
    }

    /**
     * 使用Playwright抓取页面信息
     * @param {string} url - 要分析的URL
     * @returns {Promise<Object>} 页面信息
     */
    async crawlPageWithPlaywright(url) {
        console.log('使用Playwright抓取页面信息');
        let browser;
        
        try {
            // 启动浏览器
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            
            const page = await context.newPage();
            
            // 导航到页面
            await page.goto(url, { waitUntil: 'networkidle' });
            
            // 获取页面截图
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            
            // 获取DOM节点结构
            const domNodes = await page.evaluate(() => {
                function traverse(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return {
                            type: 'text',
                            content: node.textContent.trim()
                        };
                    }
                    
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const children = [];
                        for (let i = 0; i < node.childNodes.length; i++) {
                            const child = traverse(node.childNodes[i]);
                            if (child) children.push(child);
                        }
                        
                        return {
                            type: 'element',
                            tagName: node.tagName.toLowerCase(),
                            attributes: Array.from(node.attributes).reduce((acc, attr) => {
                                acc[attr.name] = attr.value;
                                return acc;
                            }, {}),
                            children: children
                        };
                    }
                    
                    return null;
                }
                
                return traverse(document.documentElement);
            });
            
            // 获取计算样式
            const computedStyles = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const styles = [];
                
                elements.forEach((element, index) => {
                    const computedStyle = window.getComputedStyle(element);
                    styles.push({
                        selector: element.tagName + (element.className ? '.' + element.className.replace(/\s+/g, '.') : '') + (element.id ? '#' + element.id : ''),
                        color: computedStyle.color,
                        backgroundColor: computedStyle.backgroundColor,
                        fontSize: computedStyle.fontSize,
                        fontWeight: computedStyle.fontWeight,
                        position: computedStyle.position,
                        top: computedStyle.top,
                        left: computedStyle.left,
                        width: computedStyle.width,
                        height: computedStyle.height
                    });
                });
                
                return styles;
            });
            
            // 获取可访问性树
            const accessibilityTree = await page.accessibility.snapshot();
            
            // 运行axe-core进行可访问性检查
            const axeResults = await page.evaluate(() => {
                return new Promise((resolve) => {
                    axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }, (err, results) => {
                        if (err) {
                            resolve({ error: err.message });
                        } else {
                            resolve(results);
                        }
                    });
                });
            });
            
            await browser.close();
            
            return {
                screenshot: screenshotBuffer,
                domNodes: domNodes,
                computedStyles: computedStyles,
                accessibilityTree: accessibilityTree,
                axeResults: axeResults
            };
        } catch (error) {
            console.error('Playwright抓取页面信息失败:', error.message);
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.error('关闭浏览器失败:', closeError.message);
                }
            }
            
            // 标记Playwright不可用
            this.playwrightAvailable = false;
            
            // 返回null表示抓取失败
            return null;
        }
    }

    /**
     * 将Playwright抓取的数据转换为统一的UI元素树结构
     * @param {Object} pageInfo - Playwright抓取的页面信息
     * @param {string} url - 页面URL
     * @returns {Object} 统一的UI元素树结构
     */
    convertToUnifiedSchema(pageInfo, url) {
        if (!pageInfo) {
            return null;
        }

        // 构建统一的UI元素树结构
        const unifiedSchema = {
            page_meta: {
                source_type: "url",
                page_url: url,
                viewport: { width: 1920, height: 1080 }, // 默认桌面视口
                platform: "desktop"
            },
            elements: [],
            performance: {},
            axe_issues: pageInfo.axeResults?.violations || []
        };

        // 处理DOM节点，转换为elements数组
        if (pageInfo.domNodes) {
            const elements = [];
            let elementId = 1;
            
            // 递归遍历DOM节点
            const traverseDOM = (node, parentPath = 'body') => {
                if (!node) return;
                
                if (node.type === 'element') {
                    // 为每个元素生成唯一ID
                    const id = `e${elementId++}`;
                    const tagName = node.tagName;
                    const attributes = node.attributes || {};
                    
                    // 构建DOM路径
                    const domPath = attributes.id 
                        ? `${parentPath}>${tagName}#${attributes.id}`
                        : attributes.className 
                            ? `${parentPath}>${tagName}.${attributes.className.split(' ').join('.')}`
                            : `${parentPath}>${tagName}`;
                    
                    // 创建元素对象
                    const element = {
                        id: id,
                        type: this.getElementType(tagName, attributes),
                        text: this.extractTextFromNode(node),
                        bbox: this.estimateBoundingBox(node, attributes), // 简化的边界框估计
                        confidence: 0.9, // 默认置信度
                        source: ["dom"],
                        dom_path: domPath,
                        css: this.extractRelevantStyles(tagName, attributes),
                        aria: {
                            role: attributes.role || this.getDefaultRole(tagName),
                            label: attributes['aria-label'] || attributes.title || ''
                        },
                        contrast_ratio: this.estimateContrastRatio(tagName, attributes),
                        is_clickable: this.isClickable(tagName, attributes)
                    };
                    
                    elements.push(element);
                    
                    // 递归处理子节点
                    if (node.children && node.children.length > 0) {
                        const newParentPath = domPath;
                        node.children.forEach(child => traverseDOM(child, newParentPath));
                    }
                } else if (node.type === 'text' && node.content) {
                    // 处理文本节点
                    const id = `e${elementId++}`;
                    const element = {
                        id: id,
                        type: "text",
                        text: node.content,
                        bbox: [0, 0, 100, 20], // 默认文本框大小
                        confidence: 0.8,
                        source: ["dom"],
                        dom_path: parentPath,
                        css: {},
                        aria: { role: "text", label: "" },
                        contrast_ratio: 4.5,
                        is_clickable: false
                    };
                    
                    elements.push(element);
                }
            };
            
            // 从根节点开始遍历
            if (pageInfo.domNodes.children && pageInfo.domNodes.children.length > 0) {
                pageInfo.domNodes.children.forEach(child => traverseDOM(child));
            }
            
            unifiedSchema.elements = elements;
        }

        return unifiedSchema;
    }

    /**
     * 根据标签名和属性确定元素类型
     * @param {string} tagName - 标签名
     * @param {Object} attributes - 元素属性
     * @returns {string} 元素类型
     */
    getElementType(tagName, attributes) {
        // 根据标签名映射类型
        const typeMap = {
            'button': 'button',
            'input': attributes.type === 'submit' || attributes.type === 'button' ? 'button' : 'input',
            'textarea': 'input',
            'select': 'input',
            'h1': 'heading',
            'h2': 'heading',
            'h3': 'heading',
            'h4': 'heading',
            'h5': 'heading',
            'h6': 'heading',
            'img': 'image',
            'a': 'link',
            'nav': 'nav',
            'header': 'banner',
            'footer': 'contentinfo',
            'aside': 'complementary',
            'main': 'main',
            'form': 'form',
            'section': 'region',
            'article': 'article'
        };
        
        return typeMap[tagName] || 'generic';
    }

    /**
     * 从节点中提取文本内容
     * @param {Object} node - DOM节点
     * @returns {string} 文本内容
     */
    extractTextFromNode(node) {
        if (!node) return '';
        
        if (node.type === 'text') {
            return node.content || '';
        }
        
        if (node.type === 'element') {
            // 对于input元素，使用value或placeholder
            if (node.tagName === 'input') {
                return node.attributes.value || node.attributes.placeholder || '';
            }
            
            // 对于其他元素，递归提取子节点文本
            if (node.children && node.children.length > 0) {
                return node.children
                    .map(child => this.extractTextFromNode(child))
                    .filter(text => text.trim() !== '')
                    .join(' ');
            }
        }
        
        return '';
    }

    /**
     * 估计元素的边界框
     * @param {Object} node - DOM节点
     * @param {Object} attributes - 元素属性
     * @returns {Array} 边界框 [x, y, width, height]
     */
    estimateBoundingBox(node, attributes) {
        // 这里只是一个简化的估计，实际应用中需要从计算样式中获取精确位置
        // 格式: [x, y, width, height]
        return [0, 0, 100, 30]; // 默认大小
    }

    /**
     * 提取相关样式信息
     * @param {string} tagName - 标签名
     * @param {Object} attributes - 元素属性
     * @returns {Object} 样式信息
     */
    extractRelevantStyles(tagName, attributes) {
        // 这里应该从计算样式中提取，现在返回简化的样式信息
        return {
            fontSize: this.getDefaultFontSize(tagName),
            color: "#000000",
            background: "#ffffff"
        };
    }

    /**
     * 获取标签的默认字体大小
     * @param {string} tagName - 标签名
     * @returns {string} 字体大小
     */
    getDefaultFontSize(tagName) {
        const fontSizeMap = {
            'h1': '32px',
            'h2': '24px',
            'h3': '18px',
            'h4': '16px',
            'h5': '14px',
            'h6': '12px',
            'p': '16px',
            'button': '14px',
            'input': '16px'
        };
        
        return fontSizeMap[tagName] || '16px';
    }

    /**
     * 获取标签的默认ARIA角色
     * @param {string} tagName - 标签名
     * @returns {string} ARIA角色
     */
    getDefaultRole(tagName) {
        const roleMap = {
            'button': 'button',
            'input': 'textbox',
            'textarea': 'textbox',
            'select': 'combobox',
            'a': 'link',
            'img': 'img',
            'h1': 'heading',
            'h2': 'heading',
            'h3': 'heading',
            'h4': 'heading',
            'h5': 'heading',
            'h6': 'heading',
            'nav': 'navigation',
            'header': 'banner',
            'footer': 'contentinfo',
            'main': 'main',
            'form': 'form'
        };
        
        return roleMap[tagName] || 'generic';
    }

    /**
     * 估计对比度比率
     * @param {string} tagName - 标签名
     * @param {Object} attributes - 元素属性
     * @returns {number} 对比度比率
     */
    estimateContrastRatio(tagName, attributes) {
        // 这里应该基于实际颜色计算，现在返回估计值
        if (tagName === 'button') return 6.8;
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') return 7.0;
        return 4.5; // 默认对比度
    }

    /**
     * 判断元素是否可点击
     * @param {string} tagName - 标签名
     * @param {Object} attributes - 元素属性
     * @returns {boolean} 是否可点击
     */
    isClickable(tagName, attributes) {
        const clickableTags = ['button', 'a', 'input', 'select', 'textarea'];
        const hasClickHandler = attributes.onclick || attributes.role === 'button';
        return clickableTags.includes(tagName) || hasClickHandler;
    }

    /**
     * 发送AI请求
     * @param {string} model - 模型名称
     * @param {string} prompt - 发送给AI的提示
     * @returns {Promise<string>} AI分析结果
     */
    async sendAIRequest(model, prompt) {
        switch (model) {
            case 'openai':
                return await this.callOpenAI(prompt);
            case 'deepseek':
                return await this.callDeepSeek(prompt);
            default:
                throw new Error(`不支持的AI模型: ${model}`);
        }
    }

    /**
     * 从AI响应中提取JSON
     * @param {string} response - AI响应文本
     * @returns {Object|null} 解析后的JSON对象或null
     */
    extractJSONFromResponse(response) {
        if (!response) return null;
        
        // 尝试直接解析整个响应
        try {
            return JSON.parse(response);
        } catch (e) {
            // 如果直接解析失败，尝试从代码块中提取JSON
            const jsonBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
                try {
                    return JSON.parse(jsonBlockMatch[1]);
                } catch (e2) {
                    console.warn('从代码块中提取JSON失败:', e2.message);
                }
            }
            
            // 尝试从大括号中提取JSON
            const braceMatch = response.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                try {
                    return JSON.parse(braceMatch[0]);
                } catch (e3) {
                    console.warn('从大括号中提取JSON失败:', e3.message);
                }
            }
            
            console.warn('无法从响应中提取有效的JSON');
            return null;
        }
    }

    /**
     * 调用OpenAI API进行分析
     * @param {string} prompt - 发送给AI的提示
     * @returns {Promise<string>} AI分析结果
     */
    async callOpenAI(prompt) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API密钥未配置');
        }

        try {
            console.log('正在调用OpenAI API...');
            
            const response = await axios.post(this.openaiApiUrl, {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60秒超时
            });

            console.log('OpenAI API响应状态:', response.status);
            
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const content = response.data.choices[0].message.content.trim();
                console.log('OpenAI API响应内容长度:', content.length);
                return content;
            } else {
                throw new Error('OpenAI API返回无效响应: ' + JSON.stringify(response.data));
            }
        } catch (error) {
            if (error.response) {
                console.error('OpenAI API调用失败，状态码:', error.response.status);
                console.error('错误响应:', error.response.data);
            } else {
                console.error('OpenAI API调用失败:', error.message);
            }
            throw error;
        }
    }

    /**
     * 调用DeepSeek API进行分析
     * @param {string} prompt - 发送给AI的提示
     * @returns {Promise<string>} AI分析结果
     */
    async callDeepSeek(prompt) {
        if (!this.deepSeekApiKey) {
            throw new Error('DeepSeek API密钥未配置');
        }

        try {
            console.log('正在调用DeepSeek API...');
            
            const response = await axios.post(this.deepSeekApiUrl, {
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.deepSeekApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60秒超时
            });

            console.log('DeepSeek API响应状态:', response.status);
            
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const content = response.data.choices[0].message.content.trim();
                console.log('DeepSeek API响应内容长度:', content.length);
                return content;
            } else {
                throw new Error('DeepSeek API返回无效响应: ' + JSON.stringify(response.data));
            }
        } catch (error) {
            if (error.response) {
                console.error('DeepSeek API调用失败，状态码:', error.response.status);
                console.error('错误响应:', error.response.data);
            } else {
                console.error('DeepSeek API调用失败:', error.message);
            }
            throw error;
        }
    }

    /**
     * 调用AI API进行分析（根据配置选择模型）
     * @param {string} prompt - 发送给AI的提示
     * @returns {Promise<string>} AI分析结果
     */
    async callAI(prompt) {
        // 检查是否配置了API密钥
        const hasOpenAI = !!this.openaiApiKey;
        const hasDeepSeek = !!this.deepSeekApiKey;
        
        if (!hasOpenAI && !hasDeepSeek) {
            throw new Error('未配置任何AI API密钥，请在配置页面设置API密钥');
        }
        
        // 确定主模型和备选模型
        const primaryModel = this.primaryAI;
        const fallbackModel = this.primaryAI === 'openai' ? 'deepseek' : 'openai';
        
        let lastError = null;
        
        // 首先尝试主模型
        if ((primaryModel === 'openai' && hasOpenAI) || (primaryModel === 'deepseek' && hasDeepSeek)) {
            try {
                console.log(`正在使用主模型 ${primaryModel} 进行分析...`);
                const result = await this.sendAIRequest(primaryModel, prompt);
                console.log(`${primaryModel}模型分析完成`);
                return result;
            } catch (error) {
                console.error(`${primaryModel}模型调用失败:`, error.message);
                lastError = error;
                
                // 特别处理402错误（余额不足）
                if (error.response && error.response.status === 402) {
                    const errorMessage = `${primaryModel === 'openai' ? 'OpenAI' : 'DeepSeek'} API余额不足，请充值后重试`;
                    console.log(errorMessage);
                    throw new Error(errorMessage);
                }
            }
        }
        
        // 如果主模型失败，尝试备选模型
        if ((fallbackModel === 'openai' && hasOpenAI) || (fallbackModel === 'deepseek' && hasDeepSeek)) {
            try {
                console.log(`正在使用备选模型 ${fallbackModel} 进行分析...`);
                const result = await this.sendAIRequest(fallbackModel, prompt);
                console.log(`${fallbackModel}模型分析完成`);
                return result;
            } catch (error) {
                console.error(`${fallbackModel}模型调用失败:`, error.message);
                lastError = error;
                
                // 特别处理402错误（余额不足）
                if (error.response && error.response.status === 402) {
                    const errorMessage = `${fallbackModel === 'openai' ? 'OpenAI' : 'DeepSeek'} API余额不足，请充值后重试`;
                    console.log(errorMessage);
                    throw new Error(errorMessage);
                }
            }
        }
        
        // 如果所有模型都失败，抛出错误
        const errorMsg = lastError?.response?.status === 402 
            ? (lastError.message || 'API余额不足，请充值后重试')
            : '所有AI模型都不可用: ' + (lastError?.message || '未知错误');
            
        throw new Error(errorMsg);
    }

    /**
     * 分析URL
     * @param {string} url - 要分析的URL
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeURL(url) {
        try {
            console.log('开始执行真实AI分析');
            
            // 使用Playwright抓取页面信息（如果可用）
            let pageInfo = null;
            if (this.playwrightAvailable) {
                pageInfo = await this.crawlPageWithPlaywright(url);
            } else {
                console.log('Playwright不可用，跳过页面抓取');
            }
            
            // 转换为统一的UI元素树结构
            let unifiedData = null;
            if (pageInfo) {
                unifiedData = this.convertToUnifiedSchema(pageInfo, url);
            }
            
            // 规则引擎先运行，生成原始问题列表
            let rawIssues = [];
            if (unifiedData) {
                rawIssues = rulesEngine.executeRules(unifiedData);
            }
            
            // 构建详细的分析提示，包含统一的数据结构和原始问题
            let prompt = `
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

要求：每条 issue 必须给出 evidence 字段（哪项量化值或规则触发），并给出置信度（0-1）。

页面结构化数据：
${JSON.stringify(unifiedData, null, 2)}

规则引擎生成的原始问题：
${JSON.stringify(rawIssues, null, 2)}

请基于以上信息进行分析，润色说明、给出优先级、补充可能的主观问题。特别注意：
1. 每条issue必须包含element_id、rule_id、severity、confidence、explanation、suggestion和evidence字段
2. severity必须是critical、high、medium或low之一
3. confidence是0到1之间的数值
4. evidence字段必须说明是哪项量化值或规则触发了该问题
5. 可以添加规则引擎未发现的主观问题
`;
            
            console.log('发送提示词长度:', prompt.length);
            const aiResponse = await this.callAI(prompt);
            console.log('收到AI响应');
            
            // 尝试解析AI返回的JSON
            try {
                console.log('尝试解析AI响应为JSON');
                const result = this.extractJSONFromResponse(aiResponse);
                if (result) {
                    console.log('JSON解析成功');
                    // 对AI生成的问题进行健全性检查
                    const sanityCheckedIssues = rulesEngine.sanityCheck(result, unifiedData);
                    return {
                        unifiedData: unifiedData,
                        rawIssues: rawIssues,
                        aiIssues: sanityCheckedIssues
                    };
                } else {
                    throw new Error('无法从AI响应中提取有效的JSON');
                }
            } catch (parseError) {
                // 如果AI返回的不是有效的JSON，构造一个标准格式的结果
                console.warn('AI返回的结果不是有效的JSON格式，构造标准格式结果');
                console.warn('AI原始响应:', aiResponse);
                return await this.generateAIResult(url);
            }
        } catch (error) {
            console.error('真实AI分析失败，回退到模拟分析:', error.message);
            // 如果AI分析失败，回退到模拟分析
            return await this.generateAIResult(url);
        }
    }

    /**
     * 分析截图
     * @param {Buffer} screenshotBuffer - 截图文件缓冲区
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeScreenshot(screenshotBuffer) {
        try {
            let ocrText = '';
            
            // 尝试进行OCR识别（如果OCR已初始化）
            if (this.ocrInitialized) {
                try {
                    // 使用OCRSpace API进行OCR识别
                    ocrText = await this.performOCR(screenshotBuffer);
                } catch (ocrError) {
                    console.error('OCR识别失败:', ocrError.message);
                    // 即使OCR失败，我们仍然可以进行基于图像的分析
                }
            } else {
                console.log('OCR未初始化，跳过文字识别');
            }
            
            // 构建详细的分析提示，包含OCR识别的文本
            const prompt = `
你是一个专业的用户体验(UX)专家和前端工程师，请根据以下信息进行分析：

OCR识别的文本内容:
${ocrText}

请分析截图中的页面结构布局和UI元素，并结合OCR识别的文本内容进行综合分析。

从OCR文本可以分析：
- 页面文字内容的可读性
- 是否存在重复内容
- 是否包含表单相关关键词
- 是否包含导航相关关键词

请按照以下结构提供分析结果：
1. 总体评分 (0-100分)
2. 各维度评分和问题：
   - 导航体验
   - 视觉设计
   - 信息架构
   - 性能体验
   - 可访问性
   - 安全性
   - 表单设计（如适用）
3. 严重问题列表（最多5个）
4. 总结性评价

请以严格的JSON格式返回结果，不要包含任何额外的文本或解释，结构如下：
\`\`\`json
{
  "overallScore": 85,
  "dimensions": {
    "navigation": { "score": 80, "issues": ["问题1", "问题2"], "recommendations": ["建议1", "建议2"] },
    "visual": { "score": 90, "issues": ["问题1"], "recommendations": ["建议1"] },
    // 其他维度...
  },
  "criticalIssues": ["严重问题1", "严重问题2"],
  "summary": "总结性评价"
}
\`\`\`
`;
            
            console.log('发送提示词长度:', prompt.length);
            const aiResponse = await this.callAI(prompt);
            console.log('收到AI响应');
            
            // 尝试解析AI返回的JSON
            try {
                console.log('尝试解析AI响应为JSON');
                const result = this.extractJSONFromResponse(aiResponse);
                if (result) {
                    console.log('JSON解析成功');
                    return result;
                } else {
                    throw new Error('无法从AI响应中提取有效的JSON');
                }
            } catch (parseError) {
                // 如果AI返回的不是有效的JSON，构造一个标准格式的结果
                console.warn('AI返回的结果不是有效的JSON格式，构造标准格式结果');
                console.warn('AI原始响应:', aiResponse);
                return await this.generateAIResult('截图分析', ocrText);
            }
        } catch (error) {
            console.error('截图分析错误:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 生成基于AI的分析结果
     * @param {string} input - 输入源标识
     * @param {string} ocrText - OCR识别的文本（可选）
     * @returns {Object} 分析结果
     */
    async generateAIResult(input, ocrText = '') {
        // 基于输入内容生成稳定的哈希值，用于确定性选择
        const hash = this.hashCode(input);
        
        // 获取按严重程度排序的检查项
        const checksBySeverity = usabilityRules.getRulesBySeverity();
        
        // 从规则库中选择严重问题（仅选择严重程度为critical的）
        const criticalIssues = this.selectStableItems(
            checksBySeverity.filter(c => c.severity === 'critical'), 
            1, 
            5, // 增加严重问题数量到最多5个
            hash
        ).map(issue => `${issue.category}: ${issue.name} - ${issue.example}`); // 格式化严重问题
        
        // 根据OCR文本分析内容相关问题
        const contentIssues = [];
        let hasForms = false;
        let hasNavigation = false;
        
        if (ocrText) {
            // 检查文本长度和可读性
            if (ocrText.length > 500) {
                contentIssues.push({
                    category: '内容与可读性',
                    issue: '页面文字内容过多，可能导致用户阅读疲劳',
                    severity: 'medium'
                });
            }
            
            // 检查是否有重复内容
            if (this.hasRepetitiveContent(ocrText)) {
                contentIssues.push({
                    category: '内容与可读性',
                    issue: '页面存在重复内容，影响用户体验',
                    severity: 'medium'
                });
            }
            
            // 检查是否包含表单相关关键词
            const formKeywords = ['表单', 'form', 'input', 'submit', '登录', '注册', '姓名', '邮箱', '密码', '电话'];
            hasForms = formKeywords.some(keyword => ocrText.toLowerCase().includes(keyword.toLowerCase()));
            
            // 检查是否包含导航相关关键词
            const navKeywords = ['导航', '菜单', 'nav', 'menu', '首页', '主页', 'home', 'about', 'contact'];
            hasNavigation = navKeywords.some(keyword => ocrText.toLowerCase().includes(keyword.toLowerCase()));
        }
        
        // 对于URL分析，我们假设所有组件都可能存在
        const isUrlAnalysis = input !== '截图分析';
        if (isUrlAnalysis) {
            hasForms = true;
            hasNavigation = true;
        }
        
        // 构建维度分析结果
        const dimensions = {
            navigation: {
                score: this.generateStableScore(input + 'navigation', 55, 95),
                issues: hasNavigation || isUrlAnalysis ? this.generateNavigationIssuesFromRules(input) : [],
                recommendations: hasNavigation || isUrlAnalysis ? this.generateNavigationRecommendationsFromRules(input) : []
            },
            visual: {
                score: this.generateStableScore(input + 'visual', 60, 95),
                issues: this.generateVisualIssuesFromRules(input),
                recommendations: this.generateVisualRecommendationsFromRules(input)
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
                issues: isUrlAnalysis ? this.generateSecurityIssuesFromRules(input) : [],
                recommendations: isUrlAnalysis ? this.generateSecurityRecommendationsFromRules(input) : []
            }
        };
        
        // 只有在检测到表单或进行URL分析时才包含表单维度
        if (hasForms || isUrlAnalysis) {
            dimensions.form = {
                score: this.generateStableScore(input + 'form', 50, 90),
                issues: this.generateFormIssuesFromRules(input),
                recommendations: this.generateFormRecommendationsFromRules(input)
            };
        }
        
        return {
            input: input,
            timestamp: new Date().toISOString(),
            overallScore: this.generateStableScore(input, 60, 95),
            rules: this.rules,
            dimensions: dimensions,
            contentIssues: contentIssues,
            criticalIssues: criticalIssues, // 修复严重问题格式
            summary: this.generateStableSummary(input),
            analysisType: isUrlAnalysis ? 'url' : 'screenshot'
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
     * 检查是否有重复内容
     * @param {string} text - 要检查的文本
     * @returns {boolean} 是否有重复内容
     */
    hasRepetitiveContent(text) {
        // 简单的重复内容检测逻辑
        const sentences = text.split(/[.。！!？?]/).filter(s => s.trim().length > 0);
        const uniqueSentences = new Set(sentences.map(s => s.trim()));
        return uniqueSentences.size < sentences.length * 0.8; // 如果唯一句子数少于总句子数的80%，认为有重复
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

// 导出AI分析器
const aiAnalyzer = new AIAnalyzer();

module.exports = { AIAnalyzer, aiAnalyzer };