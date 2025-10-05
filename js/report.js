console.log('报告页面JavaScript开始加载');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('报告页面DOM加载完成');
    
    // DOM元素
    const reportContent = document.querySelector('.report-content');
    const backButton = document.getElementById('back-to-home');
    const upgradeButton = document.getElementById('upgrade-btn');
    const reportDateElement = document.getElementById('report-date');
    
    console.log('尝试获取DOM元素');
    console.log('报告内容区域:', reportContent);
    console.log('返回按钮:', backButton);
    console.log('升级按钮:', upgradeButton);
    
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
    
    // 升级按钮事件
    if (upgradeButton) {
        upgradeButton.addEventListener('click', function() {
            alert('升级功能将在后续版本中实现');
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
        
        // 2. 报告概览区域
        const overviewSection = createOverviewSection(result);
        
        // 3. 基础分析结果区
        const basicAnalysisSection = createBasicAnalysisSection(result.dimensions);
        
        // 4. AI升级引导区
        const aiUpgradeSection = createAiUpgradeSection();
        
        // 5. 社会证明区
        const socialProofSection = createSocialProofSection();
        
        // 6. 定价方案区
        const pricingSection = createPricingSection();
        
        // 将各部分添加到报告内容区域
        reportContent.appendChild(overviewSection);
        reportContent.appendChild(basicAnalysisSection);
        reportContent.appendChild(aiUpgradeSection);
        reportContent.appendChild(socialProofSection);
        reportContent.appendChild(pricingSection);
        
        // 绑定解锁按钮事件
        const unlockButtons = document.querySelectorAll('.unlock-btn');
        unlockButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 检查用户是否可以升级
                const userManager = window.userManager || (typeof module !== 'undefined' ? require('./user-manager.js').userManager : null);
                const userId = 'default_user'; // 在实际应用中应该从认证系统获取
                
                userManager.canUpgrade(userId).then(canUpgrade => {
                    if (canUpgrade) {
                        alert('支付功能将在后续版本中实现');
                    } else {
                        alert('您已经是最高级别用户');
                    }
                }).catch(error => {
                    console.error('检查升级权限时出错:', error);
                    alert('支付功能将在后续版本中实现');
                });
            });
        });
        
        console.log('报告展示完成');
    }
    
    /**
     * 创建报告概览区域
     */
    function createOverviewSection(result) {
        const section = document.createElement('div');
        section.className = 'report-section overview-section';
        
        // 获取页面URL
        let pageUrl = '未知页面';
        if (result.unifiedData && result.unifiedData.page_meta && result.unifiedData.page_meta.page_url) {
            pageUrl = result.unifiedData.page_meta.page_url;
        }
        
        // 获取业务目标
        let businessGoal = '未设置业务目标';
        if (result.unifiedData && result.unifiedData.business_context && result.unifiedData.business_context.businessGoal) {
            businessGoal = result.unifiedData.business_context.businessGoal;
        }
        
        section.innerHTML = `
            <div class="section-header">
                <h1>UX体验体检报告</h1>
                <p>基于AI深度分析，我们发现了一些影响用户体验和业务转化的关键问题</p>
            </div>
            
            <div class="info-cards">
                <div class="info-card">
                    <div class="info-label">分析页面</div>
                    <div>${pageUrl}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">分析时间</div>
                    <div>${new Date().toLocaleString('zh-CN')}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">业务目标</div>
                    <div>${businessGoal}</div>
                </div>
            </div>
            
            <div class="overall-score-container">
                <div class="score-ring">
                    <div class="score-value" style="color: ${getScoreColor(result.overallScore)}">${result.overallScore || '无'}</div>
                </div>
                <div class="overall-score-label">综合得分</div>
                <div class="overall-score-description">您的页面体验评分${getScoreDescription(result.overallScore)}</div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建基础分析结果区
     */
    function createBasicAnalysisSection(dimensions) {
        const section = document.createElement('div');
        section.className = 'report-section basic-analysis-section';
        
        // 收集所有问题并按严重程度排序
        let allIssues = [];
        
        // 从关键转化路径体验分析中获取问题
        if (dimensions.conversionPath && dimensions.conversionPath.issues) {
            dimensions.conversionPath.issues.forEach(issue => {
                allIssues.push({
                    title: issue.description || '未提供描述',
                    severity: issue.severity || 'medium',
                    businessImpact: issue.businessImpact || '无影响说明',
                    suggestion: issue.suggestion || ''
                });
            });
        }
        
        // 从体验问题与改进建议中获取高影响问题
        if (dimensions.experienceIssues && dimensions.experienceIssues.highImpact && dimensions.experienceIssues.highImpact.issues) {
            dimensions.experienceIssues.highImpact.issues.forEach(issue => {
                allIssues.push({
                    title: issue.description || '未提供描述',
                    severity: 'high',
                    businessImpact: issue.businessImpact || '无影响说明',
                    suggestion: issue.suggestion || ''
                });
            });
        }
        
        // 生成问题卡片HTML
        let issuesHTML = '';
        if (allIssues.length > 0) {
            // 按严重程度排序（高>中>低）
            allIssues.sort((a, b) => {
                const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
            
            // 只显示前3个问题
            const topIssues = allIssues.slice(0, 3);
            
            issuesHTML = topIssues.map((issue, index) => `
                <div class="issue-card">
                    <div class="issue-header">
                        <div class="issue-title">${issue.title}</div>
                        <div class="severity-badge severity-${issue.severity}">${getSeverityLabel(issue.severity)}</div>
                    </div>
                    <div class="business-impact">业务影响：${issue.businessImpact}</div>
                    ${issue.suggestion ? `<div class="suggestion">建议：${issue.suggestion.substring(0, 100)}${issue.suggestion.length > 100 ? '...' : ''}</div>` : ''}
                    
                    <div class="ai-upgrade-module">
                        <div class="ai-upgrade-header">🔓 解锁AI深度分析</div>
                        <p>了解此问题对转化率的具体影响，获取详细的修复方案</p>
                        <button class="btn-primary unlock-btn">查看AI分析</button>
                    </div>
                </div>
            `).join('');
        } else {
            issuesHTML = '<p>未发现明显问题</p>';
        }
        
        section.innerHTML = `
            <div class="section-header">
                <h2>基础分析发现的问题</h2>
            </div>
            ${issuesHTML}
        `;
        
        return section;
    }
    
    /**
     * 创建AI升级引导区
     */
    function createAiUpgradeSection() {
        const section = document.createElement('div');
        section.className = 'report-section ai-upgrade-section card';
        
        section.innerHTML = `
            <div class="card-header">
                <h2>基础分析只是开始，AI深度分析揭示真正影响业务的关键问题</h2>
                <p>基于对数千个类似页面的分析数据，我们的AI引擎能精准预测每个问题对您业务指标的影响</p>
            </div>
            
            <div class="value-points-grid">
                <div class="value-point">
                    <div class="value-point-icon">📊</div>
                    <div class="value-point-title">业务影响量化</div>
                    <div class="value-point-description">精确评估每个UX问题对转化率、留存率等关键指标的影响</div>
                </div>
                
                <div class="value-point">
                    <div class="value-point-icon">📈</div>
                    <div class="value-point-title">智能优先级排序</div>
                    <div class="value-point-description">基于ROI确定修复顺序，优先解决影响最大的问题</div>
                </div>
                
                <div class="value-point">
                    <div class="value-point-icon">📋</div>
                    <div class="value-point-title">具体实施指南</div>
                    <div class="value-point-description">获得详细的改进步骤、代码片段和设计规范</div>
                </div>
            </div>
            
            <div class="upgrade-actions">
                <button class="btn-primary unlock-btn">立即解锁AI深度分析</button>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建社会证明区
     */
    function createSocialProofSection() {
        const section = document.createElement('div');
        section.className = 'report-section social-proof-section';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>用户评价</h2>
            </div>
            <div class="testimonials-container">
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        "基础分析帮我们发现了问题，但AI分析告诉我们应该先修复什么。按照AI的建议优化后，一个月内注册转化率提升了32%！"
                    </div>
                    <div class="testimonial-author">
                        <strong>张经理</strong> - 某电商平台产品负责人
                    </div>
                </div>
                
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        "报告中的问题分析非常精准，优化建议也很实用，帮助我们快速定位并解决了关键体验问题。强烈推荐升级到专业版获取更详细的分析。"
                    </div>
                    <div class="testimonial-author">
                        <strong>李总监</strong> - 某金融科技公司设计总监
                    </div>
                </div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * 创建定价方案区
     */
    function createPricingSection() {
        const section = document.createElement('div');
        section.className = 'report-section pricing-section';
        
        section.innerHTML = `
            <div class="section-header">
                <h2>选择适合您的方案</h2>
                <p>立即升级，获取深度UX洞察和具体优化建议</p>
            </div>
            <div class="pricing-cards">
                <div class="pricing-card">
                    <h3>基础版</h3>
                    <div class="price">免费</div>
                    <ul>
                        <li>基础问题检测</li>
                        <li>综合评分</li>
                        <li>前3个问题简要分析</li>
                        <li class="disabled">详细业务影响分析</li>
                        <li class="disabled">优先级排序</li>
                        <li class="disabled">具体实施指南</li>
                    </ul>
                    <button class="btn-secondary" disabled>当前方案</button>
                </div>
                
                <div class="pricing-card featured">
                    <h3>专业版</h3>
                    <div class="price">¥199<span>/月</span></div>
                    <ul>
                        <li>完整问题检测</li>
                        <li>综合评分</li>
                        <li>所有问题详细分析</li>
                        <li>详细业务影响分析</li>
                        <li>智能优先级排序</li>
                        <li>具体实施指南</li>
                    </ul>
                    <button class="btn-primary unlock-btn">立即升级</button>
                </div>
                
                <div class="pricing-card">
                    <h3>企业版</h3>
                    <div class="price">¥699<span>/月</span></div>
                    <ul>
                        <li>专业版所有功能</li>
                        <li>团队协作功能</li>
                        <li>API访问权限</li>
                        <li>专属客户支持</li>
                        <li>定制化分析报告</li>
                        <li>定期优化建议</li>
                    </ul>
                    <button class="btn-secondary">联系销售</button>
                </div>
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
     * 获取评分描述
     */
    function getScoreDescription(score) {
        if (score >= 80) {
            return '优秀，用户体验良好';
        } else if (score >= 60) {
            return '一般，有改进空间';
        } else {
            return '较差，需要重点优化';
        }
    }
    
    /**
     * 获取严重程度标签
     */
    function getSeverityLabel(severity) {
        switch (severity) {
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return '中';
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
            'security': '安全性',
            'businessGoalAlignment': '业务目标一致性',
            'conversionPath': '转化路径',
            'experienceIssues': '体验问题'
        };
        
        return labels[dimName] || dimName;
    }
});