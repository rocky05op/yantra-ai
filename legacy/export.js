// Export functionality
const ExportManager = {
    init() {
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadPNG());
        document.getElementById('shareBtn').addEventListener('click', () => this.sharePattern());
    },

    downloadPNG() {
        const canvas = document.getElementById('yantracCanvas');
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `yantra-pattern-${Date.now()}.png`;
        link.click();
        window.yantracApp.showToast('Pattern downloaded!');
    },

    sharePattern() {
        const canvas = document.getElementById('yantracCanvas');
        const imageData = canvas.toDataURL('image/png');
        
        if (navigator.share) {
            navigator.share({
                title: 'YANTRA Pattern',
                text: 'Check out this sacred geometric pattern I created!',
                url: window.location.href
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            const blob = canvas.toBlob(blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    window.yantracApp.showToast('Pattern copied to clipboard!');
                });
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ExportManager.init();
});