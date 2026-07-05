/* ============================================
   Storage Module - Handle LocalStorage
   ============================================ */

const Storage = (() => {
    const STORAGE_KEY = 'ima_influencers';
    const THEME_KEY = 'ima_theme';
    const SETTINGS_KEY = 'ima_settings';

    return {
        /**
         * Get all saved influencers
         */
        getAllInfluencers() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Error reading influencers from storage:', error);
                return [];
            }
        },

        /**
         * Save a new influencer
         */
        saveInfluencer(influencerData) {
            try {
                const influencers = this.getAllInfluencers();
                const newInfluencer = {
                    ...influencerData,
                    id: Date.now(),
                    dateSaved: new Date().toISOString()
                };
                influencers.push(newInfluencer);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(influencers));
                return newInfluencer;
            } catch (error) {
                console.error('Error saving influencer:', error);
                throw error;
            }
        },

        /**
         * Update an existing influencer
         */
        updateInfluencer(id, influencerData) {
            try {
                const influencers = this.getAllInfluencers();
                const index = influencers.findIndex(inf => inf.id === id);
                if (index !== -1) {
                    influencers[index] = { ...influencers[index], ...influencerData };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(influencers));
                    return influencers[index];
                }
                return null;
            } catch (error) {
                console.error('Error updating influencer:', error);
                throw error;
            }
        },

        /**
         * Delete an influencer
         */
        deleteInfluencer(id) {
            try {
                const influencers = this.getAllInfluencers();
                const filtered = influencers.filter(inf => inf.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                return true;
            } catch (error) {
                console.error('Error deleting influencer:', error);
                throw error;
            }
        },

        /**
         * Get a single influencer by ID
         */
        getInfluencer(id) {
            const influencers = this.getAllInfluencers();
            return influencers.find(inf => inf.id === id);
        },

        /**
         * Duplicate an influencer
         */
        duplicateInfluencer(id) {
            try {
                const influencer = this.getInfluencer(id);
                if (influencer) {
                    const { id: _, dateSaved: __, ...data } = influencer;
                    return this.saveInfluencer(data);
                }
                return null;
            } catch (error) {
                console.error('Error duplicating influencer:', error);
                throw error;
            }
        },

        /**
         * Clear all influencers
         */
        clearAll() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (error) {
                console.error('Error clearing storage:', error);
                throw error;
            }
        },

        /**
         * Save theme preference
         */
        setTheme(theme) {
            try {
                localStorage.setItem(THEME_KEY, theme);
            } catch (error) {
                console.error('Error saving theme:', error);
            }
        },

        /**
         * Get theme preference
         */
        getTheme() {
            try {
                return localStorage.getItem(THEME_KEY) || 'light';
            } catch (error) {
                console.error('Error reading theme:', error);
                return 'light';
            }
        },

        /**
         * Save eligibility settings
         */
        saveSettings(settings) {
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        },

        /**
         * Get eligibility settings
         */
        getSettings() {
            try {
                const data = localStorage.getItem(SETTINGS_KEY);
                return data ? JSON.parse(data) : {};
            } catch (error) {
                console.error('Error reading settings:', error);
                return {};
            }
        },

        /**
         * Import influencers from JSON
         */
        importInfluencers(influencersArray) {
            try {
                const existingInfluencers = this.getAllInfluencers();
                const newInfluencers = influencersArray.map(inf => ({
                    ...inf,
                    id: Date.now() + Math.random(),
                    dateSaved: new Date().toISOString()
                }));
                const combined = [...existingInfluencers, ...newInfluencers];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
                return combined;
            } catch (error) {
                console.error('Error importing influencers:', error);
                throw error;
            }
        }
    };
})();
