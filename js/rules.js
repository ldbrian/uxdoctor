/**
 * UXDoctor 规则库 (已弃用)
 * 请使用 usability-rules.js 替代
 */

console.warn('rules.js 已弃用，请使用 usability-rules.js');

// 为了保持向后兼容性，仍然导出旧的规则类
class UXRules {
    constructor() {
        // 定义检测规则
        this.rules = {
            navigation: {
                id: 'navigation',
                name: '导航体验',
                description: '检测导航结构、菜单项命名、面包屑等导航相关问题',
                weight: 0.20,
                checks: [
                    {
                        id: 'nav_depth',
                        name: '导航层级深度',
                        description: '检查导航层级是否过深',
                        severity: 'high'
                    },
                    {
                        id: 'menu_naming',
                        name: '菜单项命名',
                        description: '检查菜单项命名是否直观易懂',
                        severity: 'medium'
                    },
                    {
                        id: 'breadcrumb',
                        name: '面包屑导航',
                        description: '检查是否提供面包屑导航',
                        severity: 'medium'
                    }
                ]
            },
            visualDesign: {
                id: 'visualDesign',
                name: '视觉设计',
                description: '检测颜色对比度、字体大小、按钮尺寸等视觉设计问题',
                weight: 0.25,
                checks: [
                    {
                        id: 'contrast',
                        name: '颜色对比度',
                        description: '检查文本与背景的颜色对比度',
                        severity: 'high'
                    },
                    {
                        id: 'button_size',
                        name: '按钮尺寸',
                        description: '检查按钮尺寸是否便于点击',
                        severity: 'medium'
                    },
                    {
                        id: 'color_scheme',
                        name: '配色方案',
                        description: '检查颜色搭配是否协调',
                        severity: 'low'
                    }
                ]
            },
            form: {
                id: 'form',
                name: '表单设计',
                description: '检测表单字段数量、验证提示、必填项标识等问题',
                weight: 0.25,
                checks: [
                    {
                        id: 'field_count',
                        name: '字段数量',
                        description: '检查表单字段数量是否过多',
                        severity: 'high'
                    },
                    {
                        id: 'validation',
                        name: '验证提示',
                        description: '检查表单验证提示是否清晰',
                        severity: 'medium'
                    },
                    {
                        id: 'required_fields',
                        name: '必填项标识',
                        description: '检查必填项是否有明确标识',
                        severity: 'medium'
                    }
                ]
            },
            information: {
                id: 'information',
                name: '信息架构',
                description: '检测信息密度、内容组织、视觉层次等问题',
                weight: 0.20,
                checks: [
                    {
                        id: 'info_density',
                        name: '信息密度',
                        description: '检查页面信息密度过高问题',
                        severity: 'high'
                    },
                    {
                        id: 'content_structure',
                        name: '内容结构',
                        description: '检查内容组织是否清晰',
                        severity: 'medium'
                    },
                    {
                        id: 'visual_hierarchy',
                        name: '视觉层次',
                        description: '检查是否建立清晰的视觉层次',
                        severity: 'medium'
                    }
                ]
            },
            accessibility: {
                id: 'accessibility',
                name: '可访问性',
                description: '检测无障碍设计支持情况',
                weight: 0.10,
                checks: [
                    {
                        id: 'alt_text',
                        name: '替代文本',
                        description: '检查图片是否有替代文本',
                        severity: 'medium'
                    },
                    {
                        id: 'keyboard_nav',
                        name: '键盘导航',
                        description: '检查是否支持键盘导航',
                        severity: 'high'
                    },
                    {
                        id: 'aria_labels',
                        name: 'ARIA标签',
                        description: '检查是否使用适当的ARIA标签',
                        severity: 'medium'
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
     * 获取规则的检查项
     * @param {string} ruleId - 规则ID
     * @returns {Array} 检查项列表
     */
    getRuleChecks(ruleId) {
        const rule = this.getRuleById(ruleId);
        return rule ? rule.checks : [];
    }
}

// 导出规则库
const uxRules = new UXRules();

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UXRules, uxRules };
}