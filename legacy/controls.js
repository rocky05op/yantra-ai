// Control panel logic
const ControlsManager = {
    init() {
        this.setupAutoSave();
        this.setupResponsive();
    },

    setupAutoSave() {
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        autoSaveToggle.addEventListener('click', () => {
            autoSaveToggle.style.opacity = autoSaveToggle.style.opacity === '0.5' ? '1' : '0.5';
            window.yantracApp.showToast('Auto-save ' + (autoSaveToggle.style.opacity === '1' ? 'enabled' : 'disabled'));
        });
    },

    setupResponsive() {
        const resizeObserver = new ResizeObserver(() => {
            if (window.yantracApp) {
                window.yantracApp.resizeCanvas();
            }
        });
        resizeObserver.observe(document.querySelector('.canvas-container'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ControlsManager.init();
});