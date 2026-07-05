/* ============================================
   Calculations Module - All formulas
   ============================================ */

const Calculations = (() => {
    /**
     * Calculate YouTube metrics
     */
    function calculateYouTubeMetrics(videos) {
        if (!videos || videos.length === 0) {
            return {
                avgViews: 0,
                avgLikes: 0,
                avgComments: 0,
                engagementRate: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0
            };
        }

        const totalViews = videos.reduce((sum, v) => sum + (parseInt(v.views) || 0), 0);
        const totalLikes = videos.reduce((sum, v) => sum + (parseInt(v.likes) || 0), 0);
        const totalComments = videos.reduce((sum, v) => sum + (parseInt(v.comments) || 0), 0);

        const videoCount = videos.length;
        const avgViews = totalViews / videoCount;
        const avgLikes = totalLikes / videoCount;
        const avgComments = totalComments / videoCount;

        // Engagement Rate = (Average Likes + Average Comments) / Average Views × 100
        const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews * 100) : 0;

        return {
            avgViews: Math.round(avgViews),
            avgLikes: Math.round(avgLikes),
            avgComments: Math.round(avgComments),
            engagementRate: parseFloat(engagementRate.toFixed(2)),
            totalViews,
            totalLikes,
            totalComments
        };
    }

    /**
     * Calculate Instagram metrics
     */
    function calculateInstagramMetrics(posts) {
        if (!posts || posts.length === 0) {
            return {
                avgLikes: 0,
                avgComments: 0,
                engagementRate: 0,
                totalLikes: 0,
                totalComments: 0
            };
        }

        const totalLikes = posts.reduce((sum, p) => sum + (parseInt(p.likes) || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (parseInt(p.comments) || 0), 0);

        const postCount = posts.length;
        const avgLikes = totalLikes / postCount;
        const avgComments = totalComments / postCount;

        return {
            avgLikes: Math.round(avgLikes),
            avgComments: Math.round(avgComments),
            totalLikes,
            totalComments
        };
    }

    /**
     * Calculate Views to Subscriber ratio (YouTube only)
     */
    function calculateViewsToSubscriberRatio(avgViews, subscribers) {
        if (!subscribers || subscribers === 0) return 0;
        return parseFloat(((avgViews / subscribers) * 100).toFixed(2));
    }

    /**
     * Calculate Instagram engagement rate with followers
     */
    function calculateInstagramEngagementRate(avgLikes, avgComments, followers) {
        if (!followers || followers === 0) return 0;
        const engagementRate = ((avgLikes + avgComments) / followers) * 100;
        return parseFloat(engagementRate.toFixed(2));
    }

    /**
     * Check YouTube eligibility
     */
    function checkYouTubeEligibility(metrics, subscribers, minFollowers, minEngagement, minRatio) {
        const results = {
            isEligible: true,
            requirements: [
                {
                    name: 'Minimum Subscribers',
                    required: minFollowers,
                    actual: subscribers,
                    passed: subscribers >= minFollowers
                },
                {
                    name: 'Minimum Engagement Rate',
                    required: `${minEngagement}%`,
                    actual: `${metrics.engagementRate}%`,
                    passed: metrics.engagementRate >= minEngagement
                },
                {
                    name: 'Minimum Views/Subscribers Ratio',
                    required: `${minRatio}%`,
                    actual: `${metrics.viewsToSubscriberRatio}%`,
                    passed: metrics.viewsToSubscriberRatio >= minRatio
                }
            ]
        };

        results.isEligible = results.requirements.every(req => req.passed);
        return results;
    }

    /**
     * Check Instagram eligibility
     */
    function checkInstagramEligibility(metrics, followers, minFollowers, minEngagement) {
        const results = {
            isEligible: true,
            requirements: [
                {
                    name: 'Minimum Followers',
                    required: minFollowers,
                    actual: followers,
                    passed: followers >= minFollowers
                },
                {
                    name: 'Minimum Engagement Rate',
                    required: `${minEngagement}%`,
                    actual: `${metrics.engagementRate}%`,
                    passed: metrics.engagementRate >= minEngagement
                }
            ]
        };

        results.isEligible = results.requirements.every(req => req.passed);
        return results;
    }

    return {
        calculateYouTubeMetrics,
        calculateInstagramMetrics,
        calculateViewsToSubscriberRatio,
        calculateInstagramEngagementRate,
        checkYouTubeEligibility,
        checkInstagramEligibility
    };
})();
