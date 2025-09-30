/**
 * 用户管理系统
 * 负责用户认证、配额管理和权限控制
 */

class UserManager {
  constructor() {
    // 免费用户配额
    this.freeTier = {
      analysesPerMonth: 5,
      features: ['basic_analysis']
    };
    
    // 付费用户配额
    this.paidTier = {
      analysesPerMonth: 50,
      features: ['deep_analysis', 'export', 'history']
    };
    
    // 企业用户配额
    this.enterpriseTier = {
      analysesPerMonth: -1, // 无限制
      features: ['deep_analysis', 'export', 'history', 'api_access', 'custom_rules']
    };
  }

  /**
   * 检查用户当月使用次数
   * @param {string} userId - 用户ID
   * @returns {Object} 用户使用情况
   */
  async checkQuota(userId) {
    // 在实际实现中，这里应该查询数据库获取用户使用情况
    // 目前使用localStorage模拟用户数据存储
    try {
      const userData = this.getUserData(userId);
      const usage = userData.usage || { count: 0, month: this.getCurrentMonth() };
      
      // 如果不是当月的数据，重置计数
      if (usage.month !== this.getCurrentMonth()) {
        usage.count = 0;
        usage.month = this.getCurrentMonth();
      }
      
      const tier = userData.tier || 'free';
      const quota = this.getTierQuota(tier);
      
      return {
        used: usage.count,
        limit: quota.analysesPerMonth,
        remaining: quota.analysesPerMonth === -1 ? -1 : quota.analysesPerMonth - usage.count,
        tier: tier,
        features: quota.features
      };
    } catch (error) {
      console.error('检查配额时出错:', error);
      // 返回默认免费配额
      return {
        used: 0,
        limit: this.freeTier.analysesPerMonth,
        remaining: this.freeTier.analysesPerMonth,
        tier: 'free',
        features: this.freeTier.features
      };
    }
  }

  /**
   * 增加用户使用次数
   * @param {string} userId - 用户ID
   */
  async incrementUsage(userId) {
    try {
      const userData = this.getUserData(userId);
      const usage = userData.usage || { count: 0, month: this.getCurrentMonth() };
      
      // 如果不是当月的数据，重置计数
      if (usage.month !== this.getCurrentMonth()) {
        usage.count = 0;
        usage.month = this.getCurrentMonth();
      }
      
      // 增加使用次数
      usage.count += 1;
      
      // 更新用户数据
      userData.usage = usage;
      this.setUserData(userId, userData);
      
      return usage.count;
    } catch (error) {
      console.error('增加使用次数时出错:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否可以升级
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否可以升级
   */
  async canUpgrade(userId) {
    // 在实际实现中，这里应该根据用户的支付状态和订阅情况来判断
    // 目前简单地允许所有用户升级
    try {
      const userData = this.getUserData(userId);
      return userData.tier !== 'enterprise';
    } catch (error) {
      console.error('检查升级权限时出错:', error);
      return true; // 默认允许升级
    }
  }

  /**
   * 升级用户套餐
   * @param {string} userId - 用户ID
   * @param {string} tier - 目标套餐等级 ('paid' 或 'enterprise')
   * @returns {boolean} 升级是否成功
   */
  async upgradeUser(userId, tier) {
    if (!['paid', 'enterprise'].includes(tier)) {
      throw new Error('无效的套餐等级');
    }
    
    try {
      const userData = this.getUserData(userId);
      userData.tier = tier;
      this.setUserData(userId, userData);
      return true;
    } catch (error) {
      console.error('升级用户套餐时出错:', error);
      return false;
    }
  }

  /**
   * 获取用户数据
   * @param {string} userId - 用户ID
   * @returns {Object} 用户数据
   */
  getUserData(userId) {
    // 在实际实现中，这里应该从数据库获取用户数据
    // 目前使用localStorage模拟
    const userDataKey = `uxdoctor_user_${userId}`;
    const userDataStr = localStorage.getItem(userDataKey);
    
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
    
    // 如果用户数据不存在，创建默认数据
    const defaultUserData = {
      id: userId,
      tier: 'free', // 默认为免费用户
      usage: {
        count: 0,
        month: this.getCurrentMonth()
      },
      createdAt: new Date().toISOString()
    };
    
    this.setUserData(userId, defaultUserData);
    return defaultUserData;
  }

  /**
   * 设置用户数据
   * @param {string} userId - 用户ID
   * @param {Object} userData - 用户数据
   */
  setUserData(userId, userData) {
    // 在实际实现中，这里应该将用户数据保存到数据库
    // 目前使用localStorage模拟
    const userDataKey = `uxdoctor_user_${userId}`;
    localStorage.setItem(userDataKey, JSON.stringify(userData));
  }

  /**
   * 获取当前月份 (YYYY-MM格式)
   * @returns {string} 当前月份
   */
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * 根据套餐等级获取配额
   * @param {string} tier - 套餐等级
   * @returns {Object} 配额信息
   */
  getTierQuota(tier) {
    switch (tier) {
      case 'paid':
        return this.paidTier;
      case 'enterprise':
        return this.enterpriseTier;
      default:
        return this.freeTier;
    }
  }

  /**
   * 检查用户是否可以执行分析
   * @param {string} userId - 用户ID
   * @returns {Object} 检查结果
   */
  async canPerformAnalysis(userId) {
    const quota = await this.checkQuota(userId);
    
    // 检查是否有剩余配额
    const hasQuota = quota.remaining === -1 || quota.remaining > 0;
    
    return {
      allowed: hasQuota,
      reason: hasQuota ? null : '配额已用完',
      quota: quota
    };
  }
}

// 导出用户管理器
const userManager = new UserManager();

// 为浏览器环境导出
if (typeof window !== 'undefined') {
  window.userManager = userManager;
}

// 为Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserManager, userManager };
}