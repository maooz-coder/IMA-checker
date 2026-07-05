/* ============================================
   Number Formatter Module - Format numbers with K, M, B notation
   ============================================ */

const NumberFormatter = (() => {
    /**
     * Convert human readable format to actual number
     * e.g., "2M" -> 2000000, "1.5K" -> 1500, "500" -> 500
     */
    function parseHumanNumber(value) {
        if (!value) return 0;
        
        value = value.toString().trim().toUpperCase();
        
        // Remove commas first
        value = value.replace(/,/g, '');
        
        // Extract number and suffix
        const match = value.match(/^([\d.]+)\s*([KMB])?$/);
        
        if (!match) return 0;
        
        let num = parseFloat(match[1]) || 0;
        const suffix = match[2];
        
        if (suffix === 'K') num *= 1000;
        else if (suffix === 'M') num *= 1000000;
        else if (suffix === 'B') num *= 1000000000;
        
        return Math.round(num);
    }

    /**
     * Convert number to human readable format
     * e.g., 2000000 -> "2M", 1500 -> "1.5K", 500 -> "500"
     */
    function formatHumanNumber(num) {
        num = parseInt(num) || 0;
        
        if (num >= 1000000) {
            let millions = (num / 1000000).toFixed(1);
            millions = parseFloat(millions); // Remove trailing zeros
            return millions % 1 === 0 ? millions.toFixed(0) + 'M' : millions + 'M';
        } else if (num >= 1000) {
            let thousands = (num / 1000).toFixed(1);
            thousands = parseFloat(thousands);
            return thousands % 1 === 0 ? thousands.toFixed(0) + 'K' : thousands + 'K';
        }
        
        return num.toString();
    }

    /**
     * Format number with commas
     * e.g., 1000000 -> "1,000,000"
     */
    function formatWithCommas(num) {
        num = parseInt(num) || 0;
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Format display value for input
     * Show human readable format with commas when input loses focus
     */
    function formatForDisplay(value) {
        const num = parseHumanNumber(value);
        const humanFormat = formatHumanNumber(num);
        return humanFormat;
    }

    return {
        parseHumanNumber,
        formatHumanNumber,
        formatWithCommas,
        formatForDisplay
    };
})();
