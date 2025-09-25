

function displayReport(result) {
    console.log('开始显示报告');
    
    // 加载报告模板
    console.log('加载报告模板');
    fetch('/components/report-template.html')
        .then(response => {
            console.log('报告模板加载响应状态:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(template => {
            console.log('报告模板加载成功');
            // 创建临时DOM元素以操作模板
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template;
            
            // 填充生成时间
            const reportDateElement = tempDiv.querySelector('#report-date');
            if (reportDateElement) {
                reportDateElement.textContent = new Date().toLocaleString('zh-CN');
            }
            
            // 填充总体评分
            const overallScoreElement = tempDiv.querySelector('#overall-score');
            if (overallScoreElement && result.overallScore) {
                overallScoreElement.textContent = result.overallScore;
                // 根据评分设置颜色
                if (result.overallScore >= 80) {
                    overallScoreElement.style.color = '#4CAF50';
                } else if (result.overallScore >= 60) {
                    overallScoreElement.style.color = '#FF9800';
                } else {
                    overallScoreElement.style.color = '#F44336';
                }
            }
            
            // 填充各维度评分
            if (result.dimensions) {
                Object.keys(result.dimensions).forEach(dimName => {
                    const dimData = result.dimensions[dimName];
                    // 修复ID查找错误
                    const dimElement = tempDiv.querySelector(`#${dimName}-score-value`);
                    if (dimElement && dimData.score) {
                        dimElement.textContent = dimData.score;
                    }
                    
                    // 填充问题列表
                    // 修复ID查找错误
                    const issuesList = tempDiv.querySelector(`#${dimName}-issues`);
                    if (issuesList && dimData.issues && dimData.issues.length > 0) {
                        issuesList.innerHTML = dimData.issues.map(issue => 
                            `<li>${issue}</li>`
                        ).join('');
                    } else if (issuesList) {
                        issuesList.innerHTML = '<li>无问题</li>';
                    }
                    
                    // 填充建议列表
                    // 修复ID查找错误
                    const recommendationsList = tempDiv.querySelector(`#${dimName}-recommendations`);
                    if (recommendationsList && dimData.recommendations && dimData.recommendations.length > 0) {
                        recommendationsList.innerHTML = dimData.recommendations.map(rec => 
                            `<li>${rec}</li>`
                        ).join('');
                    } else if (recommendationsList) {
                        recommendationsList.innerHTML = '<li>无建议</li>';
                    }
                });
            }
            
            // 填充严重问题
            const criticalIssuesList = tempDiv.querySelector('#critical-issues');
            if (criticalIssuesList && result.criticalIssues && result.criticalIssues.length > 0) {
                criticalIssuesList.innerHTML = result.criticalIssues.map(issue => 
                    `<li>${issue}</li>`
                ).join('');
            } else if (criticalIssuesList) {
                criticalIssuesList.innerHTML = '<li>无严重问题</li>';
            }
            
            // 填充总结评价
            const summaryElement = tempDiv.querySelector('#summary-text');
            if (summaryElement && result.summary) {
                summaryElement.textContent = result.summary;
            }
            
            // 分割问题和建议部分
            const recommendationsSection = tempDiv.querySelector('.recommendation-list');
            if (recommendationsSection) {
                recommendationsSection.classList.add('recommendations-mask');
                const unlockBtn = document.createElement('button');
                unlockBtn.className = 'unlock-btn';
                unlockBtn.textContent = '9.9元解锁完整报告';
                unlockBtn.addEventListener('click', () => {
                    window.location.href = '/payment'; // 跳转至支付页面
                });
                recommendationsSection.appendChild(unlockBtn);
            }
            
            // 将填充后的模板插入到报告内容区域
            if (reportContent) {
                reportContent.innerHTML = tempDiv.innerHTML;
                console.log('报告展示完成');
            }
        })
        .catch(error => {
            console.error('加载报告模板失败:', error);
            if (reportContent) {
                reportContent.innerHTML = `
                    <div class="error-section" style="text-align: center; padding: 40px;">
                        <h2>加载报告失败</h2>
                        <p>加载报告模板时发生错误: ${error.message}</p>
                        <button class="btn-primary" onclick="window.location.href='/'" style="margin-top: 20px;">返回首页</button>
                    </div>
                `;
            }
        });
}
