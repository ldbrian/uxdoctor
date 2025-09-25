/**
 * UXDoctor 可用性规则库（初版）
 * 包含导航、表单、内容、交互、性能、可访问性和安全等方面的检查规则
 */

class UsabilityRules {
    constructor() {
        // 定义可用性检查规则
        this.rules = {
            navigationAndInfoArchitecture: {
                id: 'navigationAndInfoArchitecture',
                name: '导航与信息架构',
                description: '检查网站的导航结构和信息组织方式',
                weight: 0.15,
                checks: [
                    {
                        id: 'navEntrySufficiency',
                        name: '导航入口足够',
                        description: '顶部/侧边导航至少覆盖主要 3-5 个功能',
                        severity: 'medium',
                        example: '首页只有一个"更多"，导致功能埋没'
                    },
                    {
                        id: 'navConsistency',
                        name: '导航一致性',
                        description: '各页面导航结构、顺序保持一致',
                        severity: 'high',
                        example: '首页有"联系我们"，内页找不到'
                    },
                    {
                        id: 'breadcrumb',
                        name: '面包屑',
                        description: '深层级页面需有面包屑返回路径',
                        severity: 'medium',
                        example: '商品详情页缺少"分类 > 品牌 > 商品"'
                    }
                ]
            },
            formAndInput: {
                id: 'formAndInput',
                name: '表单与输入',
                description: '检查表单设计和输入控件的可用性',
                weight: 0.20,
                checks: [
                    {
                        id: 'placeholderClarity',
                        name: '占位符清晰',
                        description: '占位符文字不少于 5 字，能说明输入要求',
                        severity: 'low',
                        example: '"输入内容" vs "请输入手机号"'
                    },
                    {
                        id: 'requiredFieldIndicator',
                        name: '必填项提示',
                        description: '必填字段有显式标识（* 或提示文字）',
                        severity: 'high',
                        example: '用户提交失败才知道手机号必填'
                    },
                    {
                        id: 'errorFeedback',
                        name: '错误提示及时',
                        description: '表单错误需即时反馈，而非提交后才显示',
                        severity: 'high',
                        example: '邮箱格式错误，提交后才报错'
                    },
                    {
                        id: 'inputRestrictions',
                        name: '输入限制',
                        description: '控件需符合输入要求（数字输入框/日期选择器）',
                        severity: 'medium',
                        example: '生日要求手写日期，易出错'
                    }
                ]
            },
            contentAndReadability: {
                id: 'contentAndReadability',
                name: '内容与可读性',
                description: '检查内容呈现和可读性',
                weight: 0.15,
                checks: [
                    {
                        id: 'fontReadability',
                        name: '字号可读',
                        description: '正文字号 ≥14px',
                        severity: 'medium',
                        example: '移动端 12px 难以阅读'
                    },
                    {
                        id: 'textContrast',
                        name: '文本对比度',
                        description: '文字与背景对比度 ≥ 4.5:1',
                        severity: 'high',
                        example: '灰字 + 灰背景导致阅读困难'
                    },
                    {
                        id: 'lineHeight',
                        name: '行距合适',
                        description: '行高为字号的 1.4-1.6 倍',
                        severity: 'low',
                        example: '行距太小导致阅读拥挤'
                    }
                ]
            },
            interactionAndFeedback: {
                id: 'interactionAndFeedback',
                name: '交互与反馈',
                description: '检查用户交互和系统反馈',
                weight: 0.15,
                checks: [
                    {
                        id: 'actionFeedback',
                        name: '操作反馈',
                        description: '点击按钮需有视觉/声音反馈',
                        severity: 'high',
                        example: '按钮点击无变化，用户误以为无效'
                    },
                    {
                        id: 'loadingFeedback',
                        name: '加载反馈',
                        description: '加载 > 2 秒必须展示进度提示',
                        severity: 'critical',
                        example: '空白屏 5 秒，用户以为崩溃'
                    },
                    {
                        id: 'reversibleActions',
                        name: '可撤销操作',
                        description: '删除/提交等关键操作需可撤销',
                        severity: 'high',
                        example: '删除记录无确认/恢复入口'
                    }
                ]
            },
            performanceAndMobile: {
                id: 'performanceAndMobile',
                name: '性能与移动端',
                description: '检查性能和移动端适配',
                weight: 0.15,
                checks: [
                    {
                        id: 'firstScreenLoad',
                        name: '首屏加载时间',
                        description: '首页加载 ≤ 3 秒',
                        severity: 'critical',
                        example: '打开首页卡 6 秒'
                    },
                    {
                        id: 'imageOptimization',
                        name: '图片优化',
                        description: '图片大小合适，支持懒加载',
                        severity: 'medium',
                        example: '300KB 图标导致加载缓慢'
                    },
                    {
                        id: 'responsiveLayout',
                        name: '响应式布局',
                        description: '页面能在常见屏幕宽度正常显示',
                        severity: 'high',
                        example: '手机端出现横向滚动条'
                    }
                ]
            },
            accessibility: {
                id: 'accessibility',
                name: '可访问性',
                description: '检查无障碍访问支持',
                weight: 0.10,
                checks: [
                    {
                        id: 'altText',
                        name: '替代文本',
                        description: '图片必须有 alt 描述',
                        severity: 'medium',
                        example: '产品图 alt="image"'
                    },
                    {
                        id: 'keyboardUsability',
                        name: '键盘可用',
                        description: '核心功能必须能键盘操作',
                        severity: 'high',
                        example: '登录按钮 tab 键无法聚焦'
                    },
                    {
                        id: 'formLabels',
                        name: '表单标签',
                        description: '表单控件有 label 关联',
                        severity: 'high',
                        example: '输入框无标签，屏幕阅读器无法识别'
                    }
                ]
            },
            trustAndSecurity: {
                id: 'trustAndSecurity',
                name: '信任与安全',
                description: '检查安全和信任相关要素',
                weight: 0.10,
                checks: [
                    {
                        id: 'https',
                        name: 'HTTPS',
                        description: '全站启用 HTTPS',
                        severity: 'critical',
                        example: '登录页是 http，信息泄露风险'
                    },
                    {
                        id: 'permissionPrompt',
                        name: '权限提示',
                        description: '获取隐私信息前必须提示',
                        severity: 'high',
                        example: 'APP 直接调用相机/通讯录'
                    },
                    {
                        id: 'contactInfo',
                        name: '联系方式',
                        description: '提供清晰联系方式（邮箱/客服）',
                        severity: 'medium',
                        example: '无法找到任何联系渠道'
                    }
                ]
            }
        };
    }

    /**
     * 获取所有规则
     * @returns {Object} 所有规则
     */
    getAllRules() {
        return this.rules;
    }

    /**
     * 根据ID获取特定规则
     * @param {string} ruleId - 规则ID
     * @returns {Object|null} 规则对象或null
     */
    getRuleById(ruleId) {
        return this.rules[ruleId] || null;
    }

    /**
     * 获取规则列表
     * @returns {Array} 规则列表
     */
    getRulesList() {
        return Object.values(this.rules);
    }

    /**
     * 根据权重排序规则
     * @returns {Array} 按权重排序的规则列表
     */
    getRulesByWeight() {
        return Object.values(this.rules).sort((a, b) => b.weight - a.weight);
    }

    /**
     * 根据严重程度排序规则
     * @returns {Array} 按严重程度排序的规则列表
     */
    getRulesBySeverity() {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const allChecks = this.getAllChecks();
        return allChecks.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    }

    /**
     * 获取所有检查项
     * @returns {Array} 所有检查项列表
     */
    getAllChecks() {
        const checks = [];
        Object.values(this.rules).forEach(rule => {
            rule.checks.forEach(check => {
                checks.push({
                    ...check,
                    category: rule.name,
                    categoryId: rule.id,
                    weight: rule.weight
                });
            });
        });
        return checks;
    }

    /**
     * 根据类别获取检查项
     * @param {string} categoryId - 类别ID
     * @returns {Array} 检查项列表
     */
    getChecksByCategory(categoryId) {
        const rule = this.getRuleById(categoryId);
        return rule ? rule.checks : [];
    }

    /**
     * 根据类别名称获取检查项
     * @param {string} categoryName - 类别名称
     * @returns {Array} 检查项列表
     */
    getChecksByCategoryName(categoryName) {
        const rule = Object.values(this.rules).find(r => r.name === categoryName);
        return rule ? rule.checks : [];
    }

    /**
     * 根据严重程度获取检查项
     * @param {string} severity - 严重程度 (critical, high, medium, low)
     * @returns {Array} 检查项列表
     */
    getChecksBySeverity(severity) {
        const allChecks = this.getAllChecks();
        return allChecks.filter(check => check.severity === severity);
    }

    /**
     * 获取严重程度的中文描述
     * @param {string} severity - 严重程度
     * @returns {string} 中文描述
     */
    getSeverityLabel(severity) {
        const labels = {
            'critical': '严重',
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        return labels[severity] || severity;
    }

    /**
     * 获取严重程度的CSS类名
     * @param {string} severity - 严重程度
     * @returns {string} CSS类名
     */
    getSeverityClass(severity) {
        const classes = {
            'critical': 'severity-critical',
            'high': 'severity-high',
            'medium': 'severity-medium',
            'low': 'severity-low'
        };
        return classes[severity] || '';
    }
}

// 导出可用性规则库
const usabilityRules = new UsabilityRules();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UsabilityRules, usabilityRules };
}