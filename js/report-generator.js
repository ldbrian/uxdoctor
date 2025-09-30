/**
 * 智能报告生成器
 * 负责生成结构化、可读性强的UX分析报告
 */

class ReportGenerator {
  /**
   * 生成针对业务目标的执行摘要
   * @param {Array} issues - 问题列表
   * @param {Object} businessContext - 业务上下文
   * @returns {string} 执行摘要
   */
  generateExecutiveSummary(issues, businessContext) {
    // 根据问题严重程度分类统计
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
    const lowIssues = issues.filter(issue => issue.severity === 'low').length;
    
    // 根据业务上下文生成摘要
    const industry = businessContext.industry || '网站';
    const businessGoal = businessContext.businessGoal || '提升用户体验';
    
    return `本次${industry}的用户体验体检共发现${issues.length}个问题，其中严重问题${criticalIssues}个，高影响问题${highIssues}个，中等影响问题${mediumIssues}个，低影响问题${lowIssues}个。这些问题可能影响您的${businessGoal}目标的实现。建议优先解决严重和高影响问题，以快速提升用户体验。`;
  }
  
  /**
   * 在截图上标注问题位置（数字标记）
   * @param {Buffer} screenshot - 截图数据
   * @param {Array} issues - 问题列表
   * @returns {Buffer} 标注后的截图
   */
  createVisualAnnotations(screenshot, issues) {
    // 这个功能需要在后端实现，因为涉及图像处理
    // 前端无法直接处理图像标注
    console.log('图像标注功能需要在后端实现');
    return screenshot;
  }
  
  /**
   * 根据业务目标重新排序问题优先级
   * @param {Array} issues - 问题列表
   * @param {Object} businessContext - 业务上下文
   * @returns {Array} 按业务影响排序的问题列表
   */
  prioritizeByBusinessImpact(issues, businessContext) {
    // 根据业务上下文调整问题优先级
    const businessGoal = businessContext.businessGoal || '';
    const keyAction = businessContext.keyAction || '';
    
    return issues.sort((a, b) => {
      // 首先按严重程度排序
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // 如果业务目标与转化相关，提升与关键操作相关问题的优先级
      if (businessGoal.includes('转化') || businessGoal.includes('销售') || businessGoal.includes('注册')) {
        // 检查问题是否与关键操作相关
        const aRelatedToKeyAction = this.isIssueRelatedToKeyAction(a, keyAction);
        const bRelatedToKeyAction = this.isIssueRelatedToKeyAction(b, keyAction);
        
        if (aRelatedToKeyAction && !bRelatedToKeyAction) return -1;
        if (!aRelatedToKeyAction && bRelatedToKeyAction) return 1;
      }
      
      // 按置信度排序
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }
  
  /**
   * 判断问题是否与关键操作相关
   * @param {Object} issue - 问题对象
   * @param {string} keyAction - 关键操作描述
   * @returns {boolean} 是否相关
   */
  isIssueRelatedToKeyAction(issue, keyAction) {
    if (!keyAction || !issue.element) return false;
    
    // 检查元素文本是否包含关键操作关键词
    const elementText = issue.element.text || '';
    const elementTag = issue.element.tag || '';
    
    // 常见的关键操作关键词
    const keyActionKeywords = [
      '购买', '注册', '登录', '提交', '确认', '下单', '支付',
      'buy', 'register', 'login', 'submit', 'confirm', 'order', 'pay'
    ];
    
    // 检查元素文本
    for (const keyword of keyActionKeywords) {
      if (elementText.includes(keyword) || keyAction.includes(keyword)) {
        return true;
      }
    }
    
    // 检查元素标签
    if (['button', 'a', 'input'].includes(elementTag)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 为每个问题生成具体、可操作的改进步骤
   * @param {Array} issues - 问题列表
   * @returns {Array} 包含具体建议的问题列表
   */
  generateActionableSuggestions(issues) {
    return issues.map(issue => {
      // 如果已经有具体建议，直接返回
      if (issue.suggestion && issue.suggestion.length > 10) {
        return issue;
      }
      
      // 根据问题类型生成具体建议
      let suggestion = '';
      
      switch (issue.rule_id) {
        case 'contrast-001':
          suggestion = '调整文字颜色或背景色以提高对比度，确保文字与背景的对比度至少达到4.5:1（WCAG AA标准）。可以使用在线对比度检查工具验证调整后的效果。';
          break;
        case 'font-size-001':
          suggestion = '将正文字号调整为至少14px，标题文字可以更大以形成清晰的视觉层次。确保在各种设备上文字都清晰可读。';
          break;
        case 'clickable-size-001':
          suggestion = '增加可点击元素的尺寸至至少44x44像素，或者增加元素的内边距(padding)以扩大点击区域，确保用户容易点击。';
          break;
        case 'form-label-001':
          suggestion = '为表单控件添加明确的标签，可以使用<label>标签关联表单控件，或者使用aria-label属性提供替代文本。';
          break;
        case 'required-field-001':
          suggestion = '使用星号(*)或其他明显的标识来标记必填字段，并在表单说明中明确指出带星号的字段为必填项。';
          break;
        case 'aria-label-001':
          suggestion = '为交互元素添加描述性的aria-label属性，或者确保元素包含可见的文本内容，以便屏幕阅读器用户理解元素用途。';
          break;
        case 'alt-text-001':
          suggestion = '为图片添加描述性的alt属性，准确描述图片内容或功能。装饰性图片可以使用空的alt属性（alt=""）。';
          break;
        default:
          suggestion = '请根据问题描述和元素上下文，采取相应的改进措施。如有疑问，可以参考相关的Web标准和最佳实践。';
      }
      
      return {
        ...issue,
        suggestion: suggestion
      };
    });
  }
  
  /**
   * 生成维度评分
   * @param {Array} issues - 问题列表
   * @returns {Object} 各维度评分
   */
  generateDimensionScores(issues) {
    // 初始化各维度评分
    const dimensionScores = {
      accessibility: 100,
      visual: 100,
      form: 100,
      navigation: 100,
      performance: 100
    };
    
    // 根据问题严重程度扣分
    issues.forEach(issue => {
      const deduction = this.getScoreDeduction(issue.severity);
      if (issue.type === 'accessibility') {
        dimensionScores.accessibility -= deduction;
      } else if (issue.element && ['h1', 'h2', 'h3', 'p', 'span'].includes(issue.element.tag)) {
        dimensionScores.visual -= deduction;
      } else if (issue.element && ['input', 'select', 'textarea', 'form'].includes(issue.element.tag)) {
        dimensionScores.form -= deduction;
      } else if (issue.element && ['a', 'nav', 'header', 'footer'].includes(issue.element.tag)) {
        dimensionScores.navigation -= deduction;
      } else {
        // 默认扣分到视觉维度
        dimensionScores.visual -= deduction;
      }
    });
    
    // 确保评分不低于0
    Object.keys(dimensionScores).forEach(key => {
      dimensionScores[key] = Math.max(0, dimensionScores[key]);
    });
    
    return dimensionScores;
  }
  
  /**
   * 根据严重程度获取扣分值
   * @param {string} severity - 严重程度
   * @returns {number} 扣分值
   */
  getScoreDeduction(severity) {
    switch (severity) {
      case 'critical': return 20;
      case 'high': return 10;
      case 'medium': return 5;
      case 'low': return 2;
      default: return 1;
    }
  }
}

// 导出报告生成器
const reportGenerator = new ReportGenerator();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportGenerator, reportGenerator };
}