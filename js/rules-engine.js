/**
 * UXDoctor 规则引擎
 * 基于结构化UI元素树执行量化规则检查，生成原始问题列表
 */

const { usabilityRules } = require('./usability-rules.js');

class RulesEngine {
    constructor() {
        this.rules = usabilityRules.getAllRules();
    }

    /**
     * 执行规则检查，生成原始问题列表
     * @param {Object} unifiedData - 统一的UI元素树数据
     * @returns {Array} 原始问题列表
     */
    executeRules(unifiedData) {
        if (!unifiedData || !unifiedData.elements) {
            return [];
        }

        const issues = [];
        const elements = unifiedData.elements;

        // 遍历所有元素，执行规则检查
        elements.forEach(element => {
            // 检查对比度问题
            this.checkContrastRatio(element, issues);
            
            // 检查字体大小问题
            this.checkFontSize(element, issues);
            
            // 检查可点击元素问题
            this.checkClickableElements(element, issues);
            
            // 检查表单相关问题
            this.checkFormElements(element, issues);
            
            // 检查ARIA标签问题
            this.checkAriaLabels(element, issues);
            
            // 检查图片alt属性问题
            this.checkImageAlt(element, issues);
        });

        return issues;
    }

    /**
     * 检查对比度比率
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkContrastRatio(element, issues) {
        // 检查文本元素的对比度
        if (element.type === 'text' || element.type === 'heading' || element.type === 'button') {
            // 如果对比度比率低于4.5:1，添加问题
            if (element.contrast_ratio && element.contrast_ratio < 4.5) {
                issues.push({
                    element_id: element.id,
                    rule_id: 'contrast-001',
                    severity: element.contrast_ratio < 3 ? 'high' : 'medium',
                    confidence: element.confidence || 0.9,
                    explanation: `文字与背景对比比率为 ${element.contrast_ratio.toFixed(1)}:1，低于 WCAG AA 要求 4.5:1，可能导致低视力用户无法阅读。`,
                    suggestion: '将文字颜色加深或背景改浅，确保对比度 >= 4.5:1。',
                    evidence: `contrast_ratio=${element.contrast_ratio.toFixed(1)}, fontSize=${element.css?.fontSize || 'unknown'}`
                });
            }
        }
    }

    /**
     * 检查字体大小
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkFontSize(element, issues) {
        // 检查文本元素的字体大小
        if ((element.type === 'text' || element.type === 'heading') && element.css?.fontSize) {
            // 解析字体大小（例如："14px" -> 14）
            const fontSizeMatch = element.css.fontSize.match(/(\d+)px/);
            if (fontSizeMatch) {
                const fontSize = parseInt(fontSizeMatch[1], 10);
                // 如果正文字号小于14px，添加问题
                if (fontSize < 14) {
                    issues.push({
                        element_id: element.id,
                        rule_id: 'font-size-001',
                        severity: 'medium',
                        confidence: element.confidence || 0.8,
                        explanation: `正文字号为 ${fontSize}px，小于推荐的 14px，可能导致阅读困难。`,
                        suggestion: '将正文字号调整为至少 14px，以确保良好的可读性。',
                        evidence: `fontSize=${fontSize}px`
                    });
                }
            }
        }
    }

    /**
     * 检查可点击元素
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkClickableElements(element, issues) {
        // 检查可点击元素是否有足够的尺寸
        if (element.is_clickable && element.bbox) {
            const [x, y, width, height] = element.bbox;
            // 如果可点击元素太小（小于44px），添加问题
            if (width < 44 || height < 44) {
                issues.push({
                    element_id: element.id,
                    rule_id: 'clickable-size-001',
                    severity: 'medium',
                    confidence: element.confidence || 0.85,
                    explanation: `可点击元素尺寸为 ${width}x${height}px，小于推荐的 44x44px，可能导致用户难以准确点击。`,
                    suggestion: '增加可点击元素的尺寸至至少 44x44px，以提高可点击性。',
                    evidence: `bbox=[${x},${y},${width},${height}]`
                });
            }
        }
    }

    /**
     * 检查表单元素
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkFormElements(element, issues) {
        // 检查表单元素是否有标签
        if (element.type === 'input' && !element.aria?.label) {
            issues.push({
                element_id: element.id,
                rule_id: 'form-label-001',
                severity: 'high',
                confidence: element.confidence || 0.9,
                explanation: '表单输入控件缺少关联的标签，可能导致屏幕阅读器用户无法理解输入目的。',
                suggestion: '为表单控件添加明确的标签（label）或使用 aria-label 属性提供替代文本。',
                evidence: 'type=input, aria.label=missing'
            });
        }
        
        // 检查必填表单字段
        if (element.type === 'input' && element.dom_path && element.dom_path.includes('*')) {
            issues.push({
                element_id: element.id,
                rule_id: 'required-field-001',
                severity: 'high',
                confidence: element.confidence || 0.95,
                explanation: '必填表单字段缺少显式标识，用户可能在提交时才知道该字段必填。',
                suggestion: '使用星号(*)或文字明确标识必填字段，或在字段附近提供必填提示。',
                evidence: 'type=input, required=indicated by * in dom_path'
            });
        }
    }

    /**
     * 检查ARIA标签
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkAriaLabels(element, issues) {
        // 检查需要ARIA标签的元素是否提供了标签
        const needsAria = ['button', 'link', 'image'];
        if (needsAria.includes(element.type) && !element.aria?.label && !element.text) {
            issues.push({
                element_id: element.id,
                rule_id: 'aria-label-001',
                severity: 'medium',
                confidence: element.confidence || 0.8,
                explanation: '可交互元素缺少ARIA标签或文本内容，可能导致屏幕阅读器用户无法理解元素用途。',
                suggestion: '为元素添加 aria-label 属性或确保元素包含可见文本内容。',
                evidence: `type=${element.type}, aria.label=missing, text=missing`
            });
        }
    }

    /**
     * 检查图片alt属性
     * @param {Object} element - UI元素
     * @param {Array} issues - 问题列表
     */
    checkImageAlt(element, issues) {
        // 检查图片元素是否有alt属性
        if (element.type === 'image' && (!element.aria?.label || element.aria.label === 'image')) {
            issues.push({
                element_id: element.id,
                rule_id: 'alt-text-001',
                severity: 'medium',
                confidence: element.confidence || 0.85,
                explanation: '图片缺少有意义的替代文本，可能导致视觉障碍用户无法理解图片内容。',
                suggestion: '为图片添加描述性的 alt 属性，准确描述图片内容或功能。',
                evidence: `type=image, aria.label=${element.aria?.label || 'missing'}`
            });
        }
    }

    /**
     * 对AI生成的问题进行健全性检查
     * @param {Array} aiIssues - AI生成的问题列表
     * @param {Object} unifiedData - 统一的UI元素树数据
     * @returns {Array} 经过健全性检查的问题列表
     */
    sanityCheck(aiIssues, unifiedData) {
        if (!aiIssues || !Array.isArray(aiIssues) || !unifiedData) {
            return aiIssues || [];
        }

        const elementsMap = {};
        if (unifiedData.elements) {
            unifiedData.elements.forEach(element => {
                elementsMap[element.id] = element;
            });
        }

        return aiIssues.map(issue => {
            // 获取对应的元素
            const element = elementsMap[issue.element_id];
            
            // 如果AI指出对比度问题但实际对比度是足够的，则标记为待人工复核
            if (issue.rule_id === 'contrast-001' && element && element.contrast_ratio && element.contrast_ratio >= 4.5) {
                return {
                    ...issue,
                    status: 'pending_review',
                    explanation: `${issue.explanation} [注意：系统检测到的实际对比度为 ${element.contrast_ratio.toFixed(1)}:1，高于问题阈值，建议人工复核]`
                };
            }
            
            // 可以添加更多健全性检查规则
            
            return issue;
        });
    }
}

// 导出规则引擎
const rulesEngine = new RulesEngine();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RulesEngine, rulesEngine };
}