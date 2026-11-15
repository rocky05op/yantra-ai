// Canvas utilities and drawing functions
const CanvasUtils = {
    drawGradient(ctx, x, y, radius, color1, color2) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    },

    drawGlow(ctx, x, y, radius, color, intensity = 1) {
        ctx.shadowColor = color;
        ctx.shadowBlur = radius * intensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },

    clearShadow(ctx) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    },

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;

            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    drawPolygon(ctx, cx, cy, sides, radius, color, rotation = 0) {
        const angleSlice = (Math.PI * 2) / sides;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = angleSlice * i + rotation;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.stroke();
    }
};