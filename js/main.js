console.log('JavaScript文件开始加载');

// 定义全局变量
let urlInput, screenshotInput, prototypeInput, uploadArea, uxForm, submitBtn;
let loadingSection, resultsSection, historyList, deviceTypeInputs, uploadSection;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('页面加载完成');
    
    // 初始化DOM元素引用
    urlInput = document.getElementById('url-input');
    screenshotInput = document.getElementById('screenshot-input');
    prototypeInput = document.getElementById('prototype-input');
    uploadArea = document.getElementById('upload-area');
    uxForm = document.getElementById('ux-analysis-form');
    submitBtn = document.getElementById('submit-btn');
    loadingSection = document.querySelector('.loading-section');
    resultsSection = document.getElementById('results-section');
    historyList = document.getElementById('history-list');
    deviceTypeInputs = document.querySelectorAll('input[name="device-type"]');
    uploadSection = document.querySelector('.upload-section');
    
    // 初始化配置
    await initConfig();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 加载历史记录
    loadHistory();
});

/**
 * 初始化配置
 */
async function initConfig() {
    try {
        console.log('正在初始化配置...');
        
        // 从服务器获取当前配置
        const response = await fetch('http://localhost:8080/api/config');
        const result = await response.json();
        
        if (result.success) {
            const config = result.data;
            console.log('配置初始化完成:', config);
            
            // 更新UI显示当前配置
            updateConfigUI(config);
        } else {
            console.error('配置初始化失败:', result.error);
        }
    } catch (error) {
        console.error('配置初始化出错:', error);
    }
}

/**
 * 更新配置UI
 * @param {Object} config - 配置对象
 */
function updateConfigUI(config) {
    // 更新主模型显示
    const modelDisplay = document.getElementById('current-model');
    if (modelDisplay) {
        modelDisplay.textContent = config.primaryAI === 'openai' ? 'OpenAI' : 'DeepSeek';
    }
    
    // 更新API密钥显示（隐藏大部分字符）
    const openaiKeyElement = document.getElementById('openai-key-display');
    const deepseekKeyElement = document.getElementById('deepseek-key-display');
    
    if (openaiKeyElement && config.openaiKey) {
        openaiKeyElement.textContent = `••••••••${config.openaiKey.slice(-4)}`;
        openaiKeyElement.parentElement.classList.add('configured');
        openaiKeyElement.parentElement.classList.remove('unconfigured');
    } else if (openaiKeyElement) {
        openaiKeyElement.textContent = '未配置';
        openaiKeyElement.parentElement.classList.add('unconfigured');
        openaiKeyElement.parentElement.classList.remove('configured');
    }
    
    if (deepseekKeyElement && config.deepseekKey) {
        deepseekKeyElement.textContent = `••••••••${config.deepseekKey.slice(-4)}`;
        deepseekKeyElement.parentElement.classList.add('configured');
        deepseekKeyElement.parentElement.classList.remove('unconfigured');
    } else if (deepseekKeyElement) {
        deepseekKeyElement.textContent = '未配置';
        deepseekKeyElement.parentElement.classList.add('unconfigured');
        deepseekKeyElement.parentElement.classList.remove('configured');
    }
    
    // 更新配置状态提示
    const configStatus = document.getElementById('config-status');
    if (configStatus) {
        if (config.openaiKey || config.deepseekKey) {
            configStatus.textContent = '配置已就绪';
            configStatus.className = 'config-status ready';
        } else {
            configStatus.textContent = '等待配置';
            configStatus.className = 'config-status pending';
        }
    }
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 表单提交事件
    if (uxForm) {
        uxForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleFormSubmit();
        });
    }
    
    // 文件拖拽事件
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // 文件选择事件
    if (screenshotInput) {
        screenshotInput.addEventListener('change', handleFileSelect);
    }
    
    // 配置表单提交事件
    const configForm = document.getElementById('api-config-form');
    if (configForm) {
        configForm.addEventListener('submit', handleConfigSubmit);
    }
    
    // 测试配置事件
    const testConfigBtn = document.getElementById('test-config');
    if (testConfigBtn) {
        testConfigBtn.addEventListener('click', testConfig);
    }
    
    // 模型选择事件
    const modelOptions = document.querySelectorAll('.model-option');
    modelOptions.forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.model-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
}

/**
 * 处理表单提交
 */
async function handleFormSubmit() {
    console.log('表单提交事件触发');
    
    // 获取输入数据
    const url = urlInput ? urlInput.value : '';
    const screenshot = screenshotInput ? screenshotInput.files[0] : null;
    const deviceType = document.querySelector('input[name="device-type"]:checked')?.value || 'auto';
    
    console.log('输入数据:', { url, screenshot, deviceType });
    
    // 显示加载状态
    if (uploadSection) uploadSection.classList.add('hidden');
    if (loadingSection) loadingSection.classList.remove('hidden');
    
    try {
        let result;
        if (screenshot) {
            console.log('处理截图上传');
            // 处理截图上传
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            formData.append('deviceType', deviceType);
            
            const response = await fetch('http://localhost:8080/api/analyze-screenshot', {
                method: 'POST',
                body: formData
            });
            
            console.log('截图上传响应:', response);
            
            const data = await response.json();
            console.log('截图上传返回数据:', data);
            
            if (!data.success) {
                throw new Error(data.error || '分析失败');
            }
            result = data.data;
        } else if (url) {
            console.log('处理URL分析');
            // 处理URL分析
            const response = await fetch('http://localhost:8080/api/analyze-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, deviceType })
            });
            
            console.log('URL分析响应:', response);
            
            const data = await response.json();
            console.log('URL分析返回数据:', data);
            
            if (!data.success) {
                throw new Error(data.error || '分析失败');
            }
            result = data.data;
        } else {
            throw new Error('请提供URL或上传截图');
        }
        
        console.log('分析结果:', result);
        
        // 保存到历史记录
        if (screenshot) {
            saveToHistory(result, `截图: ${screenshot.name}`, deviceType);
        } else if (url) {
            saveToHistory(result, url, deviceType);
        }
        
        // 生成报告
        generateReport(result);
        if (loadingSection) loadingSection.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');
    } catch (error) {
        console.error('分析出错:', error);
        showError('分析过程中发生错误: ' + error.message);
        if (loadingSection) loadingSection.classList.add('hidden');
        if (uploadSection) uploadSection.classList.remove('hidden');
    }
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
    // 创建或更新错误消息元素
    let errorElement = document.getElementById('analysis-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'analysis-error';
        errorElement.className = 'error-message';
        if (uploadSection) {
            uploadSection.prepend(errorElement);
        }
    }
    errorElement.textContent = message;
    
    // 3秒后自动隐藏错误消息
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

/**
 * 处理配置表单提交
 * @param {Event} e - 事件对象
 */
async function handleConfigSubmit(e) {
    e.preventDefault();
    
    const openaiKey = document.getElementById('openai-key').value;
    const deepseekKey = document.getElementById('deepseek-key').value;
    const primaryModel = document.querySelector('.model-option.selected').dataset.model;
    
    try {
        // 显示加载状态
        const saveButton = document.querySelector('#api-config-form button[type="submit"]');
        const originalText = saveButton.textContent;
        saveButton.textContent = '保存中...';
        saveButton.disabled = true;
        
        // 发送配置更新请求
        const response = await fetch('http://localhost:8080/api/update-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                openaiKey: openaiKey || null,
                deepseekKey: deepseekKey || null,
                primaryAI: primaryModel
            })
        });
        
        const result = await response.json();
        
        // 恢复按钮状态
        saveButton.textContent = originalText;
        saveButton.disabled = false;
        
        if (result.success) {
            showNotification('配置已保存！', 'success');
            // 更新UI显示
            updateConfigUI({ primaryAI: primaryModel });
        } else {
            showNotification('配置保存失败: ' + result.error, 'error');
        }
    } catch (error) {
        showNotification('配置保存出错: ' + error.message, 'error');
    }
}

/**
 * 测试配置
 */
async function testConfig() {
    try {
        // 显示测试状态
        const testButton = document.getElementById('test-config');
        const originalText = testButton.textContent;
        testButton.textContent = '测试中...';
        testButton.disabled = true;
        
        // 发送测试请求
        const response = await fetch('http://localhost:8080/api/test-config', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        // 恢复按钮状态
        testButton.textContent = originalText;
        testButton.disabled = false;
        
        if (result.success) {
            showNotification('AI配置测试成功！', 'success');
        } else {
            showNotification('测试失败: ' + result.error, 'error');
        }
    } catch (error) {
        showNotification('测试出错: ' + error.message, 'error');
    }
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('success' 或 'error')
 */
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        // 3秒后自动隐藏通知
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

/**
 * 保存分析记录到历史记录
 * @param {Object} result - 分析结果
 * @param {string} input - 输入内容（URL或截图信息）
 * @param {string} deviceType - 设备类型
 */
function saveToHistory(result, input, deviceType) {
    console.log('保存到历史记录');
    
    // 生成记录ID
    const recordId = 'record_' + Date.now();
    
    // 创建记录对象
    const record = {
        id: recordId,
        timestamp: new Date().toISOString(),
        input: input,
        deviceType: deviceType,
        result: result
    };
    
    // 获取现有历史记录
    const history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
    
    // 添加新记录到开头
    history.unshift(record);
    
    // 限制历史记录数量为50条
    if (history.length > 50) {
        history.splice(50);
    }
    
    // 保存到localStorage
    localStorage.setItem('uxHistory', JSON.stringify(history));
    
    // 加载历史记录
    loadHistory();
    
    return recordId;
}

/**
 * 加载历史记录
 */
function loadHistory() {
    console.log('加载历史记录');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">暂无历史记录</p>';
        return;
    }
    
    // 清空现有内容
    historyList.innerHTML = '';
    
    // 添加历史记录项
    history.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        // 确保record.input存在，如果不存在则使用默认值
        const inputText = record.input || '未知输入';
        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-input">${inputText.substring(0, 30)}${inputText.length > 30 ? '...' : ''}</span>
                <span class="history-device">${getDeviceTypeName(record.deviceType)}</span>
            </div>
            <div class="history-item-footer">
                <span class="history-time">${formatTime(record.timestamp)}</span>
                <button class="btn-small" onclick="viewHistoryReport('${record.id}')">查看报告</button>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

/**
 * 获取设备类型名称
 * @param {string} deviceType - 设备类型代码
 * @returns {string} 设备类型名称
 */
function getDeviceTypeName(deviceType) {
    switch(deviceType) {
        case 'mobile': return '移动端';
        case 'desktop': return '桌面端';
        default: return '自动检测';
    }
}

/**
 * 格式化时间
 * @param {string} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // 如果是今天，只显示时间
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是今年，显示月日和时间
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // 其他情况显示完整日期
    return date.toLocaleDateString('zh-CN');
}

/**
 * 查看历史记录报告
 * @param {string} recordId - 记录ID
 */
function viewHistoryReport(recordId) {
    console.log('查看历史记录报告:', recordId);
    
    // 获取历史记录
    const history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
    const record = history.find(item => item.id === recordId);
    
    if (record) {
        // 保存报告数据到localStorage
        localStorage.setItem('uxReportData', JSON.stringify(record.result));
        
        // 跳转到报告页面
        window.location.href = 'report.html';
    } else {
        alert('未找到该历史记录');
    }
}

/**
 * 处理拖拽事件
 * @param {Event} e - 拖拽事件
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.add('drag-over');
    }
}

/**
 * 处理文件拖放事件
 * @param {Event} e - 拖放事件
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && screenshotInput) {
        screenshotInput.files = files;
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        screenshotInput.dispatchEvent(event);
    }
}

/**
 * 处理文件选择事件
 * @param {Event} e - 文件选择事件
 */
function handleFileSelect(e) {
    if (screenshotInput && screenshotInput.files.length > 0) {
        const file = screenshotInput.files[0];
        if (uploadArea) {
            uploadArea.querySelector('.file-upload-label').innerHTML = 
                `<span>已选择文件: ${file.name}</span>`;
        }
    }
}

/**
 * 生成报告
 * @param {Object} result - 分析结果
 */
function generateReport(result) {
    console.log('生成报告:', result);
    
    // 保存报告数据到localStorage
    localStorage.setItem('uxReportData', JSON.stringify(result));
    
    // 跳转到报告页面
    window.location.href = 'report.html';
}

// 当页面显示时检查API配置
window.addEventListener('pageshow', function() {
    // 这个函数会在页面显示时调用，包括从缓存中恢复
    // 只在页面加载时检查一次配置，避免在每次表单提交时都更新配置
    console.log('页面显示，检查API配置');
    checkAPIConfig();
});

// 检查API配置并发送到后端
async function checkAPIConfig() {
    // 从localStorage读取配置
    const openaiKey = localStorage.getItem('openai_api_key');
    const deepseekKey = localStorage.getItem('deepseek_api_key');
    const primaryAI = localStorage.getItem('primary_ai') || 'openai';
    
    // 如果有配置，发送到后端
    if (openaiKey || deepseekKey) {
        try {
            console.log('发送API配置到后端');
            await fetch('/api/update-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    openaiKey: openaiKey,
                    deepseekKey: deepseekKey,
                    primaryAI: primaryAI
                })
            });
        } catch (error) {
            console.error('更新API配置失败:', error);
        }
    }
}