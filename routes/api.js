const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { aiAnalyzer } = require('../js/ai-analyzer');
const { configManager } = require('../js/config-manager');
const { analysisEngine } = require('../js/analysis-engine');

const router = express.Router();

// 上传目录
const UPLOAD_DIR = 'uploads/';

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

// 确保上传目录存在（应用启动时）
ensureUploadDir().catch(console.error);

// 更新AI配置
router.post('/update-config', async (req, res) => {
  try {
    const { openaiKey, deepseekKey, primaryAI } = req.body;
    
    // 准备要更新的配置
    const configUpdate = {};
    
    // 只有当提供了新值时才更新密钥
    if (openaiKey !== undefined) {
      configUpdate.openaiApiKey = openaiKey || null;
    }
    
    if (deepseekKey !== undefined) {
      configUpdate.deepSeekApiKey = deepseekKey || null;
    }
    
    if (primaryAI) {
      configUpdate.primaryAI = primaryAI;
    }
    
    // 持久化配置到文件
    const success = await configManager.updateConfig(configUpdate);
    
    if (success) {
      // 确保配置已更新后再获取最新的配置
      const updatedConfig = configManager.getConfig();
      
      // 更新AI分析器配置
      aiAnalyzer.updateConfig({
        openaiKey: updatedConfig.openaiApiKey,
        deepseekKey: updatedConfig.deepSeekApiKey,
        primaryAI: updatedConfig.primaryAI
      });
      
      res.json({ 
        success: true, 
        message: '配置更新成功',
        data: {
          primaryAI: updatedConfig.primaryAI
        }
      });
    } else {
      res.status(500).json({ success: false, error: '配置保存失败' });
    }
  } catch (error) {
    console.error('配置更新失败:', error);
    res.status(500).json({ success: false, error: '配置更新失败: ' + error.message });
  }
});

// 获取当前配置（不返回敏感信息）
router.get('/config', async (req, res) => {
  try {
    const config = configManager.getConfig();
    res.json({
      success: true,
      data: {
        primaryAI: config.primaryAI,
        openaiKey: config.openaiApiKey ? 'configured' : 'not_configured', // 不返回实际密钥值
        deepseekKey: config.deepSeekApiKey ? 'configured' : 'not_configured' // 不返回实际密钥值
      }
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ success: false, error: '获取配置失败' });
  }
});

// 测试AI配置
router.post('/test-config', async (req, res) => {
  try {
    // 创建一个简单的测试提示
    const testPrompt = "请用一个词回答：测试";
    
    // 尝试调用AI
    const result = await aiAnalyzer.callAI(testPrompt);
    
    res.json({
      success: true,
      message: 'AI配置测试成功',
      data: {
        result: result.substring(0, 100) + (result.length > 100 ? '...' : '') // 只返回前100个字符
      }
    });
  } catch (error) {
    console.error('AI配置测试失败:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI配置测试失败: ' + error.message 
    });
  }
});

// 分析URL
router.post('/analyze-url', async (req, res) => {
  try {
    const { url, deviceType, businessContext } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL是必需的'
      });
    }
    
    // 解析业务上下文信息
    const businessInfo = businessContext ? { businessContext } : {};
    
    // 使用分析引擎分析URL
    const result = await analysisEngine.analyzeURL(url, {
      deviceType,
      ...businessInfo
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('URL分析失败:', error);
    res.status(500).json({ 
      success: false, 
      error: 'URL分析失败: ' + error.message 
    });
  }
});

// 分析截图
router.post('/analyze-screenshot', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '截图文件是必需的'
      });
    }
    
    const deviceType = req.body.deviceType || 'auto';
    
    // 获取业务相关信息
    const businessContext = req.body.businessContext || '';
    
    // 使用分析引擎分析截图
    const result = await analysisEngine.analyzeScreenshot(req.file.path, {
      deviceType,
      businessContext
    });
    
    // 删除临时文件
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.warn('删除临时文件失败:', unlinkError);
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('截图分析失败:', error);
    
    // 删除可能存在的临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('删除临时文件失败:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: '截图分析失败: ' + error.message 
    });
  }
});

module.exports = router;