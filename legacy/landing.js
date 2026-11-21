class LandingPage {
    constructor() {
        this.canvas = document.getElementById('heroCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.animationTime = 0;
        
        this.init();
    }

    init() {
        this.animate();
        this.setupScrollAnimations();
    }

    animate() {
        this.animationTime += 0.01;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw animated yantra
        this.drawYantra();

        requestAnimationFrame(() => this.animate());
    }

    drawYantra() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = 150;

        // Draw rotating layers
        for (let layer = 0; layer < 6; layer++) {
            const radius = (maxRadius / 6) * (layer + 1);
            const rotation = this.animationTime * 0.5 + (layer * Math.PI / 3);
            
            this.drawLayer(centerX, centerY, radius, layer, rotation);
        }

        // Draw center circle with glow
        this.ctx.fillStyle = '#d4a5ff';
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
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

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.8s ease-out forwards';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });
    }
}

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
});