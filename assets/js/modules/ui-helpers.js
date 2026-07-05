/* ============================================
   UI Helpers Module - Common UI Functions
   ============================================ */

const UIHelpers = (() => {
    /**
     * Show modal
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide modal
     */
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Format date
     */
    function formatDate(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format number with commas
     */
    function formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    }

    /**
     * Format percentage
     */
    function formatPercentage(num, decimals = 2) {
        return num.toFixed(decimals) + '%';
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease-in-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Confirm action
     */
    function confirmAction(title, message, onConfirm, onCancel) {
        const confirmModal = document.getElementById('confirmModal');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmActionBtn = document.getElementById('confirmAction');
        const confirmCancelBtn = document.getElementById('confirmCancel');

        confirmTitle.textContent = title;
        confirmMessage.textContent = message;

        const handleConfirm = () => {
            onConfirm();
            UIHelpers.hideModal('confirmModal');
            cleanup();
        };

        const handleCancel = () => {
            if (onCancel) onCancel();
            UIHelpers.hideModal('confirmModal');
            cleanup();
        };

        const cleanup = () => {
            confirmActionBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };

        confirmActionBtn.addEventListener('click', handleConfirm);
        confirmCancelBtn.addEventListener('click', handleCancel);

        UIHelpers.showModal('confirmModal');
    }

    /**
     * Create influencer card
     */
    function createInfluencerCard(influencer) {
        const metrics = getMetricsForInfluencer(influencer);
        const platformIcon = influencer.platform === 'youtube' ? '📺' : '📷';
        const platformClass = influencer.platform;
        const statusClass = influencer.isEligible ? 'eligible' : 'not-eligible';
        const statusText = influencer.isEligible ? '✅ Eligible' : '❌ Not Eligible';

        const card = document.createElement('div');
        card.className = 'influencer-card';
        card.innerHTML = `
            <div class="influencer-card-header">
                <div class="influencer-platform ${platformClass}">${platformIcon} ${influencer.platform.toUpperCase()}</div>
                <div class="influencer-handle">@${influencer.handle}</div>
            </div>
            <div class="influencer-card-body">
                <div class="card-stat">
                    <span class="card-stat-label">Followers</span>
                    <span class="card-stat-value">${formatNumber(influencer.followers)}</span>
                </div>
                <div class="card-stat">
                    <span class="card-stat-label">Avg Views</span>
                    <span class="card-stat-value">${formatNumber(metrics.avgViews || 0)}</span>
                </div>
                <div class="card-stat">
                    <span class="card-stat-label">Engagement</span>
                    <span class="card-stat-value">${formatPercentage(metrics.engagementRate || 0)}</span>
                </div>
                ${influencer.platform === 'youtube' ? `
                    <div class="card-stat">
                        <span class="card-stat-label">Views/Subs</span>
                        <span class="card-stat-value">${formatPercentage(metrics.viewsToSubscriberRatio || 0)}</span>
                    </div>
                ` : ''}
                <div class="card-stat">
                    <span class="card-stat-label">Added</span>
                    <span class="card-stat-value">${formatDate(influencer.dateSaved)}</span>
                </div>
                <div style="margin-top: 12px;">
                    <div class="influencer-status ${statusClass}">${statusText}</div>
                </div>
            </div>
            <div class="influencer-card-footer">
                <button class="btn btn-secondary card-btn" data-action="open" data-id="${influencer.id}">📄 Report</button>
                <button class="btn btn-secondary card-btn" data-action="edit" data-id="${influencer.id}">✏️ Edit</button>
                <button class="btn btn-secondary card-btn" data-action="duplicate" data-id="${influencer.id}">📋 Duplicate</button>
                <button class="btn btn-danger card-btn" data-action="delete" data-id="${influencer.id}">🗑️ Delete</button>
            </div>
        `;

        return card;
    }

    /**
     * Get metrics for influencer (helper)
     */
    function getMetricsForInfluencer(influencer) {
        const metrics = {};

        if (influencer.platform === 'youtube' && influencer.videos) {
            const calculated = Calculations.calculateYouTubeMetrics(influencer.videos);
            metrics.avgViews = calculated.avgViews;
            metrics.avgLikes = calculated.avgLikes;
            metrics.avgComments = calculated.avgComments;
            metrics.engagementRate = calculated.engagementRate;
            metrics.viewsToSubscriberRatio = Calculations.calculateViewsToSubscriberRatio(
                calculated.avgViews,
                influencer.followers
            );
        } else if (influencer.platform === 'instagram' && influencer.posts) {
            const calculated = Calculations.calculateInstagramMetrics(influencer.posts);
            metrics.avgLikes = calculated.avgLikes;
            metrics.avgComments = calculated.avgComments;
            metrics.engagementRate = Calculations.calculateInstagramEngagementRate(
                calculated.avgLikes,
                calculated.avgComments,
                influencer.followers
            );
        }

        return metrics;
    }

    /**
     * Create full report
     */
    function createFullReport(influencer) {
        const metrics = getMetricsForInfluencer(influencer);
        const platformIcon = influencer.platform === 'youtube' ? '📺' : '📷';

        let reportHTML = `
            <div class="report-section">
                <div class="report-title">${platformIcon} Influencer Details</div>
                <div class="report-item">
                    <span class="report-label">Platform</span>
                    <span class="report-value">${influencer.platform.toUpperCase()}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Handle</span>
                    <span class="report-value">@${influencer.handle}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Profile URL</span>
                    <span class="report-value"><a href="${influencer.profileUrl}" target="_blank">${influencer.profileUrl}</a></span>
                </div>
                <div class="report-item">
                    <span class="report-label">${influencer.platform === 'youtube' ? 'Subscribers' : 'Followers'}</span>
                    <span class="report-value">${formatNumber(influencer.followers)}</span>
                </div>
            </div>

            <div class="report-section">
                <div class="report-title">📊 Performance Metrics</div>
                <div class="report-item">
                    <span class="report-label">${influencer.platform === 'youtube' ? 'Videos' : 'Posts'} Checked</span>
                    <span class="report-value">${influencer.platform === 'youtube' ? (influencer.videos || []).length : (influencer.posts || []).length}</span>
                </div>
        `;

        if (influencer.platform === 'youtube' && influencer.videos) {
            const calculated = Calculations.calculateYouTubeMetrics(influencer.videos);
            reportHTML += `
                <div class="report-item">
                    <span class="report-label">Total Views</span>
                    <span class="report-value">${formatNumber(calculated.totalViews)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Total Likes</span>
                    <span class="report-value">${formatNumber(calculated.totalLikes)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Total Comments</span>
                    <span class="report-value">${formatNumber(calculated.totalComments)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Average Views</span>
                    <span class="report-value">${formatNumber(calculated.avgViews)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Average Likes</span>
                    <span class="report-value">${formatNumber(calculated.avgLikes)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Average Comments</span>
                    <span class="report-value">${formatNumber(calculated.avgComments)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Engagement Rate</span>
                    <span class="report-value">${formatPercentage(calculated.engagementRate)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Views/Subscribers Ratio</span>
                    <span class="report-value">${formatPercentage(metrics.viewsToSubscriberRatio)}</span>
                </div>
            `;
        } else if (influencer.platform === 'instagram' && influencer.posts) {
            const calculated = Calculations.calculateInstagramMetrics(influencer.posts);
            reportHTML += `
                <div class="report-item">
                    <span class="report-label">Total Likes</span>
                    <span class="report-value">${formatNumber(calculated.totalLikes)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Total Comments</span>
                    <span class="report-value">${formatNumber(calculated.totalComments)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Average Likes</span>
                    <span class="report-value">${formatNumber(calculated.avgLikes)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Average Comments</span>
                    <span class="report-value">${formatNumber(calculated.avgComments)}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">Engagement Rate</span>
                    <span class="report-value">${formatPercentage(metrics.engagementRate)}</span>
                </div>
            `;
        }

        reportHTML += `
            </div>

            <div class="report-section">
                <div class="report-title">✅ Eligibility Status</div>
                <div class="report-item">
                    <span class="report-label">Status</span>
                    <span class="report-value">${influencer.isEligible ? '✅ Eligible' : '❌ Not Eligible'}</span>
                </div>
            </div>

            <div class="report-section">
                <div class="report-title">📝 Notes</div>
                <div style="padding: 12px; background-color: var(--color-bg-secondary); border-radius: 8px;">
                    ${influencer.notes || '<em>No notes</em>'}
                </div>
            </div>

            <div class="report-section">
                <div class="report-title">📅 Metadata</div>
                <div class="report-item">
                    <span class="report-label">Date Saved</span>
                    <span class="report-value">${formatDate(influencer.dateSaved)}</span>
                </div>
            </div>
        `;

        return reportHTML;
    }

    return {
        showModal,
        hideModal,
        formatDate,
        formatNumber,
        formatPercentage,
        showNotification,
        confirmAction,
        createInfluencerCard,
        createFullReport
    };
})();

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
