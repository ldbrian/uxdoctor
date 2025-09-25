const fs = require('fs').promises;
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

// 默认配置
const DEFAULT_CONFIG = {
    openaiApiKey: null,
    deepSeekApiKey: null,
    primaryAI: 'openai'
};

class ConfigManager {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.configLoaded = false;
    }

    /**
     * 加载配置文件
     */
    async loadConfig() {
        try {
            await fs.access(CONFIG_FILE);
            const configFile = await fs.readFile(CONFIG_FILE, 'utf8');
            const savedConfig = JSON.parse(configFile);
            this.config = { ...DEFAULT_CONFIG, ...savedConfig };
            this.configLoaded = true;
            console.log('配置文件加载成功');
        } catch (error) {
            // 配置文件不存在或读取失败，使用默认配置
            this.config = { ...DEFAULT_CONFIG };
            this.configLoaded = true;
            console.log('使用默认配置');
        }
        return this.config;
    }

    /**
     * 保存配置到文件
     */
    async saveConfig(config) {
        try {
            // 合并配置
            this.config = { ...this.config, ...config };
            
            // 保存到文件
            await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            console.log('配置保存成功');
            return true;
        } catch (error) {
            console.error('配置保存失败:', error);
            return false;
        }
    }

    /**
     * 获取当前配置
     */
    getConfig() {
        return this.config;
    }

    /**
     * 更新配置
     */
    async updateConfig(newConfig) {
        const updatedConfig = { ...this.config, ...newConfig };
        const success = await this.saveConfig(updatedConfig);
        if (success) {
            this.config = updatedConfig;
        }
        return success;
    }
}

// 导出单例
const configManager = new ConfigManager();

module.exports = { configManager, ConfigManager };