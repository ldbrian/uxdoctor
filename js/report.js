console.log('报告页面JavaScript开始加载');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('报告页面DOM加载完成');
    
    // DOM元素
    const reportContent = document.querySelector('.report-content');
    const backButton = document.getElementById('back-to-home');
    const reportDateElement = document.getElementById('report-date');
    
    console.log('尝试获取DOM元素');
    console.log('报告内容区域:', reportContent);
    console.log('返回按钮:', backButton);
    
    // 设置报告生成时间
    if (reportDateElement) {
        reportDateElement.textContent = new Date().toLocaleString('zh-CN');
    }
    
    // 返回首页按钮事件
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
    
    // 从localStorage获取报告数据
    const reportData = JSON.parse(localStorage.getItem('currentReport') || '{}');
    
    if (reportData && Object.keys(reportData).length > 0) {
        displayReport(reportData);
    } else {
        // 如果没有报告数据，显示错误信息
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="error-section">
                    <h2>报告数据不存在</h2>
                    <p>未找到有效的报告数据，请返回首页重新进行分析。</p>
                    <button class="btn-primary" onclick="window.location.href='/'" style="margin-top: 20px;">返回首页</button>
                </div>
            `;
        }
    }
    
    /**
     * 显示报告
     */
    function displayReport(result) {
        console.log('开始显示报告');
        
        if (!reportContent) return;
        
        // 清空内容区域
        reportContent.innerHTML = '';
        
        // 1. 综合评分部分
        const overallScoreSection = createOverallScoreSection(result.overallScore);
        
        // 2. 行业平均得分比较部分
        const industryComparisonSection = createIndustryComparisonSection(result.overallScore);
        
        // 3. 各项详细分数部分
        const detailedScoresSection = createDetailedScoresSection(result.dimensions);
        
        // 4. 问题列表部分（显示问题的严重程度）
        const issuesSection = createIssuesSection(result.dimensions, result.criticalIssues);
        
        // 5. 优化建议部分（局部展示，且模糊遮罩，付费解锁）
        const recommendationsSection = createRecommendationsSection(result.dimensions);
        
        // 将各部分添加到报告内容区域
        reportContent.appendChild(overallScoreSection);
        reportContent.appendChild(industryComparisonSection);
        reportContent.appendChild(detailedScoresSection);
        reportContent.appendChild(issuesSection);
        reportContent.appendChild(recommendationsSection);
        
        // 绑定解锁按钮事件
        const unlockButtons = document.querySelectorAll('.unlock-btn');
        unlockButtons.forEach(button => {
            button.addEventListener('click', function() {
                alert('支付功能将在后续版本中实现');
            });
        });
        
        console.log('报告展示完成');
    }
    
    /**
     * 创建综合评分部分
     */
    function createOverallScoreSection(overallScore) {
        const section = document.createElement('div');
        section.className = 'report-section overall-score-section';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>综合评分</h2>
            </div>
            <div class="overall-score-container">
                <div class="overall-score-value" style="color: ${getScoreColor(overallScore)}">${overallScore || '无'}</div>
                <div class="overall-score-label">综合得分</div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建行业平均得分比较部分
     */
    function createIndustryComparisonSection(overallScore) {
        const section = document.createElement('div');
        section.className = 'report-section industry-comparison-section';
        
        // 行业平均分（模拟数据）
        const industryAverage = 72;
        const difference = overallScore - industryAverage;
        const differenceText = difference >= 0 ? `高于行业平均 ${difference} 分` : `低于行业平均 ${Math.abs(difference)} 分`;
        const differenceColor = difference >= 0 ? '#4CAF50' : '#F44336';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>行业对比</h2>
            </div>
            <div class="industry-comparison-container">
                <div class="comparison-item">
                    <div class="comparison-label">您的得分</div>
                    <div class="comparison-value" style="color: ${getScoreColor(overallScore)}">${overallScore || '无'}</div>
                </div>
                <div class="comparison-item">
                    <div class="comparison-label">行业平均</div>
                    <div class="comparison-value" style="color: ${getScoreColor(industryAverage)}">${industryAverage}</div>
                </div>
                <div class="comparison-item">
                    <div class="comparison-label">差距</div>
                    <div class="comparison-value" style="color: ${differenceColor}">${differenceText}</div>
                </div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建各项详细分数部分
     */
    function createDetailedScoresSection(dimensions) {
        const section = document.createElement('div');
        section.className = 'report-section detailed-scores-section';
        
        let scoresHTML = '<div class="section-header"><h2>各项详细评分</h2></div>';
        scoresHTML += '<div class="detailed-scores-container">';
        
        if (dimensions) {
            Object.keys(dimensions).forEach(dimName => {
                const dimData = dimensions[dimName];
                const score = dimData.score || 0;
                const dimLabel = getDimensionLabel(dimName);
                
                scoresHTML += `
                    <div class="score-item">
                        <div class="score-label">${dimLabel}</div>
                        <div class="score-value" style="color: ${getScoreColor(score)}">${score}</div>
                    </div>
                `;
            });
        }
        
        scoresHTML += '</div>';
        section.innerHTML = scoresHTML;
        
        return section;
    }
    
    /**
     * 创建问题列表部分
     */
    function createIssuesSection(dimensions, criticalIssues) {
        const section = document.createElement('div');
        section.className = 'report-section issues-section';
        
        let issuesHTML = '<div class="section-header"><h2>发现问题</h2></div>';
        
        // 严重问题
        if (criticalIssues && criticalIssues.length > 0) {
            issuesHTML += `
                <div class="issues-category critical">
                    <h3>严重问题</h3>
                    <ul class="issues-list">
                        ${criticalIssues.map(issue => `<li class="issue-item critical">${issue}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 各维度问题
        if (dimensions) {
            Object.keys(dimensions).forEach(dimName => {
                const dimData = dimensions[dimName];
                const dimLabel = getDimensionLabel(dimName);
                
                if (dimData.issues && dimData.issues.length > 0) {
                    issuesHTML += `
                        <div class="issues-category">
                            <h3>${dimLabel}</h3>
                            <ul class="issues-list">
                                ${dimData.issues.map(issue => `<li class="issue-item">${issue}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
        }
        
        section.innerHTML = issuesHTML;
        return section;
    }
    
    /**
     * 创建优化建议部分（带遮罩）
     */
    function createRecommendationsSection(dimensions) {
        const section = document.createElement('div');
        section.className = 'report-section recommendations-section';
        
        let recommendationsHTML = '<div class="section-header"><h2>优化建议</h2></div>';
        recommendationsHTML += '<div class="recommendations-container recommendations-mask">';
        
        // 各维度建议
        if (dimensions) {
            Object.keys(dimensions).forEach(dimName => {
                const dimData = dimensions[dimName];
                const dimLabel = getDimensionLabel(dimName);
                
                if (dimData.recommendations && dimData.recommendations.length > 0) {
                    recommendationsHTML += `
                        <div class="recommendations-category">
                            <h3>${dimLabel}</h3>
                            <ul class="recommendations-list">
                                ${dimData.recommendations.map(rec => `<li class="recommendation-item">${rec}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
        }
        
        recommendationsHTML += `
                <div class="mask-overlay">
                    <button class="unlock-btn btn-primary">9.9元解锁完整报告</button>
                </div>
            </div>
        `;
        
        section.innerHTML = recommendationsHTML;
        return section;
    }
    
    /**
     * 根据评分获取颜色
     */
    function getScoreColor(score) {
        if (score >= 80) {
            return '#4CAF50'; // 绿色
        } else if (score >= 60) {
            return '#FF9800'; // 橙色
        } else {
            return '#F44336'; // 红色
        }
    }
    
    /**
     * 获取维度中文标签
     */
    function getDimensionLabel(dimName) {
        const labels = {
            'navigation': '导航体验',
            'visual': '视觉设计',
            'form': '表单设计',
            'information': '信息架构',
            'performance': '性能体验',
            'accessibility': '可访问性',
            'security': '安全性'
        };
        
        return labels[dimName] || dimName;
    }
});