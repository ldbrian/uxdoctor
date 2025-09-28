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
    const reportData = JSON.parse(localStorage.getItem('uxReportData') || '{}');
    
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
    
    // 添加页面信息展示
    if (reportData && reportData.unifiedData && reportData.unifiedData.page_meta) {
        const pageMeta = reportData.unifiedData.page_meta;
        if (reportDateElement) {
            const pageInfo = pageMeta.page_url || '未知页面';
            reportDateElement.innerHTML = `${new Date().toLocaleString('zh-CN')}<br><small>分析页面: ${pageInfo}</small>`;
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
        
        // 2. 业务目标一致性评估
        const businessGoalSection = createBusinessGoalSection(result.dimensions.businessGoalAlignment);
        
        // 3. 关键转化路径体验分析
        const conversionPathSection = createConversionPathSection(result.dimensions.conversionPath);
        
        // 4. 体验问题与改进建议（按业务影响排序）
        const experienceIssuesSection = createExperienceIssuesSection(result.dimensions.experienceIssues);
        
        // 5. 总结评价
        const summarySection = createSummarySection(result.summary);
        
        // 将各部分添加到报告内容区域
        reportContent.appendChild(overallScoreSection);
        reportContent.appendChild(businessGoalSection);
        reportContent.appendChild(conversionPathSection);
        reportContent.appendChild(experienceIssuesSection);
        reportContent.appendChild(summarySection);
        
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
     * 创建业务目标一致性评估部分
     */
    function createBusinessGoalSection(businessGoalData) {
        const section = document.createElement('div');
        section.className = 'report-section business-goal-section';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>业务目标一致性评估</h2>
            </div>
            <div class="subsection">
                <p>${businessGoalData.assessment || '暂无评估'}</p>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建关键转化路径体验分析部分
     */
    function createConversionPathSection(conversionPathData) {
        const section = document.createElement('div');
        section.className = 'report-section conversion-path-section';
        
        // 生成问题列表HTML
        let issuesHTML = '<li>无发现的问题</li>';
        if (conversionPathData.issues && conversionPathData.issues.length > 0) {
            issuesHTML = conversionPathData.issues.map(issue => `
                <li>
                    <div class="issue-description">${issue.description}</div>
                    <div class="business-impact">业务影响：${issue.businessImpact}</div>
                </li>
            `).join('');
        }
        
        section.innerHTML = `
            <div class="section-header">
                <h2>关键转化路径体验分析</h2>
            </div>
            <div class="subsection">
                <h3>路径摩擦点分析</h3>
                <ul class="critical-issues-list">
                    ${issuesHTML}
                </ul>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建体验问题与改进建议部分（按业务影响排序）
     */
    function createExperienceIssuesSection(experienceIssuesData) {
        const section = document.createElement('div');
        section.className = 'report-section experience-issues-section';
        
        // 生成高影响问题HTML
        let highImpactHTML = '<li>无高影响问题</li>';
        if (experienceIssuesData.highImpact.issues && experienceIssuesData.highImpact.issues.length > 0) {
            highImpactHTML = experienceIssuesData.highImpact.issues.map(issue => `
                <li>
                    <div class="issue-description">${issue.description}</div>
                    <div class="business-impact">业务影响：${issue.businessImpact}</div>
                    ${issue.suggestion ? `<div class="suggestion">具体建议：${issue.suggestion}</div>` : ''}
                </li>
            `).join('');
        }
        
        // 生成中影响问题HTML
        let mediumImpactHTML = '<li>无中影响问题</li>';
        if (experienceIssuesData.mediumImpact.issues && experienceIssuesData.mediumImpact.issues.length > 0) {
            mediumImpactHTML = experienceIssuesData.mediumImpact.issues.map(issue => `
                <li>
                    <div class="issue-description">${issue.description}</div>
                    <div class="business-impact">业务影响：${issue.businessImpact}</div>
                    ${issue.suggestion ? `<div class="suggestion">具体建议：${issue.suggestion}</div>` : ''}
                </li>
            `).join('');
        }
        
        // 生成低影响问题HTML
        let lowImpactHTML = '<li>无低影响问题</li>';
        if (experienceIssuesData.lowImpact.issues && experienceIssuesData.lowImpact.issues.length > 0) {
            lowImpactHTML = experienceIssuesData.lowImpact.issues.map(issue => `
                <li>
                    <div class="issue-description">${issue.description}</div>
                    <div class="business-impact">业务影响：${issue.businessImpact}</div>
                    ${issue.suggestion ? `<div class="suggestion">具体建议：${issue.suggestion}</div>` : ''}
                </li>
            `).join('');
        }
        
        section.innerHTML = `
            <div class="section-header">
                <h2>体验问题与改进建议（按业务影响排序）</h2>
            </div>
            
            <div class="dimension-section high-impact-section">
                <h3>高影响问题 <span class="impact-badge high">高</span></h3>
                <div class="subsection">
                    <ul class="issue-list high-impact-issues">
                        ${highImpactHTML}
                    </ul>
                </div>
            </div>
            
            <div class="dimension-section medium-impact-section">
                <h3>中影响问题 <span class="impact-badge medium">中</span></h3>
                <div class="subsection">
                    <ul class="issue-list medium-impact-issues">
                        ${mediumImpactHTML}
                    </ul>
                </div>
            </div>
            
            <div class="dimension-section low-impact-section">
                <h3>低影响问题 <span class="impact-badge low">低</span></h3>
                <div class="subsection">
                    <ul class="issue-list low-impact-issues">
                        ${lowImpactHTML}
                    </ul>
                </div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建总结评价部分
     */
    function createSummarySection(summaryText) {
        const section = document.createElement('div');
        section.className = 'report-section summary-section';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>总结评价</h2>
            </div>
            <div class="subsection">
                <p class="summary-text">${summaryText || '暂无总结'}</p>
            </div>
        `;
        
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