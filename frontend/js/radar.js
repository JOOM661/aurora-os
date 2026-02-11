// Radar Application with Canvas

class RadarApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.targets = [];
        this.sweepAngle = 0;
        this.animationId = null;
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Start animation
        this.animate();
        
        // Initialize with some targets
        this.generateTestTargets();
    }

    generateTestTargets() {
        this.targets = [
            { x: 50, y: 50, type: 'ally', distance: 100, bearing: 45 },
            { x: -30, y: 80, type: 'enemy', distance: 150, bearing: 120 },
            { x: -60, y: -40, type: 'enemy', distance: 200, bearing: 210 },
            { x: 80, y: -60, type: 'ally', distance: 180, bearing: 300 }
        ];
    }

    updateTargets(targets) {
        this.targets = targets.map(target => ({
            x: target.x,
            y: target.y,
            type: target.type,
            distance: target.distance,
            bearing: target.bearing
        }));
    }

    drawRadar() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw radar background
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        
        // Draw concentric circles
        for (let i = 1; i <= 4; i++) {
            const circleRadius = radius * (i / 4);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw distance labels
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`${i * 50}km`, centerX + circleRadius, centerY);
        }
        
        // Draw crosshairs
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius);
        this.ctx.lineTo(centerX, centerY + radius);
        this.ctx.moveTo(centerX - radius, centerY);
        this.ctx.lineTo(centerX + radius, centerY);
        this.ctx.stroke();
        
        // Draw angle lines
        for (let angle = 0; angle < 360; angle += 45) {
            const rad = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(rad);
            const y = centerY + radius * Math.sin(rad);
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // Draw angle labels
            this.ctx.fillText(`${angle}°`, x, y);
        }
        
        // Draw sweep line
        const sweepRad = (this.sweepAngle * Math.PI) / 180;
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(
            centerX + radius * Math.cos(sweepRad),
            centerY + radius * Math.sin(sweepRad)
        );
        this.ctx.stroke();
        
        // Draw sweep arc
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, sweepRad - 0.1, sweepRad + 0.1);
        this.ctx.stroke();
        
        // Draw targets
        this.targets.forEach(target => {
            const scale = radius / 100;
            const targetX = centerX + target.x * scale;
            const targetY = centerY + target.y * scale;
            
            // Set color based on target type
            if (target.type === 'ally') {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.strokeStyle = '#00ff00';
            } else {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.strokeStyle = '#ff0000';
            }
            
            // Draw target
            this.ctx.beginPath();
            this.ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw target glow
            this.ctx.beginPath();
            this.ctx.arc(targetX, targetY, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw target info
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(
                `${target.type.toUpperCase()} ${target.distance}km`,
                targetX + 10,
                targetY - 10
            );
            this.ctx.fillText(
                `BRG ${target.bearing.toFixed(0)}°`,
                targetX + 10,
                targetY
            );
        });
        
        // Draw radar info
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`AURORA-X RADAR | TARGETS: ${this.targets.length}`, 10, 20);
        this.ctx.fillText(`SWEEP: ${this.sweepAngle.toFixed(0)}°`, 10, 40);
        
        // Update sweep angle
        this.sweepAngle = (this.sweepAngle + 2) % 360;
    }

    animate() {
        this.drawRadar();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Export to global scope
window.radarApp = new RadarApp();
