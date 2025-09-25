console.log('JavaScript文件开始加载');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成');
    
    // DOM元素
    const uxForm = document.getElementById('ux-analysis-form');
    const loadingSection = document.querySelector('.loading-section');
    const uploadSection = document.querySelector('.upload-section'); // 正确的上传区域选择器
    const urlInput = document.getElementById('url-input');
    const screenshotInput = document.getElementById('screenshot-input');
    const uploadArea = document.getElementById('upload-area');
    const historyList = document.getElementById('history-list');
    const prototypeInput = document.getElementById('prototype-input'); // 添加原型输入框
    const submitButton = document.querySelector('#ux-analysis-form button[type="submit"]');

    console.log('尝试获取DOM元素');
    console.log('表单元素:', uxForm);
    console.log('加载区域:', loadingSection);
    console.log('上传区域:', uploadSection);
    console.log('URL输入框:', urlInput);
    console.log('截图输入框:', screenshotInput);
    console.log('提交按钮:', submitButton);

    // 检查表单是否存在
    if (!uxForm) {
        console.error('找不到表单元素 #ux-analysis-form');
        return;
    }

    // 初始化历史记录
    loadHistory();

    // 文件上传区域点击事件
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            if (screenshotInput) {
                screenshotInput.click();
            }
        });
    }

    // 拖拽上传功能
    if (uploadArea) {
        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 添加视觉反馈
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        }

        function unhighlight() {
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.backgroundColor = '';
        }

        // 处理文件拖拽
        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files.length) {
                // 检查文件类型
                const file = files[0];
                if (file.type.match('image.*')) {
                    if (screenshotInput) {
                        // 创建一个新的FileList包含拖拽的文件
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        screenshotInput.files = dataTransfer.files;
                        
                        // 视觉反馈
                        const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
                        uploadArea.querySelector('span').textContent = `已选择文件: ${fileName}`;
                    }
                } else {
                    alert('请上传图片文件');
                }
            }
        }
    }

    // 表单提交事件
    if (uxForm) {
        console.log('绑定表单提交事件');
        uxForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 直接为按钮绑定点击事件
    if (submitButton) {
        console.log('绑定按钮点击事件');
        submitButton.addEventListener('click', function(e) {
            console.log('按钮点击事件触发');
            e.preventDefault();
            e.stopPropagation();
            handleFormSubmit(e);
            return false;
        });
    }
    
    console.log('事件绑定完成');

    // 处理表单提交的函数
    async function handleFormSubmit(e) {
        e.preventDefault(); // 阻止表单默认提交行为
        e.stopPropagation(); // 阻止事件冒泡
        console.log('表单提交处理函数触发');
        
        // 获取用户输入
        const url = urlInput ? urlInput.value.trim() : '';
        const screenshot = screenshotInput ? screenshotInput.files[0] : null;
        const prototype = prototypeInput ? prototypeInput.value.trim() : ''; // 获取原型链接
        
        console.log('输入数据:', { url, screenshot: !!screenshot, prototype });
        
        // 检查是否已经分析过相同的URL或图片
        if (url && isAlreadyAnalyzed(url, 'url')) {
            if (confirm('您之前已经分析过这个URL，是否要查看之前的分析结果？')) {
                // 跳转到之前的报告
                const history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
                const existingRecord = history.find(item => item.url === url);
                if (existingRecord) {
                    // 从历史记录中获取报告数据
                    const reportData = localStorage.getItem(`report_${existingRecord.id}`);
                    if (reportData) {
                        localStorage.setItem('currentReport', reportData);
                        window.location.href = '/report.html';
                        return;
                    }
                }
            }
        }
        
        // 隐藏上传区域，显示加载区域
        if (uploadSection) {
            console.log('隐藏上传区域');
            uploadSection.style.display = 'none';
        }
        
        // 显示加载区域
        if (loadingSection) {
            console.log('显示加载区域');
            loadingSection.classList.remove('hidden');
            loadingSection.style.display = 'flex';
        }
        
        try {
            let result;
            // 优先级：URL > 截图 > 原型链接
            if (url) {
                console.log('开始分析URL:', url);
                // 分析URL
                result = await analyzeURL(url);
            } else if (screenshot) {
                console.log('开始分析截图');
                // 分析截图
                result = await analyzeScreenshot(screenshot);
            } else if (prototype) {
                console.log('开始分析原型链接:', prototype);
                // 分析原型链接（暂时也使用URL分析）
                result = await analyzeURL(prototype);
            } else {
                throw new Error('请提供URL、上传截图或输入原型链接');
            }
            
            console.log('分析结果:', result);
            
            if (result.success) {
                // 保存到历史记录
                const recordId = saveToHistory(result.data, url);
                // 保存报告数据到localStorage
                localStorage.setItem(`report_${recordId}`, JSON.stringify(result.data));
                // 保存当前报告数据
                localStorage.setItem('currentReport', JSON.stringify(result.data));
                // 跳转到报告页面
                window.location.href = '/report.html';
                return true; // 确保函数正常返回，不再执行后续代码
            } else {
                throw new Error(result.error || '分析失败');
            }
        } catch (error) {
            console.error('分析过程中出错:', error);
            alert('分析过程中出错: ' + error.message);
            // 恢复显示上传区域
            if (uploadSection) uploadSection.style.display = 'block';
            // 隐藏加载区域
            if (loadingSection) {
                loadingSection.classList.add('hidden');
                loadingSection.style.display = 'none';
            }
        }
        
        return false; // 确保表单不会提交
    }

    /**
     * 检查是否已经分析过相同的内容
     */
    function isAlreadyAnalyzed(content, type) {
        const history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
        if (type === 'url') {
            return history.some(item => item.url === content);
        }
        // 对于图片，我们暂时不检查重复（因为每次上传都是新文件）
        return false;
    }

    /**
     * 分析URL
     */
    async function analyzeURL(url) {
        console.log('调用URL分析API');
        try {
            const response = await fetch('/api/analyze-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });
            
            console.log('URL分析API响应状态:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '分析失败');
            }
            
            const data = await response.json();
            console.log('URL分析完成');
            return data;
        } catch (error) {
            console.error('URL分析错误:', error);
            // 特别处理余额不足的情况
            if (error.message.includes('余额不足')) {
                alert('API余额不足，请联系管理员充值后重试');
            }
            throw error;
        }
    }

    /**
     * 分析截图
     */
    async function analyzeScreenshot(screenshot) {
        console.log('调用截图分析API');
        try {
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            
            const response = await fetch('/api/analyze-screenshot', {
                method: 'POST',
                body: formData
            });
            
            console.log('截图分析API响应状态:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '分析失败');
            }
            
            const data = await response.json();
            console.log('截图分析完成');
            return data;
        } catch (error) {
            console.error('截图分析错误:', error);
            // 特别处理余额不足的情况
            if (error.message.includes('余额不足')) {
                alert('API余额不足，请联系管理员充值后重试');
            }
            throw error;
        }
    }

    /**
     * 显示分析结果 - 已禁用，现在直接跳转到报告页面
     */
    function displayResult(result) {
        console.log('显示分析结果功能已禁用，现在直接跳转到报告页面');
        // 此函数现在不再使用，分析完成后直接跳转到/report.html
    }

    /**
     * 保存到历史记录
     */
    function saveToHistory(result, url) {
        console.log('保存到历史记录');
        // 获取现有历史记录
        let history = JSON.parse(localStorage.getItem('uxHistory') || '[]');
        
        // 检查是否已经存在相同的URL记录
        const existingIndex = history.findIndex(item => item.url === url);
        const recordId = Date.now();
        
        const newRecord = {
            id: recordId,
            timestamp: new Date().toISOString(),
            overallScore: result.overallScore,
            summary: result.summary,
            url: url
        };
        
        if (existingIndex >= 0) {
            // 更新现有记录
            history[existingIndex] = newRecord;
        } else {
            // 添加新记录
            history.unshift(newRecord);
        }
        
        // 只保留最近10条记录
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // 保存到localStorage
        localStorage.setItem('uxHistory', JSON.stringify(history));
        
        // 更新历史记录显示
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
        
        historyList.innerHTML = history.map(item => {
            // 确保summary存在且为字符串
            const summary = item.summary && typeof item.summary === 'string' 
                ? item.summary 
                : '无摘要信息';
                
            return `
            <div class="history-item">
                <div class="history-item-info">
                    <h3>${item.overallScore || '无'}分</h3>
                    <p>${summary.substring(0, 50)}${summary.length > 50 ? '...' : ''}</p>
                </div>
                <div class="history-item-meta">
                    <span>${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div class="history-item-actions">
                    <button class="btn-small btn-primary view-report" data-id="${item.id}">查看报告</button>
                </div>
            </div>
        `}).join('');
        
        // 为查看报告按钮添加事件监听器
        document.querySelectorAll('.view-report').forEach(button => {
            button.addEventListener('click', function() {
                const recordId = this.getAttribute('data-id');
                const reportData = localStorage.getItem(`report_${recordId}`);
                if (reportData) {
                    localStorage.setItem('currentReport', reportData);
                    window.location.href = '/report.html';
                } else {
                    alert('未找到报告数据');
                }
            });
        });
    }
});

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