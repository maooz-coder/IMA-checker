/* ============================================
   Export/Import Module - Data Management
   ============================================ */

const ExportImport = (() => {
    /**
     * Export influencers as CSV
     */
    function exportAsCSV(influencers) {
        if (influencers.length === 0) {
            alert('No influencers to export');
            return;
        }

        const headers = [
            'Platform',
            'Handle',
            'Followers/Subscribers',
            'Average Views',
            'Average Likes',
            'Average Comments',
            'Engagement Rate',
            'Views/Subscribers Ratio',
            'Eligible',
            'Date Added',
            'Notes'
        ];

        let csv = headers.join(',') + '\n';

        influencers.forEach(inf => {
            const metrics = getMetricsForInfluencer(inf);
            const row = [
                inf.platform,
                `"${inf.handle}"`,
                inf.followers,
                metrics.avgViews || 0,
                metrics.avgLikes || 0,
                metrics.avgComments || 0,
                metrics.engagementRate || 0,
                metrics.viewsToSubscriberRatio || metrics.engagementRate || 0,
                inf.isEligible ? 'Yes' : 'No',
                new Date(inf.dateSaved).toLocaleDateString(),
                `"${(inf.notes || '').replace(/"/g, '""')}"`
            ];
            csv += row.join(',') + '\n';
        });

        downloadFile(csv, 'ima-influencers.csv', 'text/csv');
    }

    /**
     * Export influencers as Excel (using CSV format compatible with Excel)
     */
    function exportAsExcel(influencers) {
        if (influencers.length === 0) {
            alert('No influencers to export');
            return;
        }

        // Excel-compatible CSV with BOM for UTF-8
        const BOM = '\uFEFF';
        const headers = [
            'Platform',
            'Handle',
            'Followers/Subscribers',
            'Average Views',
            'Average Likes',
            'Average Comments',
            'Engagement Rate',
            'Views/Subscribers Ratio',
            'Eligible',
            'Date Added',
            'Notes'
        ];

        let csv = BOM + headers.join('\t') + '\n';

        influencers.forEach(inf => {
            const metrics = getMetricsForInfluencer(inf);
            const row = [
                inf.platform,
                inf.handle,
                inf.followers,
                metrics.avgViews || 0,
                metrics.avgLikes || 0,
                metrics.avgComments || 0,
                metrics.engagementRate || 0,
                metrics.viewsToSubscriberRatio || metrics.engagementRate || 0,
                inf.isEligible ? 'Yes' : 'No',
                new Date(inf.dateSaved).toLocaleDateString(),
                inf.notes || ''
            ];
            csv += row.join('\t') + '\n';
        });

        downloadFile(csv, 'ima-influencers.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /**
     * Export influencers as JSON
     */
    function exportAsJSON(influencers) {
        if (influencers.length === 0) {
            alert('No influencers to export');
            return;
        }

        const data = {
            exportDate: new Date().toISOString(),
            version: '4.0',
            count: influencers.length,
            influencers: influencers
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'ima-influencers.json', 'application/json');
    }

    /**
     * Import influencers from JSON file
     */
    function importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.influencers && Array.isArray(data.influencers)) {
                        resolve(data.influencers);
                    } else if (Array.isArray(data)) {
                        resolve(data);
                    } else {
                        reject(new Error('Invalid JSON format. Expected array or object with influencers array.'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse JSON file: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Download file helper
     */
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Get metrics for display
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

    return {
        exportAsCSV,
        exportAsExcel,
        exportAsJSON,
        importFromJSON
    };
})();
