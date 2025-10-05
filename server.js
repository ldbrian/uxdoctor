const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;
const apiRoutes = require('./routes/api');
const { aiAnalyzer } = require('./js/ai-analyzer');
const { configManager } = require('./js/config-manager');

const app = express();
const PORT = process.env.PORT || 8080;

// 创建上传目录（如果不存在）
async function createUploadsDir() {
    try {
        await fs.access('uploads');
    } catch (error) {
        // 如果目录不存在，则创建它
        if (error.code === 'ENOENT') {
            await fs.mkdir('uploads');
        } else {
            // 如果是其他错误，重新抛出
            throw error;
        }
    }
}

// 初始化AI分析器
async function initAIAnalyzer() {
    try {
        console.log('正在初始化AI分析器...');
        // 加载持久化配置
        await aiAnalyzer.initConfig();
        console.log('AI分析器初始化完成');
        
        // 显示当前AI配置
        const config = configManager.getConfig();
        console.log(`当前主AI模型: ${config.primaryAI}`);
        
        if (!config.openaiApiKey) {
            console.log('提示: 未配置OpenAI API密钥');
        }
        
        if (config.primaryAI === 'deepseek' && !config.deepSeekApiKey) {
            console.log('提示: 未配置DeepSeek API密钥');
        }
    } catch (error) {
        console.error('AI分析器初始化失败:', error);
    }
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '5mb' })); // 增加JSON大小限制
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // 增加URL编码大小限制

// API路由
app.use('/api', apiRoutes);

// 静态文件服务
app.use(express.static('.'));

// 为所有其他请求提供前端应用
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器前创建上传目录并初始化AI分析器
createUploadsDir()
    .then(() => {
        return initAIAnalyzer();
    })
    .then(() => {
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`访问地址: http://localhost:${PORT}`);
            
            // 显示AI模型使用状态
            const config = configManager.getConfig();
            console.log(`✓ AI模型配置完成，主模型: ${config.primaryAI}`);
        });
        
        // 添加错误处理
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`端口 ${PORT} 已被占用，尝试使用其他端口...`);
                server.close();
                const newPort = PORT + 1;
                setTimeout(() => {
                    app.listen(newPort, '0.0.0.0', () => {
                        console.log(`服务器运行在端口 ${newPort}`);
                        console.log(`访问地址: http://localhost:${newPort}`);
                        
                        // 显示AI模型使用状态
                        const config = configManager.getConfig();
                        console.log(`✓ AI模型配置完成，主模型: ${config.primaryAI}`);
                    });
                }, 1000);
            } else {
                console.error('服务器启动错误:', error);
            }
        });
    })
    .catch((error) => {
        console.error('服务器启动失败:', error);
    });