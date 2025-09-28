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
    
    // 更新AI分析器配置
    aiAnalyzer.updateConfig({
      openaiKey: openaiKey || null,
      deepseekKey: deepseekKey || null,
      primaryAI: primaryAI || 'deepseek'
    });
    
    // 持久化非敏感配置
    const success = await configManager.updateConfig({
      primaryAI: primaryAI || 'deepseek'
    });
    
    if (success) {
      res.json({ 
        success: true, 
        message: '配置更新成功',
        data: {
          primaryAI: primaryAI || 'deepseek'
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
        primaryAI: config.primaryAI
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
    const { url, deviceType, industry, businessGoal, keyAction, targetUsers, additionalInfo } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL是必需的'
      });
    }
    
    // 使用分析引擎分析URL
    const result = await analysisEngine.analyzeURL(url, {
      deviceType,
      industry,
      businessGoal,
      keyAction,
      targetUsers,
      additionalInfo
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
    const industry = req.body.industry || '';
    const businessGoal = req.body.businessGoal || '';
    const keyAction = req.body.keyAction || '';
    const targetUsers = req.body.targetUsers || '';
    const additionalInfo = req.body.additionalInfo || '';
    
    // 使用分析引擎分析截图
    const result = await analysisEngine.analyzeScreenshot(req.file.path, {
      deviceType,
      industry,
      businessGoal,
      keyAction,
      targetUsers,
      additionalInfo
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