class YantrasLoadingScreen {
    constructor() {
        this.canvas = document.getElementById('loadingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 300;
        this.canvas.height = 300;
        this.animationProgress = 0;
        this.startTime = Date.now();
        this.duration = 2200; // 2.2 seconds
        
        this.init();
    }

    init() {
        this.animate();
    }

    animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        this.animationProgress = Math.min(elapsed / this.duration, 1);

        // Clear canvas
        this.ctx.fillStyle = 'transparent';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw animated yantra
        this.drawYantra();

        // Check if animation is complete
        if (this.animationProgress >= 1) {
            // Redirect to landing page
            setTimeout(() => {
                window.location.href = 'landing.html';
            }, 300);
        } else {
            requestAnimationFrame(() => this.animate());
        }
    }

    drawYantra() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = 120;

        // Draw rotating layers
        for (let layer = 0; layer < 6; layer++) {
            const radius = (maxRadius / 6) * (layer + 1);
            const rotation = (this.animationProgress * Math.PI * 2) + (layer * Math.PI / 3);
            
            this.drawLayer(centerX, centerY, radius, layer, rotation);
        }

        // Draw center circle
        this.ctx.fillStyle = '#d4a5ff';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    drawLayer(centerX, centerY, radius, layerIndex, rotation) {
        const symmetry = 6;
        const angleStep = (Math.PI * 2) / symmetry;
        const color = layerIndex % 2 === 0 ? '#b19cd9' : '#7851a9';

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation);

        for (let i = 0; i < symmetry; i++) {
            const angle = angleStep * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Draw circles
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.12, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw connecting lines
            if (i < symmetry - 1) {
                const nextAngle = angleStep * (i + 1);
                const nextX = Math.cos(nextAngle) * radius;
                const nextY = Math.sin(nextAngle) * radius;

                this.ctx.strokeStyle = color;
                this.ctx.globalAlpha = 0.4;
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(nextX, nextY);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
        this.ctx.globalAlpha = 1;
    }
}

// Initialize loading screen
document.addEventListener('DOMContentLoaded', () => {
    new YantrasLoadingScreen();
});