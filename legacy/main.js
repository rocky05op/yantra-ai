// Main Application Logic
class YantraApp {
    constructor() {
        this.canvas = document.getElementById('yantracCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        this.settings = {
            layers: 6,
            rotation: 0,
            symmetry: 6,
            scale: 1,
            speed: 50,
            animation: true,
            theme: 'lavender',
            customColor: '#b19cd9'
        };

        this.themes = {
            lavender: { primary: '#b19cd9', secondary: '#7851a9', accent: '#d4a5ff' },
            cosmic: { primary: '#ff006e', secondary: '#8338ec', accent: '#ff006e' },
            ocean: { primary: '#00d9ff', secondary: '#0066cc', accent: '#00d9ff' },
            sunset: { primary: '#ff6b35', secondary: '#f7931e', accent: '#ff6b35' },
            forest: { primary: '#06a77d', secondary: '#2d6a4f', accent: '#06a77d' },
            sakura: { primary: '#ff69b4', secondary: '#ff1493', accent: '#ff69b4' }
        };

        this.history = [];
        this.historyIndex = -1;
        this.animationId = null;
        this.startTime = Date.now();

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupEventListeners();
        this.saveState();
        this.draw();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        this.previewCanvas.width = 200;
        this.previewCanvas.height = 200;
        
        this.draw();
    }

    setupEventListeners() {
        // Sliders
        document.getElementById('layersSlider').addEventListener('input', (e) => {
            this.settings.layers = parseInt(e.target.value);
            document.getElementById('layersValue').textContent = this.settings.layers;
            document.getElementById('infoLayers').textContent = this.settings.layers;
            this.saveState();
            this.draw();
        });

        document.getElementById('rotationSlider').addEventListener('input', (e) => {
            this.settings.rotation = parseInt(e.target.value);
            document.getElementById('rotationValue').textContent = this.settings.rotation + '°';
            this.saveState();
            this.draw();
        });

        document.getElementById('symmetrySlider').addEventListener('input', (e) => {
            this.settings.symmetry = parseInt(e.target.value);
            document.getElementById('symmetryValue').textContent = this.settings.symmetry;
            document.getElementById('infoSymmetry').textContent = this.settings.symmetry + '-fold';
            this.saveState();
            this.draw();
        });

        document.getElementById('scaleSlider').addEventListener('input', (e) => {
            this.settings.scale = parseFloat(e.target.value);
            document.getElementById('scaleValue').textContent = this.settings.scale.toFixed(1) + 'x';
            this.saveState();
            this.draw();
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.settings.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.settings.speed + '%';
        });

        document.getElementById('animationToggle').addEventListener('change', (e) => {
            this.settings.animation = e.target.checked;
            if (this.settings.animation) {
                this.startTime = Date.now();
                this.draw();
            }
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('randomBtn').addEventListener('click', () => this.randomPattern());

        // Color Presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.theme = e.target.dataset.theme;
                document.getElementById('infoTheme').textContent = 
                    e.target.title.charAt(0).toUpperCase() + e.target.title.slice(1);
                this.saveState();
                this.draw();
            });
        });

        // Custom Color
        document.getElementById('colorInput').addEventListener('input', (e) => {
            this.settings.customColor = e.target.value;
            this.saveState();
            this.draw();
        });

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyPreset(e.target.dataset.preset));
        });
    }

    draw() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.8 * this.settings.scale;

        // Clear canvas
        this.ctx.fillStyle = '#0f0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Get animation offset
        let animationOffset = 0;
        if (this.settings.animation) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            animationOffset = (elapsed * this.settings.speed / 50) % 360;
        }

        // Draw pattern
        this.drawPattern(centerX, centerY, maxRadius, animationOffset);

        // Draw preview
        this.drawPreview();

        // Continue animation
        if (this.settings.animation) {
            this.animationId = requestAnimationFrame(() => this.draw());
        } else if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    drawPattern(centerX, centerY, maxRadius, animationOffset) {
        const theme = this.themes[this.settings.theme] || this.themes.lavender;
        
        for (let layer = 0; layer < this.settings.layers; layer++) {
            const radius = (maxRadius / this.settings.layers) * (layer + 1);
            const rotation = (this.settings.rotation + animationOffset) * Math.PI / 180;
            
            this.drawLayer(centerX, centerY, radius, layer, rotation, theme);
        }
    }

    drawLayer(centerX, centerY, radius, layerIndex, rotation, theme) {
        const symmetry = this.settings.symmetry;
        const angleStep = (Math.PI * 2) / symmetry;
        
        // Alternate between primary and secondary colors
        const color = layerIndex % 2 === 0 ? theme.primary : theme.secondary;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation);

        for (let i = 0; i < symmetry; i++) {
            const angle = angleStep * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Draw circles
            this.drawCircle(x, y, radius * 0.15, color);

            // Draw connecting lines
            if (i < symmetry - 1) {
                const nextAngle = angleStep * (i + 1);
                const nextX = Math.cos(nextAngle) * radius;
                const nextY = Math.sin(nextAngle) * radius;
                this.drawLine(x, y, nextX, nextY, color);
            }
        }

        this.ctx.restore();
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = 0.5;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawLine(x1, y1, x2, y2, color) {
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = 0.4;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawPreview() {
        const centerX = this.previewCanvas.width / 2;
        const centerY = this.previewCanvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.7;

        this.previewCtx.fillStyle = '#0f0a1a';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        const theme = this.themes[this.settings.theme] || this.themes.lavender;
        
        for (let layer = 0; layer < this.settings.layers; layer++) {
            const radius = (maxRadius / this.settings.layers) * (layer + 1);
            const rotation = (this.settings.rotation) * Math.PI / 180;
            this.drawPreviewLayer(centerX, centerY, radius, layer, rotation, theme);
        }
    }

    drawPreviewLayer(centerX, centerY, radius, layerIndex, rotation, theme) {
        const symmetry = this.settings.symmetry;
        const angleStep = (Math.PI * 2) / symmetry;
        const color = layerIndex % 2 === 0 ? theme.primary : theme.secondary;
        
        this.previewCtx.save();
        this.previewCtx.translate(centerX, centerY);
        this.previewCtx.rotate(rotation);

        for (let i = 0; i < symmetry; i++) {
            const angle = angleStep * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            this.previewCtx.fillStyle = color;
            this.previewCtx.globalAlpha = 0.8;
            this.previewCtx.beginPath();
            this.previewCtx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
            this.previewCtx.fill();
        }

        this.previewCtx.restore();
    }

    saveState() {
        this.historyIndex++;
        this.history = this.history.slice(0, this.historyIndex);
        this.history.push(JSON.parse(JSON.stringify(this.settings)));
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
            this.showToast('Undo');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
            this.showToast('Redo');
        }
    }

    loadState(state) {
        this.settings = JSON.parse(JSON.stringify(state));
        document.getElementById('layersSlider').value = this.settings.layers;
        document.getElementById('layersValue').textContent = this.settings.layers;
        document.getElementById('rotationSlider').value = this.settings.rotation;
        document.getElementById('rotationValue').textContent = this.settings.rotation + '°';
        document.getElementById('symmetrySlider').value = this.settings.symmetry;
        document.getElementById('symmetryValue').textContent = this.settings.symmetry;
        document.getElementById('scaleSlider').value = this.settings.scale;
        document.getElementById('scaleValue').textContent = this.settings.scale.toFixed(1) + 'x';
        document.getElementById('colorInput').value = this.settings.customColor;
        this.draw();
    }

    reset() {
        this.settings = {
            layers: 6,
            rotation: 0,
            symmetry: 6,
            scale: 1,
            speed: 50,
            animation: true,
            theme: 'lavender',
            customColor: '#b19cd9'
        };
        this.loadState(this.settings);
        this.saveState();
        this.showToast('Reset to default');
    }

    randomPattern() {
        const themes = Object.keys(this.themes);
        this.settings.layers = Math.floor(Math.random() * 8) + 3;
        this.settings.rotation = Math.floor(Math.random() * 360);
        this.settings.symmetry = Math.floor(Math.random() * 10) + 3;
        this.settings.scale = (Math.random() * 1.5) + 0.5;
        this.settings.theme = themes[Math.floor(Math.random() * themes.length)];
        this.loadState(this.settings);
        this.saveState();
        this.showToast('Random pattern generated');
    }

    applyPreset(preset) {
        switch(preset) {
            case 'mandala':
                this.settings = { ...this.settings, layers: 8, symmetry: 8, scale: 0.9 };
                break;
            case 'flower':
                this.settings = { ...this.settings, layers: 5, symmetry: 5, scale: 0.8 };
                break;
            case 'geometric':
                this.settings = { ...this.settings, layers: 6, symmetry: 4, scale: 1 };
                break;
            case 'spiral':
                this.settings = { ...this.settings, layers: 12, symmetry: 3, scale: 1.2 };
                break;
            case 'kaleidoscope':
                this.settings = { ...this.settings, layers: 10, symmetry: 12, scale: 0.9 };
                break;
        }
        this.loadState(this.settings);
        this.saveState();
        this.showToast(`Preset: ${preset}`);
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.yantracApp = new YantraApp();
});