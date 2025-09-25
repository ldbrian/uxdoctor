const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { aiAnalyzer } = require('../js/ai-analyzer');
const { configManager } = require('../js/config-manager');

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
      primaryAI: primaryAI || 'openai'
    });
    
    // 持久化配置
    const success = await configManager.updateConfig({
      openaiApiKey: openaiKey || null,
      deepSeekApiKey: deepseekKey || null,
      primaryAI: primaryAI || 'openai'
    });
    
    if (success) {
      res.json({ success: true, message: '配置更新成功' });
    } else {
      res.status(500).json({ success: false, error: '配置保存失败' });
    }
  } catch (error) {
    console.error('配置更新失败:', error);
    res.status(500).json({ success: false, error: '配置更新失败' });
  }
});

// URL分析接口
router.post('/analyze-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL不能为空' 
            });
        }
        
        // 验证URL格式
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL格式不正确' 
            });
        }
        
        console.log(`开始分析URL: ${url}`);
        
        // 调用AI分析器
        const result = await aiAnalyzer.analyzeURL(url);
        
        // 确保返回正确的格式
        if (result) {
            res.json({
                success: true,
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: '分析失败，未返回有效结果'
            });
        }
    } catch (error) {
        console.error('URL分析失败:', error);
        
        // 特别处理余额不足的错误
        if (error.message && error.message.includes('余额不足')) {
            return res.status(402).json({
                success: false,
                error: `API余额不足，请联系管理员充值后重试: ${error.message}`
            });
        }
        
        res.status(500).json({
            success: false,
            error: `分析过程中发生错误: ${error.message}`
        });
    }
});

// 截图分析接口
router.post('/analyze-screenshot', upload.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: '请上传截图文件' 
            });
        }
        
        console.log(`开始分析截图: ${req.file.path}`);
        
        // 读取文件内容
        const buffer = await fs.readFile(req.file.path);
        
        // 调用AI分析器
        const result = await aiAnalyzer.analyzeScreenshot(buffer);
        
        // 删除临时文件
        try {
            await fs.unlink(req.file.path);
        } catch (unlinkError) {
            console.error('删除临时文件失败:', unlinkError);
        }
        
        // 确保返回正确的格式
        if (result) {
            res.json({
                success: true,
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                error: '分析失败，未返回有效结果'
            });
        }
    } catch (error) {
        console.error('截图分析失败:', error);
        
        // 删除可能存在的临时文件
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('删除临时文件失败:', unlinkError);
            }
        }
        
        // 特别处理余额不足的错误
        if (error.message && error.message.includes('余额不足')) {
            return res.status(402).json({
                success: false,
                error: `API余额不足，请联系管理员充值后重试: ${error.message}`
            });
        }
        
        res.status(500).json({
            success: false,
            error: `分析过程中发生错误: ${error.message}`
        });
    }
});

module.exports = router;