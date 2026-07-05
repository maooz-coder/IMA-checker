/* ============================================
   IMA CRM v4 - Main Application
   ============================================ */

const App = (() => {
    let currentTab = 'dashboard';
    let currentEditingId = null;

    /**
     * Initialize the application
     */
    function init() {
        setupTheme();
        setupEventListeners();
        switchTab('dashboard');
        updateDashboard();
    }

    /**
     * Setup theme
     */
    function setupTheme() {
        const savedTheme = Storage.getTheme();
        setTheme(savedTheme);
    }

    /**
     * Set theme
     */
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeLabel = document.querySelector('.theme-label');
        if (themeLabel) {
            themeLabel.textContent = theme === 'light' ? 'Light Mode' : 'Dark Mode';
        }
        Storage.setTheme(theme);
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                switchTab(tab);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeSettingBtn = document.getElementById('themeSettingBtn');
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
        if (themeSettingBtn) themeSettingBtn.addEventListener('click', toggleTheme);

        // Checker tab events
        setupCheckerEvents();

        // Influencers tab events
        setupInfluencersEvents();

        // Settings tab events
        setupSettingsEvents();

        // Modal events
        setupModalEvents();
    }

    /**
     * Setup checker tab events
     */
    function setupCheckerEvents() {
        const platformSelect = document.getElementById('platform');
        const addVideoBtn = document.getElementById('addVideoBtn');
        const deleteVideoBtn = document.getElementById('deleteVideoBtn');
        const saveInfluencerBtn = document.getElementById('saveInfluencerBtn');
        const minFollowersInput = document.getElementById('minFollowers');
        const minEngagementInput = document.getElementById('minEngagement');
        const minRatioInput = document.getElementById('minRatio');

        // Platform change
        if (platformSelect) {
            platformSelect.addEventListener('change', () => {
                updateVideoLabels();
                updateRatioVisibility();
                recalculateMetrics();
            });
        }

        // Add video button
        if (addVideoBtn) {
            addVideoBtn.addEventListener('click', addVideoEntry);
        }

        // Delete video button
        if (deleteVideoBtn) {
            deleteVideoBtn.addEventListener('click', deleteLastVideoEntry);
        }

        // Save influencer button
        if (saveInfluencerBtn) {
            saveInfluencerBtn.addEventListener('click', saveInfluencer);
        }

        // Input changes for eligibility settings
        [minFollowersInput, minEngagementInput, minRatioInput].forEach(input => {
            if (input) {
                input.addEventListener('change', recalculateMetrics);
            }
        });

        // Initialize with first video entry
        updateVideoLabels();
        updateRatioVisibility();
        addVideoEntry();
    }

    /**
     * Setup influencers tab events
     */
    function setupInfluencersEvents() {
        const searchInput = document.getElementById('searchInput');
        const platformFilter = document.getElementById('platformFilter');
        const statusFilter = document.getElementById('statusFilter');
        const sortFilter = document.getElementById('sortFilter');

        [searchInput, platformFilter, statusFilter, sortFilter].forEach(input => {
            if (input) {
                input.addEventListener('change', filterAndSortInfluencers);
                if (input === searchInput) {
                    input.addEventListener('input', filterAndSortInfluencers);
                }
            }
        });

        // Influencer card actions (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card-btn')) {
                const btn = e.target.closest('.card-btn');
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);

                switch (action) {
                    case 'open':
                        openInfluencerReport(id);
                        break;
                    case 'edit':
                        editInfluencer(id);
                        break;
                    case 'delete':
                        deleteInfluencer(id);
                        break;
                    case 'duplicate':
                        duplicateInfluencer(id);
                        break;
                }
            }
        });
    }

    /**
     * Setup settings tab events
     */
    function setupSettingsEvents() {
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const importJsonBtn = document.getElementById('importJsonBtn');
        const importFile = document.getElementById('importFile');
        const clearDataBtn = document.getElementById('clearDataBtn');

        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
            const influencers = Storage.getAllInfluencers();
            ExportImport.exportAsCSV(influencers);
            UIHelpers.showNotification('Influencers exported as CSV');
        });

        if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => {
            const influencers = Storage.getAllInfluencers();
            ExportImport.exportAsExcel(influencers);
            UIHelpers.showNotification('Influencers exported as Excel');
        });

        if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => {
            const influencers = Storage.getAllInfluencers();
            ExportImport.exportAsJSON(influencers);
            UIHelpers.showNotification('Influencers exported as JSON');
        });

        if (importJsonBtn) {
            importJsonBtn.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const influencers = await ExportImport.importFromJSON(file);
                        Storage.importInfluencers(influencers);
                        UIHelpers.showNotification(`Successfully imported ${influencers.length} influencers`);
                        updateDashboard();
                        displayInfluencers();
                    } catch (error) {
                        UIHelpers.showNotification(error.message, 'error');
                    }
                }
                // Reset file input
                importFile.value = '';
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                UIHelpers.confirmAction(
                    'Clear All Data',
                    'Are you sure you want to delete all saved influencers? This cannot be undone.',
                    () => {
                        Storage.clearAll();
                        UIHelpers.showNotification('All data cleared');
                        updateDashboard();
                        displayInfluencers();
                    }
                );
            });
        }
    }

    /**
     * Setup modal events
     */
    function setupModalEvents() {
        const reportModal = document.getElementById('reportModal');
        const confirmModal = document.getElementById('confirmModal');
        const modalCloseButtons = document.querySelectorAll('.modal-close');

        modalCloseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    UIHelpers.hideModal(modal.id);
                }
            });
        });

        // Close modal when clicking outside
        [reportModal, confirmModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        UIHelpers.hideModal(modal.id);
                    }
                });
            }
        });
    }

    /**
     * Switch between tabs
     */
    function switchTab(tabName) {
        currentTab = tabName;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            checker: 'Influencer Checker',
            influencers: 'Saved Influencers',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';

        // Show/hide tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.remove('hidden');
        }

        // Update header buttons visibility
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        if (exportBtn && importBtn) {
            if (tabName === 'influencers') {
                exportBtn.style.display = 'inline-block';
                importBtn.style.display = 'inline-block';
            } else {
                exportBtn.style.display = 'none';
                importBtn.style.display = 'none';
            }
        }

        // Update displays
        if (tabName === 'dashboard') {
            updateDashboard();
        } else if (tabName === 'influencers') {
            displayInfluencers();
        } else if (tabName === 'checker') {
            if (currentEditingId === null) {
                resetCheckerForm();
            }
        }
    }

    /**
     * Update video/post labels based on platform
     */
    function updateVideoLabels() {
        const platform = document.getElementById('platform').value;
        const labels = platform === 'youtube' ? 'Videos' : 'Posts';
        document.querySelectorAll('[data-video-label]').forEach(el => {
            el.textContent = labels;
        });
    }

    /**
     * Show/hide ratio field based on platform
     */
    function updateRatioVisibility() {
        const platform = document.getElementById('platform').value;
        const ratioGroup = document.getElementById('minRatioGroup');
        const ratioMetricContainer = document.getElementById('ratioMetricContainer');

        if (ratioGroup) ratioGroup.style.display = platform === 'youtube' ? 'block' : 'none';
        if (ratioMetricContainer) ratioMetricContainer.style.display = platform === 'youtube' ? 'block' : 'none';
    }

    /**
     * Add video/post entry
     */
    function addVideoEntry() {
        const container = document.getElementById('videosContainer');
        const videos = container.querySelectorAll('.video-entry').length;

        if (videos >= 20) {
            UIHelpers.showNotification('Maximum 20 videos/posts allowed', 'warning');
            return;
        }

        const platform = document.getElementById('platform').value;
        const isYoutube = platform === 'youtube';
        const label = isYoutube ? 'Video' : 'Post';

        const entry = document.createElement('div');
        entry.className = 'video-entry';
        entry.innerHTML = `
            <div class="form-group">
                <label>Views</label>
                <input type="number" class="form-control video-views" placeholder="0" min="0" value="0">
            </div>
            <div class="form-group">
                <label>Likes</label>
                <input type="number" class="form-control video-likes" placeholder="0" min="0" value="0">
            </div>
            <div class="form-group">
                <label>Comments</label>
                <input type="number" class="form-control video-comments" placeholder="0" min="0" value="0">
            </div>
            <button type="button" class="video-remove-btn" title="Remove this ${label}">×</button>
        `;

        // Add event listeners
        entry.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', recalculateMetrics);
        });

        entry.querySelector('.video-remove-btn').addEventListener('click', () => {
            entry.remove();
            updateEntryCount();
            recalculateMetrics();
        });

        container.appendChild(entry);
        updateEntryCount();
        recalculateMetrics();
    }

    /**
     * Delete last video entry
     */
    function deleteLastVideoEntry() {
        const container = document.getElementById('videosContainer');
        const entries = container.querySelectorAll('.video-entry');

        if (entries.length > 1) {
            entries[entries.length - 1].remove();
            updateEntryCount();
            recalculateMetrics();
        }
    }

    /**
     * Update entry count
     */
    function updateEntryCount() {
        const container = document.getElementById('videosContainer');
        const count = container.querySelectorAll('.video-entry').length;
        const countElement = document.getElementById('entryCount');
        if (countElement) {
            countElement.textContent = `${count} / 20`;
        }

        // Update delete button state
        const deleteBtn = document.getElementById('deleteVideoBtn');
        if (deleteBtn) {
            deleteBtn.disabled = count <= 1;
        }
    }

    /**
     * Recalculate metrics
     */
    function recalculateMetrics() {
        const platform = document.getElementById('platform').value;
        const followers = parseInt(document.getElementById('followers').value) || 0;
        const minFollowers = parseInt(document.getElementById('minFollowers').value) || 0;
        const minEngagement = parseFloat(document.getElementById('minEngagement').value) || 0;
        const minRatio = parseFloat(document.getElementById('minRatio').value) || 0;

        // Collect video/post data
        const entries = document.querySelectorAll('.video-entry');
        const videos = [];
        entries.forEach(entry => {
            const views = parseInt(entry.querySelector('.video-views').value) || 0;
            const likes = parseInt(entry.querySelector('.video-likes').value) || 0;
            const comments = parseInt(entry.querySelector('.video-comments').value) || 0;

            videos.push({ views, likes, comments });
        });

        // Calculate metrics
        let metrics = {};
        if (platform === 'youtube') {
            metrics = Calculations.calculateYouTubeMetrics(videos);
            metrics.viewsToSubscriberRatio = Calculations.calculateViewsToSubscriberRatio(
                metrics.avgViews,
                followers
            );
        } else {
            metrics = Calculations.calculateInstagramMetrics(videos);
            metrics.engagementRate = Calculations.calculateInstagramEngagementRate(
                metrics.avgLikes,
                metrics.avgComments,
                followers
            );
        }

        // Update display
        updateMetricsDisplay(metrics);

        // Check eligibility
        checkEligibility(platform, metrics, followers, minFollowers, minEngagement, minRatio);
    }

    /**
     * Update metrics display
     */
    function updateMetricsDisplay(metrics) {
        document.getElementById('avgViewsMetric').textContent = UIHelpers.formatNumber(metrics.avgViews || 0);
        document.getElementById('avgLikesMetric').textContent = UIHelpers.formatNumber(metrics.avgLikes || 0);
        document.getElementById('avgCommentsMetric').textContent = UIHelpers.formatNumber(metrics.avgComments || 0);
        document.getElementById('engagementMetric').textContent = UIHelpers.formatPercentage(metrics.engagementRate || 0);

        const ratioMetric = document.getElementById('ratioMetric');
        if (ratioMetric) {
            ratioMetric.textContent = UIHelpers.formatPercentage(metrics.viewsToSubscriberRatio || 0);
        }
    }

    /**
     * Check eligibility
     */
    function checkEligibility(platform, metrics, followers, minFollowers, minEngagement, minRatio) {
        const resultDiv = document.getElementById('eligibilityResult');
        const saveBtn = document.getElementById('saveInfluencerBtn');

        let eligibilityResult;
        if (platform === 'youtube') {
            eligibilityResult = Calculations.checkYouTubeEligibility(
                metrics,
                followers,
                minFollowers,
                minEngagement,
                minRatio
            );
        } else {
            eligibilityResult = Calculations.checkInstagramEligibility(
                metrics,
                followers,
                minFollowers,
                minEngagement
            );
        }

        // Update eligibility display
        const statusDiv = resultDiv.querySelector('.eligibility-status');
        statusDiv.className = `eligibility-status ${eligibilityResult.isEligible ? 'eligible' : 'not-eligible'}`;
        statusDiv.textContent = eligibilityResult.isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE';

        // Update requirements list
        const requirementsList = document.getElementById('requirementsCheckList');
        requirementsList.innerHTML = '';

        eligibilityResult.requirements.forEach(req => {
            const item = document.createElement('div');
            item.className = `requirement-item ${req.passed ? 'passed' : 'failed'}`;
            item.innerHTML = `
                <span class="requirement-icon">${req.passed ? '✓' : '✗'}</span>
                <span><strong>${req.name}:</strong> ${req.actual} ${req.passed ? '✓' : '(min: ' + req.required + ')'}</span>
            `;
            requirementsList.appendChild(item);
        });

        // Enable/disable save button
        if (saveBtn) {
            saveBtn.disabled = !eligibilityResult.isEligible;
        }

        return eligibilityResult;
    }

    /**
     * Save influencer
     */
    function saveInfluencer() {
        const platform = document.getElementById('platform').value;
        const handle = document.getElementById('handle').value.trim();
        const profileUrl = document.getElementById('profileUrl').value.trim();
        const followers = parseInt(document.getElementById('followers').value) || 0;
        const notes = document.getElementById('notes').value.trim();

        // Validate required fields
        if (!handle || !profileUrl || followers <= 0) {
            UIHelpers.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Collect video data
        const entries = document.querySelectorAll('.video-entry');
        const videos = [];
        entries.forEach(entry => {
            videos.push({
                views: parseInt(entry.querySelector('.video-views').value) || 0,
                likes: parseInt(entry.querySelector('.video-likes').value) || 0,
                comments: parseInt(entry.querySelector('.video-comments').value) || 0
            });
        });

        // Calculate final metrics
        let metrics = {};
        if (platform === 'youtube') {
            metrics = Calculations.calculateYouTubeMetrics(videos);
            metrics.viewsToSubscriberRatio = Calculations.calculateViewsToSubscriberRatio(
                metrics.avgViews,
                followers
            );
        } else {
            metrics = Calculations.calculateInstagramMetrics(videos);
            metrics.engagementRate = Calculations.calculateInstagramEngagementRate(
                metrics.avgLikes,
                metrics.avgComments,
                followers
            );
        }

        // Get eligibility status
        const minFollowers = parseInt(document.getElementById('minFollowers').value) || 0;
        const minEngagement = parseFloat(document.getElementById('minEngagement').value) || 0;
        const minRatio = parseFloat(document.getElementById('minRatio').value) || 0;

        let eligibilityResult;
        if (platform === 'youtube') {
            eligibilityResult = Calculations.checkYouTubeEligibility(
                metrics,
                followers,
                minFollowers,
                minEngagement,
                minRatio
            );
        } else {
            eligibilityResult = Calculations.checkInstagramEligibility(
                metrics,
                followers,
                minFollowers,
                minEngagement
            );
        }

        const influencerData = {
            platform,
            handle,
            profileUrl,
            followers,
            notes,
            videos: platform === 'youtube' ? videos : undefined,
            posts: platform === 'instagram' ? videos : undefined,
            isEligible: eligibilityResult.isEligible
        };

        // Save or update
        if (currentEditingId) {
            Storage.updateInfluencer(currentEditingId, influencerData);
            UIHelpers.showNotification('Influencer updated successfully');
            currentEditingId = null;
        } else {
            Storage.saveInfluencer(influencerData);
            UIHelpers.showNotification('Influencer saved successfully');
        }

        resetCheckerForm();
        updateDashboard();
    }

    /**
     * Reset checker form
     */
    function resetCheckerForm() {
        document.getElementById('platform').value = 'youtube';
        document.getElementById('handle').value = '';
        document.getElementById('profileUrl').value = '';
        document.getElementById('followers').value = '';
        document.getElementById('notes').value = '';

        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        updateVideoLabels();
        updateRatioVisibility();
        addVideoEntry();

        currentEditingId = null;
    }

    /**
     * Edit influencer
     */
    function editInfluencer(id) {
        const influencer = Storage.getInfluencer(id);
        if (!influencer) return;

        // Populate form
        document.getElementById('platform').value = influencer.platform;
        document.getElementById('handle').value = influencer.handle;
        document.getElementById('profileUrl').value = influencer.profileUrl;
        document.getElementById('followers').value = influencer.followers;
        document.getElementById('notes').value = influencer.notes || '';

        // Clear and populate videos
        const container = document.getElementById('videosContainer');
        container.innerHTML = '';

        updateVideoLabels();
        updateRatioVisibility();

        const videos = influencer.platform === 'youtube' ? influencer.videos : influencer.posts;
        if (videos && videos.length > 0) {
            videos.forEach(video => {
                addVideoEntry();
                const entries = container.querySelectorAll('.video-entry');
                const lastEntry = entries[entries.length - 1];
                lastEntry.querySelector('.video-views').value = video.views;
                lastEntry.querySelector('.video-likes').value = video.likes;
                lastEntry.querySelector('.video-comments').value = video.comments;
            });
        } else {
            addVideoEntry();
        }

        currentEditingId = id;
        recalculateMetrics();
        switchTab('checker');

        UIHelpers.showNotification('Edit mode enabled');
    }

    /**
     * Delete influencer
     */
    function deleteInfluencer(id) {
        UIHelpers.confirmAction(
            'Delete Influencer',
            'Are you sure you want to delete this influencer?',
            () => {
                Storage.deleteInfluencer(id);
                UIHelpers.showNotification('Influencer deleted');
                displayInfluencers();
                updateDashboard();
            }
        );
    }

    /**
     * Duplicate influencer
     */
    function duplicateInfluencer(id) {
        Storage.duplicateInfluencer(id);
        UIHelpers.showNotification('Influencer duplicated');
        displayInfluencers();
        updateDashboard();
    }

    /**
     * Open influencer report
     */
    function openInfluencerReport(id) {
        const influencer = Storage.getInfluencer(id);
        if (!influencer) return;

        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = UIHelpers.createFullReport(influencer);

        UIHelpers.showModal('reportModal');
    }

    /**
     * Display influencers
     */
    function displayInfluencers() {
        const influencers = Storage.getAllInfluencers();
        const container = document.getElementById('influencersContainer');

        if (influencers.length === 0) {
            container.innerHTML = '<p class="empty-state">No influencers saved yet. Check and save influencers from the Checker tab!</p>';
            return;
        }

        container.innerHTML = '';
        influencers.forEach(influencer => {
            const card = UIHelpers.createInfluencerCard(influencer);
            container.appendChild(card);
        });
    }

    /**
     * Filter and sort influencers
     */
    function filterAndSortInfluencers() {
        const influencers = Storage.getAllInfluencers();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const platformFilter = document.getElementById('platformFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortFilter').value;

        // Filter
        let filtered = influencers.filter(inf => {
            const matchesSearch = !searchTerm || 
                inf.handle.toLowerCase().includes(searchTerm) ||
                (inf.notes && inf.notes.toLowerCase().includes(searchTerm));

            const matchesPlatform = !platformFilter || inf.platform === platformFilter;

            const matchesStatus = !statusFilter ||
                (statusFilter === 'eligible' && inf.isEligible) ||
                (statusFilter === 'not-eligible' && !inf.isEligible);

            return matchesSearch && matchesPlatform && matchesStatus;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.dateSaved) - new Date(a.dateSaved);
                case 'oldest':
                    return new Date(a.dateSaved) - new Date(b.dateSaved);
                case 'engagement-high': {
                    const metricsA = getMetricsForInfluencer(a);
                    const metricsB = getMetricsForInfluencer(b);
                    return (metricsB.engagementRate || 0) - (metricsA.engagementRate || 0);
                }
                case 'engagement-low': {
                    const metricsA = getMetricsForInfluencer(a);
                    const metricsB = getMetricsForInfluencer(b);
                    return (metricsA.engagementRate || 0) - (metricsB.engagementRate || 0);
                }
                case 'subscribers-high':
                    return b.followers - a.followers;
                case 'views-high': {
                    const metricsA = getMetricsForInfluencer(a);
                    const metricsB = getMetricsForInfluencer(b);
                    return (metricsB.avgViews || 0) - (metricsA.avgViews || 0);
                }
                case 'alphabetical':
                    return a.handle.localeCompare(b.handle);
                default:
                    return 0;
            }
        });

        // Display
        const container = document.getElementById('influencersContainer');
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No influencers match your filters</p>';
            return;
        }

        container.innerHTML = '';
        filtered.forEach(influencer => {
            const card = UIHelpers.createInfluencerCard(influencer);
            container.appendChild(card);
        });
    }

    /**
     * Helper to get metrics for an influencer
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
     * Update dashboard
     */
    function updateDashboard() {
        const influencers = Storage.getAllInfluencers();

        // Calculate statistics
        const totalInfluencers = influencers.length;
        const eligibleInfluencers = influencers.filter(inf => inf.isEligible).length;

        let totalEngagement = 0;
        let engagementCount = 0;
        let totalViews = 0;
        let viewCount = 0;
        let totalSubscribers = 0;

        const platformStats = { youtube: 0, instagram: 0 };

        influencers.forEach(inf => {
            platformStats[inf.platform]++;
            totalSubscribers += inf.followers;

            const metrics = getMetricsForInfluencer(inf);
            if (metrics.engagementRate > 0) {
                totalEngagement += metrics.engagementRate;
                engagementCount++;
            }
            if (metrics.avgViews > 0) {
                totalViews += metrics.avgViews;
                viewCount++;
            }
        });

        // Update stat cards
        document.getElementById('totalInfluencers').textContent = totalInfluencers;
        document.getElementById('eligibleInfluencers').textContent = eligibleInfluencers;
        document.getElementById('avgEngagement').textContent = engagementCount > 0
            ? UIHelpers.formatPercentage(totalEngagement / engagementCount)
            : '0%';
        document.getElementById('avgViews').textContent = UIHelpers.formatNumber(viewCount > 0 ? totalViews / viewCount : 0);
        document.getElementById('avgSubscribers').textContent = UIHelpers.formatNumber(totalSubscribers / (totalInfluencers || 1));

        // Update recent influencers
        const recentInfluencersContainer = document.getElementById('recentInfluencersContainer');
        const recent = influencers.slice(-5).reverse();

        if (recent.length === 0) {
            recentInfluencersContainer.innerHTML = '<p class="empty-state">No influencers yet. Start by checking eligibility!</p>';
        } else {
            recentInfluencersContainer.innerHTML = '';
            recent.forEach(inf => {
                recentInfluencersContainer.appendChild(UIHelpers.createInfluencerCard(inf));
            });
        }

        // Update platform distribution
        const platformDistribution = document.getElementById('platformDistribution');
        if (totalInfluencers === 0) {
            platformDistribution.innerHTML = '<p class="empty-state">No data yet</p>';
        } else {
            platformDistribution.innerHTML = `
                <div class="platform-stat-item">
                    <span class="platform-stat-name">📺 YouTube</span>
                    <span class="platform-stat-count">${platformStats.youtube}</span>
                </div>
                <div class="platform-stat-item">
                    <span class="platform-stat-name">📷 Instagram</span>
                    <span class="platform-stat-count">${platformStats.instagram}</span>
                </div>
            `;
        }
    }

    return {
        init
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
