/* ========================================
   ANUBHAB JANA PORTFOLIO
   Complete Advanced Animation System
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    isTouch: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: window.innerWidth < 768,
    mobileIntensity: 0.4,
    soundEnabled: false
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
const lerp = (start, end, factor) => start + (end - start) * factor;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

// Simplex noise implementation
class SimplexNoise {
    constructor() {
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        this.perm = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }
    
    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        let n0, n1, n2;
        let s = (x + y) * F2;
        let i = Math.floor(x + s);
        let j = Math.floor(y + s);
        let t = (i + j) * G2;
        let X0 = i - t;
        let Y0 = j - t;
        let x0 = x - X0;
        let y0 = y - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        let x1 = x0 - i1 + G2;
        let y1 = y0 - j1 + G2;
        let x2 = x0 - 1 + 2 * G2;
        let y2 = y0 - 1 + 2 * G2;
        let ii = i & 255;
        let jj = j & 255;
        
        const grad = (hash, x, y) => {
            let h = hash & 3;
            let u = h < 2 ? x : y;
            let v = h < 2 ? y : x;
            return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
        };
        
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0;
        else { t0 *= t0; n0 = t0 * t0 * grad(this.perm[ii + this.perm[jj]], x0, y0); }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0;
        else { t1 *= t1; n1 = t1 * t1 * grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1); }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0;
        else { t2 *= t2; n2 = t2 * t2 * grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2); }
        
        return 70 * (n0 + n1 + n2);
    }
}

// ========================================
// TEXT SCRAMBLE CLASS - HERO NAME
// ========================================
class HeroNameScramble {
    constructor(element) {
        this.el = element;
        this.originalText = element.textContent;
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.scrambleDuration = 800;
        this.lockStagger = 40;
        this.isComplete = false;
    }
    
    start() {
        const text = this.originalText;
        const charArray = text.split('');
        
        // Create span for each character
        this.el.innerHTML = '';
        this.charSpans = charArray.map((char, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : this.chars[Math.floor(Math.random() * this.chars.length)];
            span.dataset.final = char;
            span.dataset.index = i;
            this.el.appendChild(span);
            return span;
        });
        
        // Phase 1: Rapid scramble for 800ms
        const scrambleInterval = setInterval(() => {
            this.charSpans.forEach(span => {
                if (span.dataset.final !== ' ') {
                    span.textContent = this.chars[Math.floor(Math.random() * this.chars.length)];
                }
            });
        }, 50);
        
        // Phase 2: Lock characters one by one
        setTimeout(() => {
            clearInterval(scrambleInterval);
            this.lockCharacters();
        }, this.scrambleDuration);
    }
    
    lockCharacters() {
        this.charSpans.forEach((span, i) => {
            if (span.dataset.final === ' ') {
                span.textContent = '\u00A0';
                return;
            }
            
            setTimeout(() => {
                // Final snap with scaleY bounce
                gsap.fromTo(span, 
                    { scaleY: 1.1 },
                    { 
                        scaleY: 1, 
                        duration: 0.2, 
                        ease: 'power2.out',
                        onStart: () => {
                            span.textContent = span.dataset.final;
                        }
                    }
                );
                
                // Check if all locked
                if (i === this.charSpans.length - 1) {
                    setTimeout(() => this.onComplete(), this.lockStagger + 200);
                }
            }, i * this.lockStagger);
        });
    }
    
    onComplete() {
        this.isComplete = true;
        // Start letter spacing breathe animation
        // this.el.classList.add('breathing');
    }
}

// PhysicsLabelSwap removed for signal trace

class TypewriterButton {
    constructor(element) {
        this.btn = element;
        this.textSpan = element.querySelector('.btn-text');
        this.originalText = this.textSpan.textContent;
        this.hoverText = element.dataset.hoverText;
        this.isHovering = false;
        this.isAnimating = false;
        this.targetText = this.originalText;
        
        this.init();
    }
    
    init() {
        const handleEnter = () => {
            this.isHovering = true;
            this.processQueue(this.hoverText);
        };
        const handleLeave = () => {
            this.isHovering = false;
            this.processQueue(this.originalText);
        };
        
        this.btn.addEventListener('mouseenter', handleEnter);
        this.btn.addEventListener('mouseleave', handleLeave);
        this.btn.addEventListener('touchstart', handleEnter, { passive: true });
        this.btn.addEventListener('touchend', handleLeave, { passive: true });
    }
    
    async processQueue(targetText) {
        this.targetText = targetText;
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        while (this.textSpan.textContent !== this.targetText) {
            const current = this.textSpan.textContent;
            
            if (!this.targetText.startsWith(current) && current.length > 0) {
                this.textSpan.textContent = current.slice(0, -1);
            } else {
                this.textSpan.textContent = this.targetText.substring(0, current.length + 1);
            }
            
            await new Promise(r => setTimeout(r, 30));
        }
        
        this.isAnimating = false;
        
        const intendedTarget = this.isHovering ? this.hoverText : this.originalText;
        if (this.targetText !== intendedTarget) {
            this.processQueue(intendedTarget);
        }
    }
}

// ========================================
// SECTION LABEL SCRAMBLE
// ========================================
class SectionLabelScramble {
    constructor(element) {
        this.el = element;
        this.originalText = element.textContent;
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    
    scramble() {
        const original = this.originalText;
        const duration = 600;
        const steps = 15;
        const stepDuration = duration / steps;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            let result = '';
            for (let i = 0; i < original.length; i++) {
                if (original[i] === ' ') {
                    result += ' ';
                } else if (i < original.length * easeProgress) {
                    result += original[i];
                } else {
                    result += this.chars[Math.floor(Math.random() * this.chars.length)];
                }
            }
            
            this.el.textContent = result;
            
            if (currentStep >= steps) {
                clearInterval(interval);
                this.el.textContent = original;
            }
        }, stepDuration);
    }
}

// ========================================
// PROJECT TITLE SHUFFLE
// ========================================
class TitleShuffle {
    constructor(element) {
        this.el = element;
        this.originalText = element.textContent;
    }
    
    shuffle() {
        const chars = this.originalText.split('');
        const original = [...chars];
        
        // Shuffle animation
        let iterations = 0;
        const interval = setInterval(() => {
            // Random shuffle
            for (let i = chars.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            this.el.textContent = chars.join('');
            
            iterations++;
            if (iterations >= 5) {
                clearInterval(interval);
                // Restore original
                this.restoreOriginal(original);
            }
        }, 80);
    }
    
    restoreOriginal(original) {
        let index = 0;
        const interval = setInterval(() => {
            const current = this.el.textContent.split('');
            // Find and place correct character
            const correctChar = original[index];
            const currentPos = current.indexOf(correctChar);
            if (currentPos !== -1 && currentPos !== index) {
                [current[index], current[currentPos]] = [current[currentPos], current[index]];
                this.el.textContent = current.join('');
            }
            index++;
            if (index >= original.length) {
                clearInterval(interval);
                this.el.textContent = this.originalText;
            }
        }, 50);
    }
}

// ========================================
// WEB AUDIO API SOUND SYSTEM
// ========================================
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = CONFIG.soundEnabled && !CONFIG.isTouch && !CONFIG.reducedMotion;
        this.toggleBtn = document.getElementById('sound-toggle');
        
        if (this.enabled) {
            this.init();
        }
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
        
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (this.toggleBtn) {
            this.toggleBtn.classList.toggle('muted', !this.enabled);
        }
    }
    
    playTone(frequency, duration, gain = 0.05, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    hover() { this.playTone(800, 30, 0.05, 'sine'); }
    click() { this.playTone(400, 60, 0.08, 'sine'); }
    navHover() { this.playTone(1200, 20, 0.03, 'sine'); }
}

// ========================================
// LOADING SCREEN
// ========================================
class Loader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.flash = document.getElementById('loader-flash');
        this.traces = document.querySelectorAll('.pcb-trace');
        this.pads = document.querySelector('.pcb-pads');
        this.glows = document.querySelectorAll('.pcb-glow');
        this.progress = document.getElementById('progress-trace');
        this.svg = document.querySelector('.pcb-svg');
        
        if (!this.loader) return;
    }
    
    initSVG() {
        this.traces.forEach(trace => {
            const length = trace.getTotalLength();
            trace.style.strokeDasharray = length;
            trace.style.strokeDashoffset = length;
        });
        
        if (this.progress) {
            const length = this.progress.getTotalLength();
            this.progress.style.strokeDasharray = length;
            this.progress.style.strokeDashoffset = length;
            this.progressLength = length;
        }
        
        this.glows.forEach(glow => {
            const length = glow.getTotalLength();
            glow.style.strokeDasharray = `4 ${length * 2}`;
            glow.style.strokeDashoffset = length;
            glow.style.stroke = "#FFF";
            glow.style.strokeWidth = "2.5";
            glow.style.filter = "drop-shadow(0 0 4px #FFF)";
            glow.length = length;
        });
        
        if (this.pads) this.pads.style.opacity = '0';
    }
    
    start() {
        if (CONFIG.reducedMotion) {
            this.completeSimple();
            return;
        }
        
        this.initSVG();
        const duration = 2800;
        const startTime = Date.now();
        
        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedTrace = 1 - Math.pow(1 - progress, 3);
            
            this.traces.forEach(trace => {
                const length = trace.getTotalLength();
                trace.style.strokeDashoffset = length * (1 - easedTrace);
            });
            
            if (this.progress && this.progressLength) {
                this.progress.style.strokeDashoffset = this.progressLength * (1 - progress);
            }
            
            this.glows.forEach(glow => {
                glow.style.strokeDashoffset = glow.length * (1 - Math.min(progress * 1.5, 1));
            });
            
            if (progress > 0.8 && this.pads) {
                this.pads.style.opacity = (progress - 0.8) * 5;
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                this.complete();
            }
        };
        
        requestAnimationFrame(update);
    }
    
    completeSimple() {
        gsap.to(this.loader, {
            opacity: 0, duration: 0.5, onComplete: () => {
                this.loader.style.display = 'none';
                if(app && typeof app.initAfterLoader === 'function') app.initAfterLoader();
            }
        });
    }
    
    complete() {
        if (this.flash) {
            this.flash.style.opacity = '1';
        }
        if (this.svg) {
            this.svg.style.filter = 'drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 30px #FFD700)';
        }
        
        setTimeout(() => {
            gsap.to(this.loader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    this.loader.style.display = 'none';
                    if (app && typeof app.initAfterLoader === 'function') {
                        app.initAfterLoader();
                    }
                }
            });
        }, 300);
    }
}

// ========================================
// SCROLL PROGRESS INDICATOR
// ========================================
class ScrollProgress {
    constructor() {
        this.progressBar = document.querySelector('.scroll-progress-fill');
        if (!this.progressBar) return;
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            this.progressBar.style.width = `${progress}%`;
        }, { passive: true });
    }
}

// ========================================
// WEBGL HERO BACKGROUND
// ========================================
class MorphingParticles {
    constructor() {
        if (CONFIG.reducedMotion) return;
        
        this.canvas = document.getElementById('hero-canvas');
        if (!this.canvas) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.time = 0;
        this.isActive = true;
        
        // Optimize for mobile GPU
        this.particleCount = CONFIG.isMobile ? 600 : 2000;
        
        this.shapes = [];
        this.currentShape = 0;
        this.nextShape = 1;
        this.morphProgress = 0;
        this.isMorphing = false;
        
        // For scroll implosion logic from original class
        this.implosionProgress = 0;
        
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true,
            powerPreference: 'low-power'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.generateShapes();
        this.createParticles();
        
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });
        
        window.addEventListener('resize', debounce(() => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, 150), { passive: true });
        
        // Morph every 5 seconds
        setInterval(() => {
            if (!this.isMorphing) this.morphToNextShape();
        }, 5000);
        
        this.animate();
        this.setupScrollImplosion();
    }
    
    setupScrollImplosion() {
        ScrollTrigger.create({
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
            onUpdate: (self) => {
                this.implosionProgress = self.progress;
            }
        });
    }
    
    generateShapes() {
        const generateRocket = () => {
            const positions = new Float32Array(this.particleCount * 3);
            for(let i=0; i<this.particleCount; i++) {
                const i3 = i * 3;
                const r = Math.random();
                let x, y, z;
                
                if (r < 0.45) { // Body
                    const h = (Math.random() - 0.5) * 20; 
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 3;
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                    y = h;
                } else if (r < 0.65) { // Nose
                    const h = Math.random() * 10;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 3 * (1 - h/10);
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                    y = h + 10;
                } else if (r < 0.8) { // Exhaust / flame
                    const h = Math.random() * 8;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 1.5 + h * 0.4;
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                    y = -10 - h;
                } else { // Fins
                    const side = Math.random() > 0.5 ? 1 : -1;
                    const h = (Math.random() * 8) - 10;
                    x = side * (3 + Math.random() * 5);
                    z = (Math.random() - 0.5) * 0.5; // slight thickness
                    y = h;
                    if (Math.random() > 0.5) {
                        z = x;
                        x = (Math.random() - 0.5) * 0.5;
                    }
                }
                
                // Tilt rocket slightly
                const angle = 0.5;
                const tempY = y * Math.cos(angle) - x * Math.sin(angle);
                const tempX = y * Math.sin(angle) + x * Math.cos(angle);
                
                positions[i3] = tempX * 1.5;
                positions[i3+1] = tempY * 1.5;
                positions[i3+2] = z * 1.5;
            }
            return positions;
        };
        
        const generateComputer = () => {
            const positions = new Float32Array(this.particleCount * 3);
            for(let i=0; i<this.particleCount; i++) {
                const i3 = i * 3;
                const r = Math.random();
                let x, y, z;
                
                if (r < 0.4) { // Base
                    x = (Math.random() - 0.5) * 30;
                    z = (Math.random() - 0.5) * 22;
                    y = -8 + (Math.random() * 1); // thickness
                } else { // Screen
                    x = (Math.random() - 0.5) * 30;
                    const screenH = Math.random() * 20;
                    y = -8 + screenH * Math.cos(0.3);
                    z = -11 - screenH * Math.sin(0.3);
                    
                    // Add thickness to screen back
                    if(Math.random() > 0.9) z -= Math.random(); 
                }
                
                // Tilt whole computer
                const angleX = 0.3;
                const tempY = y * Math.cos(angleX) - z * Math.sin(angleX);
                const tempZ = y * Math.sin(angleX) + z * Math.cos(angleX);
                
                positions[i3] = x;
                positions[i3+1] = tempY + 5;
                positions[i3+2] = tempZ;
            }
            return positions;
        };
        
        const generateAtom = () => {
            const positions = new Float32Array(this.particleCount * 3);
            for(let i=0; i<this.particleCount; i++) {
                const i3 = i * 3;
                const r = Math.random();
                
                if (r < 0.15) { // Core
                    const phi = Math.acos(-1 + (2 * Math.random()));
                    const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
                    const radius = Math.random() * 3 + 1;
                    positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
                    positions[i3+1] = radius * Math.sin(theta) * Math.sin(phi);
                    positions[i3+2] = radius * Math.cos(phi);
                } else { // Rings
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 15 + Math.random() * 1.5;
                    const ringIdx = Math.floor(Math.random() * 3);
                    
                    let x = Math.cos(angle) * radius;
                    let y = Math.sin(angle) * radius;
                    let z = (Math.random() - 0.5) * 1.5; // ring thickness
                    
                    if (ringIdx === 1) {
                        const temp = x; x = x * Math.cos(Math.PI/3) - z * Math.sin(Math.PI/3); z = temp * Math.sin(Math.PI/3) + z * Math.cos(Math.PI/3);
                        const temp2 = y; y = y * Math.cos(Math.PI/4) - z * Math.sin(Math.PI/4); z = temp2 * Math.sin(Math.PI/4) + z * Math.cos(Math.PI/4);
                    } else if (ringIdx === 2) {
                        const temp = x; x = x * Math.cos(-Math.PI/3) - z * Math.sin(-Math.PI/3); z = temp * Math.sin(-Math.PI/3) + z * Math.cos(-Math.PI/3);
                        const temp2 = y; y = y * Math.cos(-Math.PI/4) - z * Math.sin(-Math.PI/4); z = temp2 * Math.sin(-Math.PI/4) + z * Math.cos(-Math.PI/4);
                    }
                    
                    positions[i3] = x;
                    positions[i3+1] = y;
                    positions[i3+2] = z;
                }
            }
            return positions;
        };
        
        this.shapes.push(generateRocket());
        this.shapes.push(generateComputer());
        this.shapes.push(generateAtom());
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const initialPositions = new Float32Array(this.shapes[0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
        
        const colors = new Float32Array(this.particleCount * 3);
        const color1 = new THREE.Color(0x111111);
        const color2 = new THREE.Color(0xFFE500); // accent
        
        for(let i=0; i<this.particleCount; i++) {
            const isAccent = Math.random() > 0.85;
            const c = isAccent ? color2 : color1;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.9,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    morphToNextShape() {
        this.currentShape = this.nextShape;
        this.nextShape = (this.nextShape + 1) % this.shapes.length;
        this.morphProgress = 0;
        this.isMorphing = true;
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.time += 0.005;
        this.mouse.x = lerp(this.mouse.x, this.targetMouse.x, 0.05);
        this.mouse.y = lerp(this.mouse.y, this.targetMouse.y, 0.05);
        
        const positions = this.particles.geometry.attributes.position.array;
        
        let fromTarget, toTarget;
        if (this.isMorphing) {
            fromTarget = this.shapes[this.currentShape];
            toTarget = this.shapes[this.nextShape];
            this.morphProgress += 0.015;
            if (this.morphProgress >= 1) {
                this.morphProgress = 1;
                this.isMorphing = false;
                this.currentShape = this.nextShape;
            }
        } else {
            toTarget = this.shapes[this.currentShape];
        }
        
        const easeProgress = this.morphProgress < 0.5 
            ? 4 * this.morphProgress * this.morphProgress * this.morphProgress 
            : 1 - Math.pow(-2 * this.morphProgress + 2, 3) / 2;
            
        const mouseWorldX = this.mouse.x * 15;
        const mouseWorldY = this.mouse.y * 15;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            let bx, by, bz;
            if (this.isMorphing) {
                bx = lerp(fromTarget[i3], toTarget[i3], easeProgress);
                by = lerp(fromTarget[i3+1], toTarget[i3+1], easeProgress);
                bz = lerp(fromTarget[i3+2], toTarget[i3+2], easeProgress);
            } else {
                bx = toTarget[i3];
                by = toTarget[i3+1];
                bz = toTarget[i3+2];
            }
            
            // Apply subtle floating
            const floatY = Math.sin(this.time * 3 + i * 0.01) * 0.8;
            
            // Implosion from scroll
            const implosion = this.implosionProgress || 0;
            const targetX = bx * (1 - implosion * 0.9) + mouseWorldX;
            const targetY = by * (1 - implosion * 0.9) + floatY + mouseWorldY;
            const targetZ = bz * (1 - implosion * 0.5);
            
            positions[i3] = lerp(positions[i3], targetX, 0.1);
            positions[i3+1] = lerp(positions[i3+1], targetY, 0.1);
            positions[i3+2] = lerp(positions[i3+2], targetZ, 0.1);
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.material.opacity = 0.6 * (1 - this.implosionProgress);
        
        this.particles.rotation.y = Math.sin(this.time) * 0.3;
        this.particles.rotation.x = this.mouse.y * 0.1;
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// CONTACT FLOATING PARTICLES
// ========================================
class ContactParticles {
    constructor() {
        if (CONFIG.isTouch || CONFIG.reducedMotion || CONFIG.isMobile) return;
        
        this.canvas = document.getElementById('contact-particles');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isActive = true;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
        
        // Create 15-20 particles
        const count = 18;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 2 + Math.random() * 2,
                speedY: 0.3 + Math.random() * 0.5,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        
        this.animate();
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.y -= p.speedY;
            
            // Fade out at top
            let opacity = p.opacity;
            if (p.y < 50) {
                opacity = p.opacity * (p.y / 50);
            }
            
            // Reset when off screen
            if (p.y < -10) {
                p.y = this.canvas.height + 10;
                p.x = Math.random() * this.canvas.width;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(245, 245, 240, ${opacity})`;
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Advanced Cursor removed

// ========================================
// MAGNETIC ELEMENTS
// ========================================
class MagneticElements {
    constructor(soundSystem) {
        if (CONFIG.isTouch) return;
        
        this.elements = document.querySelectorAll('.magnetic-element');
        this.soundSystem = soundSystem;
        this.init();
    }
    
    init() {
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const dx = e.clientX - centerX;
                const dy = e.clientY - centerY;
                
                gsap.to(el, {
                    x: dx * 0.35,
                    y: dy * 0.35,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                
                const inner = el.querySelector('.btn-text');
                if (inner) {
                    gsap.to(inner, {
                        x: dx * 0.15,
                        y: dy * 0.15,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                }
            });
            
            el.addEventListener('mouseenter', () => {
                if (this.soundSystem) this.soundSystem.hover();
            });
            
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
                const inner = el.querySelector('.btn-text');
                if (inner) {
                    gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
                }
            });
        });
    }
}

// ========================================
// 3D CARD TILT
// ========================================
class Card3DTilt {
    constructor() {
        if (CONFIG.isTouch) return;
        
        this.cards = document.querySelectorAll('.project-card, .research-card');
        this.init();
    }
    
    init() {
        this.cards.forEach(card => {
            const shine = card.querySelector('.project-card-shine, .research-card-shine');
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                const rotateY = (mouseX / (rect.width / 2)) * 5;
                const rotateX = -(mouseY / (rect.height / 2)) * 5;
                
                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.4,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
                
                if (shine) {
                    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
                    gsap.to(shine, {
                        '--mouse-x': `${percentX}%`,
                        '--mouse-y': `${percentY}%`,
                        duration: 0.2
                    });
                }
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
            });
            
            // Tags float up sequentially
            const tags = card.querySelectorAll('.tag');
            card.addEventListener('mouseenter', () => {
                tags.forEach((tag, i) => {
                    setTimeout(() => {
                        gsap.to(tag, { y: -3, duration: 0.2, ease: 'power2.out' });
                    }, i * 50);
                });
            });
            
            card.addEventListener('mouseleave', () => {
                tags.forEach(tag => {
                    gsap.to(tag, { y: 0, duration: 0.3, ease: 'power2.out' });
                });
            });
        });
    }
}

// ========================================
// SMOOTH SCROLL (LENIS)
// ========================================
class SmoothScroll {
    constructor() {
        if (CONFIG.reducedMotion) return;
        
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2
        });
        
        this.velocity = 0;
        this.init();
    }
    
    init() {
        this.lenis.on('scroll', ({ velocity }) => {
            this.velocity = velocity;
            ScrollTrigger.update();
            this.applyVelocitySkew(velocity);
        });
        
        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });
        
        gsap.ticker.lagSmoothing(0);
    }
    
    applyVelocitySkew(velocity) {
        const skewAmount = clamp(velocity * 0.04, -2, 2);
        const textElements = document.querySelectorAll('h1, h2, h3, p');
        
        textElements.forEach(el => {
            gsap.to(el, { skewY: skewAmount, duration: 0.3, ease: 'power2.out' });
        });
    }
    
    scrollTo(target) {
        this.lenis.scrollTo(target);
    }
}

// ========================================
// HORIZONTAL SCROLL (SKILLS)
// ========================================
class HorizontalScroll {
    constructor() {
        if (CONFIG.isMobile || CONFIG.reducedMotion) return;
        
        this.wrapper = document.getElementById('skills-wrapper');
        this.track = document.getElementById('skills-track');
        this.progressBar = document.querySelector('.skills-progress-fill');
        
        if (!this.wrapper || !this.track) return;
        
        this.init();
    }
    
    init() {
        if (!this.track) return;
        this.track.style.willChange = 'transform';
        this.track.style.transform = 'translateZ(0)';
        
        const trackWidth = this.track.scrollWidth;
        const viewportWidth = window.innerWidth;
        const scrollDistance = trackWidth - viewportWidth + 100;
        
        gsap.to(this.track, {
            x: -scrollDistance,
            ease: 'none',
            scrollTrigger: {
                trigger: this.wrapper,
                start: 'top top',
                end: () => `+=${scrollDistance}`,
                pin: true,
                scrub: 1.5,
                anticipatePin: 1,
                onUpdate: (self) => {
                    if (this.progressBar) {
                        this.progressBar.style.width = `${self.progress * 100}%`;
                    }
                }
            }
        });
    }
}

// ========================================
// NAVBAR
// ========================================
class Navbar {
    constructor(soundSystem) {
        this.navbar = document.getElementById('navbar');
        this.soundSystem = soundSystem;
        this.lastScroll = 0;
        this.init();
    }
    
    init() {
        // Slide down after loader
        gsap.to(this.navbar, {
            y: 0,
            duration: 0.8,
            ease: 'expo.out',
            delay: 0.5
        });
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            if (currentScroll > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
            
            // Scroll hide/show animation
            if (currentScroll > this.lastScroll && currentScroll > 150) {
                // Scrolling down -> hide navbar
                gsap.to(this.navbar, { yPercent: -100, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            } else if (currentScroll < this.lastScroll || currentScroll <= 50) {
                // Scrolling up -> show navbar (yPercent: 0) and remove GSAP built-in y caching if any
                gsap.to(this.navbar, { yPercent: 0, y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            }
            
            this.lastScroll = currentScroll;
        }, { passive: true });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    if (app.smoothScroll) {
                        app.smoothScroll.scrollTo(target);
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
            
            link.addEventListener('mouseenter', () => {
                if (this.soundSystem) this.soundSystem.navHover();
            });
        });
        
        this.setupActiveSection();
    }
    
    setupActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onEnter: () => this.setActiveLink(section.id),
                onEnterBack: () => this.setActiveLink(section.id)
            });
        });
    }
    
    setActiveLink(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
}

// ========================================
// HERO TAGLINE ANIMATION
// ========================================
class HeroTagline {
    constructor() {
        this.tagline = document.getElementById('hero-subline');
        if (!this.tagline) return;
        
        this.words = this.tagline.querySelectorAll('.word');
        this.init();
    }
    
    init() {
        const intensity = CONFIG.isMobile ? CONFIG.mobileIntensity : 1;
        
        this.words.forEach((word, i) => {
            gsap.to(word, {
                y: 0,
                opacity: 0.7,
                duration: 0.6 * intensity,
                delay: 1.2 + (i * 0.1 * intensity),
                ease: 'power3.out',
                onComplete: () => word.classList.add('revealed')
            });
        });
    }
}

// ========================================
// ABOUT BIO REVEAL
// ========================================
class BioReveal {
    constructor() {
        const bio = document.getElementById('about-bio');
        if (!bio) return;
        
        // Split into lines using Splitting.js
        const split = Splitting({ target: bio, by: 'lines' });
        const lines = bio.querySelectorAll('.line');
        
        lines.forEach((line, i) => {
            const inner = document.createElement('span');
            inner.className = 'line-inner';
            inner.textContent = line.textContent;
            line.innerHTML = '';
            line.appendChild(inner);
            
            gsap.set(inner, { clipPath: 'inset(0 0 100% 0)', scaleY: 1.2 });
            
            gsap.to(inner, {
                clipPath: 'inset(0 0 0% 0)',
                scaleY: 1,
                duration: 0.8,
                ease: 'power3.out',
                delay: i * 0.1,
                scrollTrigger: {
                    trigger: bio,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });
        });
    }
}

// ========================================
// TYPING ANIMATION FOR BADGE
// ========================================
class TypingAnimation {
    constructor() {
        this.elements = document.querySelectorAll('[data-typing], [data-typing-delayed]');
        this.init();
    }
    
    init() {
        this.elements.forEach(el => {
            const text = el.textContent;
            const isDelayed = el.hasAttribute('data-typing-delayed');
            
            el.textContent = '';
            el.style.width = '0';
            
            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                onEnter: () => {
                    setTimeout(() => {
                        this.typeText(el, text);
                    }, isDelayed ? 1500 : 0);
                },
                once: true
            });
        });
    }
    
    typeText(el, text) {
        let i = 0;
        const interval = setInterval(() => {
            el.textContent += text[i];
            el.style.width = 'auto';
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                // Remove cursor after typing
                setTimeout(() => {
                    el.style.borderRight = 'none';
                }, 1000);
            }
        }, 50);
    }
}

// ========================================
// MARQUEE SYSTEM
// ========================================
class MarqueeSystem {
    constructor() {
        this.marquees = [
            { el: document.getElementById('marquee1'), speed: 1, direction: -1 },
            { el: document.getElementById('marquee2'), speed: 1.3, direction: 1 },
            { el: document.getElementById('marquee3'), speed: 0.7, direction: -1 }
        ];
        
        this.init();
    }
    
    init() {
        this.marquees.forEach(marquee => {
            if (!marquee.el) return;
            
            const content = marquee.el.querySelector('.marquee-content');
            let position = 0;
            let isPaused = false;
            let scrollSpeed = 1;
            
            if (app.smoothScroll) {
                setInterval(() => {
                    const velocity = Math.abs(app.smoothScroll.velocity);
                    scrollSpeed = 1 + velocity * 0.1;
                }, 100);
            }
            
            const animate = () => {
                if (!isPaused) {
                    position += marquee.speed * marquee.direction * scrollSpeed;
                    const contentWidth = content.scrollWidth / 2;
                    if (Math.abs(position) >= contentWidth) {
                        position = 0;
                    }
                    content.style.transform = `translateX(${position}px)`;
                }
                requestAnimationFrame(animate);
            };
            
            animate();
            
            // Word hover effects
            const words = marquee.el.querySelectorAll('.marquee-word');
            words.forEach(word => {
                word.addEventListener('mouseenter', () => {
                    gsap.to(word, { scale: 1.15, color: '#FFE500', duration: 0.3 });
                });
                word.addEventListener('mouseleave', () => {
                    gsap.to(word, { scale: 1, color: '', duration: 0.3 });
                });
            });
            
            marquee.el.addEventListener('mouseenter', () => {
                gsap.to({ speed: scrollSpeed }, {
                    speed: 0,
                    duration: 0.5,
                    onUpdate: function() { scrollSpeed = this.targets()[0].speed; }
                });
            });
            
            marquee.el.addEventListener('mouseleave', () => {
                gsap.to({ speed: 0 }, {
                    speed: 1,
                    duration: 0.5,
                    onUpdate: function() { scrollSpeed = this.targets()[0].speed; }
                });
            });
        });
    }
}

// ========================================
// RESEARCH CARD ANIMATIONS
// ========================================
class ResearchAnimations {
    constructor() {
        this.initBulletPoints();
        this.initIACSLabel();
    }
    
    initBulletPoints() {
        const bullets = document.querySelectorAll('.bullet-point');
        
        bullets.forEach((bullet, i) => {
            ScrollTrigger.create({
                trigger: bullet,
                start: 'top 85%',
                onEnter: () => {
                    setTimeout(() => {
                        bullet.classList.add('visible');
                        // Overshoot effect
                        gsap.fromTo(bullet, 
                            { x: 5 },
                            { x: 0, duration: 0.2, delay: 0.3, ease: 'power2.out' }
                        );
                    }, i * 150);
                },
                once: true
            });
        });
    }
    
    initIACSLabel() {
        const iacsLabel = document.querySelector('.iacs-label');
        if (!iacsLabel) return;
        
        iacsLabel.addEventListener('mouseenter', () => {
            iacsLabel.classList.add('glitching');
            setTimeout(() => {
                iacsLabel.classList.remove('glitching');
            }, 300);
        });
    }
}

// ========================================
// PROJECT CARD ANIMATIONS
// ========================================
class ProjectCardAnimations {
    constructor() {
        this.injectTechSpecs();
        this.initTitleShuffle();
        this.initTags();
    }
    
    injectTechSpecs() {
        const cards = document.querySelectorAll('.project-card');
        
        const backInfoProfiles = [
            [
                { t: 'Mathematical Model', d: ['Runge-Kutta Integration', 'Schrödinger Diff Eq'] },
                { t: 'Performance', d: ['WebGL Shaders', '60 FPS Loop'] }
            ],
            [
                { t: 'Hardware Interfaces', d: ['Serial COM Ports', '10MHz Sampling Rate'] },
                { t: 'Data Processing', d: ['Real-time FFT', 'Noise Filtering'] }
            ],
            [
                { t: 'Orbital Mechanics', d: ['Keplerian Elements', 'N-body Perturbations'] },
                { t: 'API Integration', d: ['JPL Horizons Data', 'Daily Syncing'] }
            ],
            [
                { t: 'Database Architecture', d: ['PostgreSQL', 'Complex Joins'] },
                { t: 'Deployment', d: ['Docker Containers', 'CI/CD Pipeline'] }
            ]
        ];
        
        cards.forEach((card, idx) => {
            const profile = backInfoProfiles[idx % backInfoProfiles.length];
            const content = card.querySelector('.project-content');
            if (!content) return;
            
            const specsDiv = document.createElement('div');
            specsDiv.className = 'tech-specs';
            
            let html = '';
            profile.forEach(group => {
                html += `<div class="spec-group">
                            <span class="spec-title">${group.t}</span>
                            <span class="spec-items">${group.d.join(' • ')}</span>
                         </div>`;
            });
            
            specsDiv.innerHTML = html;
            
            const tags = content.querySelector('.project-tags');
            if (tags) {
                content.insertBefore(specsDiv, tags);
            } else {
                content.appendChild(specsDiv);
            }
        });
    }
    
    initTitleShuffle() {
        const titles = document.querySelectorAll('.shuffle-text');
        
        titles.forEach(title => {
            const shuffler = new TitleShuffle(title);
            const card = title.closest('.project-card');
            if (card) {
                card.addEventListener('mouseenter', () => shuffler.shuffle());
            }
        });
    }
    
    initTags() {
        const cards = document.querySelectorAll('.project-card');
        
        cards.forEach(card => {
            const tags = card.querySelectorAll('.tag');
            
            ScrollTrigger.create({
                trigger: card,
                start: 'top 80%',
                onEnter: () => {
                    tags.forEach((tag, i) => {
                        setTimeout(() => tag.classList.add('visible'), i * 80);
                    });
                },
                once: true
            });
        });
    }
}

// ========================================
// SKILLS CHAOTIC ENTRANCE
// ========================================
class SkillsChaoticEntrance {
    constructor() {
        this.headings = document.querySelectorAll('[data-chaotic]');
        this.init();
    }
    
    init() {
        this.headings.forEach(heading => {
            const text = heading.textContent;
            heading.innerHTML = '';
            
            text.split('').forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(20px)';
                heading.appendChild(span);
                
                // Random delay for chaotic feel
                const randomDelay = Math.random() * 0.5;
                
                ScrollTrigger.create({
                    trigger: heading,
                    start: 'top 85%',
                    onEnter: () => {
                        gsap.to(span, {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            delay: randomDelay + (i * 0.03),
                            ease: 'power2.out'
                        });
                    },
                    once: true
                });
            });
        });
    }
}

// ========================================
// ACHIEVEMENTS ANIMATIONS
// ========================================
class AchievementsAnimations {
    constructor() {
        this.initYearCounters();
        this.initTimelineItems();
    }
    
    initYearCounters() {
        const yearCounters = document.querySelectorAll('.year-counter');
        
        yearCounters.forEach(counter => {
            const targetYear = counter.dataset.year;
            
            counter.addEventListener('mouseenter', () => {
                let current = 0;
                const increment = Math.ceil(targetYear / 20);
                
                const interval = setInterval(() => {
                    current += increment;
                    if (current >= targetYear) {
                        current = targetYear;
                        clearInterval(interval);
                    }
                    counter.textContent = current;
                }, 20);
            });
        });
    }
    
    initTimelineItems() {
        const container = document.querySelector('.timeline');
        const items = document.querySelectorAll('.timeline-item');
        const lineDiv = document.querySelector('.timeline-line');
        const oldProgress = document.querySelector('.timeline-progress') || document.querySelector('.timeline-pulse');
        
        if (!container || !lineDiv) return;
        
        lineDiv.style.backgroundColor = 'transparent';
        if (oldProgress) oldProgress.style.display = 'none';
        
        let svg, pathActive, pathLength = 0;
        
        const drawSVG = () => {
            if (svg) svg.remove();
            const height = container.offsetHeight;
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "oscilloscope-svg");
            svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '50%';
            svg.style.transform = 'translateX(-50%)'; svg.style.width = '100px'; svg.style.height = height + 'px';
            svg.style.overflow = 'visible';
            
            let pathD = "M 50 0 ";
            items.forEach((item, i) => {
                const y = item.offsetTop + (item.offsetHeight / 2 || 15);
                const dir = (i % 2 !== 0) ? 1 : -1;
                pathD += `L 50 ${Math.max(0, y - 40)} L ${50 + dir*15} ${y - 20} L ${50 - dir*25} ${y} L ${50 + dir*10} ${y + 20} L 50 ${y + 40} `;
            });
            pathD += `L 50 ${height}`;
            
            const pathBase = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathBase.setAttribute("d", pathD);
            pathBase.setAttribute("fill", "none");
            pathBase.setAttribute("stroke", "rgba(255,255,255,0.1)");
            pathBase.setAttribute("stroke-width", "2");
            
            pathActive = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathActive.setAttribute("d", pathD);
            pathActive.setAttribute("fill", "none");
            pathActive.setAttribute("stroke", "var(--accent)");
            pathActive.setAttribute("stroke-width", "3");
            pathActive.style.filter = "drop-shadow(0 0 5px var(--accent))";
            
            svg.appendChild(pathBase); svg.appendChild(pathActive); lineDiv.appendChild(svg);
            pathLength = pathActive.getTotalLength();
            pathActive.style.strokeDasharray = pathLength;
            
            if (this.scrollTrigger) {
                pathActive.style.strokeDashoffset = pathLength * (1 - this.scrollTrigger.progress);
            } else {
                pathActive.style.strokeDashoffset = pathLength;
            }
        };
        
        drawSVG();
        window.addEventListener('resize', debounce(drawSVG, 200));
        
        this.scrollTrigger = ScrollTrigger.create({
            trigger: '.timeline',
            start: 'top 70%',
            end: 'bottom 70%',
            scrub: 1,
            onUpdate: (self) => {
                if (pathActive && pathLength) {
                    pathActive.style.strokeDashoffset = pathLength * (1 - self.progress);
                }
            }
        });
        
        items.forEach((item, index) => {
            const isLeft = index % 2 === 0;
            gsap.fromTo(item,
                { 
                    opacity: 0, 
                    x: isLeft ? -50 : 50 
                },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'back.out(1.2)',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 80%'
                    }
                }
            );
        });
    }
}

// ========================================
// CONTACT EMAIL ANIMATIONS
// ========================================
class ContactEmailAnimations {
    constructor() {
        this.email = document.getElementById('contact-email');
        if (!this.email) return;
        
        this.originalText = this.email.textContent;
        this.isRevealed = false;
        this.waveInterval = null;
        
        this.init();
    }
    
    init() {
        // Split into chars with block background
        this.email.innerHTML = '';
        this.charSpans = this.originalText.split('').map(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.dataset.char = char;
            this.email.appendChild(span);
            return span;
        });
        
        // Block reveal on scroll
        ScrollTrigger.create({
            trigger: this.email,
            start: 'top 80%',
            onEnter: () => this.blockReveal(),
            once: true
        });
        
        // Hover wave effect
        this.email.addEventListener('mouseenter', () => this.startWave());
        this.email.addEventListener('mouseleave', () => this.stopWave());
        
        // Click to copy
        this.email.addEventListener('click', () => this.copyToClipboard());
    }
    
    blockReveal() {
        this.charSpans.forEach((span, i) => {
            setTimeout(() => {
                span.style.backgroundColor = 'transparent';
                span.style.color = '#F5F5F0';
            }, i * 80);
        });
        
        setTimeout(() => {
            this.isRevealed = true;
            this.email.classList.add('revealed');
        }, this.charSpans.length * 80 + 200);
    }
    
    startWave() {
        if (!this.isRevealed) return;
        
        const wave = () => {
            this.charSpans.forEach((span, i) => {
                setTimeout(() => {
                    gsap.to(span, {
                        y: -6,
                        color: '#FFE500',
                        duration: 0.15,
                        ease: 'power2.out',
                        onComplete: () => {
                            gsap.to(span, {
                                y: 0,
                                color: '#F5F5F0',
                                duration: 0.15,
                                ease: 'power2.in'
                            });
                        }
                    });
                }, i * 25);
            });
        };
        
        wave();
        this.waveInterval = setInterval(wave, this.charSpans.length * 25 + 500);
    }
    
    stopWave() {
        if (this.waveInterval) {
            clearInterval(this.waveInterval);
            this.waveInterval = null;
        }
        
        this.charSpans.forEach(span => {
            gsap.to(span, {
                y: 0,
                color: '#F5F5F0',
                duration: 0.4,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    }
    
    copyToClipboard() {
        navigator.clipboard.writeText(this.originalText).then(() => {
            // Explode animation
            this.charSpans.forEach(span => {
                const randomX = (Math.random() - 0.5) * 400;
                const randomY = (Math.random() - 0.5) * 400;
                
                gsap.to(span, {
                    x: randomX,
                    y: randomY,
                    opacity: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });
            
            // Show COPIED!
            setTimeout(() => {
                this.email.classList.add('copied');
                
                setTimeout(() => {
                    this.email.classList.remove('copied');
                    
                    // Snap back
                    this.charSpans.forEach(span => {
                        gsap.to(span, {
                            x: 0,
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            ease: 'elastic.out(1, 0.5)'
                        });
                    });
                }, 1500);
            }, 400);
        });
    }
}

// ========================================
// PERCENTAGE COUNTER
// ========================================
class PercentageCounter {
    constructor() {
        this.element = document.querySelector('.percentage-counter');
        if (!this.element) return;
        
        this.originalText = this.element.textContent;
        this.init();
    }
    
    init() {
        this.element.addEventListener('mouseenter', () => {
            let count = 100;
            const interval = setInterval(() => {
                count -= 10;
                if (count <= 0) {
                    count = 100;
                    clearInterval(interval);
                    this.element.textContent = this.originalText;
                } else {
                    this.element.textContent = `${count}% chance I read it`;
                }
            }, 50);
        });
    }
}

// ========================================
// FOOTER LETTER DROP
// ========================================
class FooterGravityLetters {
    constructor() {
        this.footerName = document.getElementById('footer-name');
        if (!this.footerName) return;
        
        this.init();
    }
    
    init() {
        const text = this.footerName.textContent;
        this.footerName.innerHTML = '';
        
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            this.footerName.appendChild(span);
        });
        
        ScrollTrigger.create({
            trigger: this.footerName,
            start: 'top 90%',
            onEnter: () => {
                this.footerName.classList.add('dropped');
                
                const chars = this.footerName.querySelectorAll('.char');
                chars.forEach((char, i) => {
                    const mass = 1 + Math.random() * 2; // Simulated mass multiplier
                    gsap.fromTo(char,
                        { 
                            y: -150 - (Math.random() * 200), // Random starting height
                            opacity: 0,
                            scaleY: 1.1 // Slightly stretched from gravity
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scaleY: 1,
                            duration: 1.2 + (mass * 0.3), // Heavier objects bounce less + finish slightly differently
                            delay: Math.random() * 0.3 + (i * 0.02), // Chaotic drop
                            ease: 'bounce.out'
                        }
                    );
                });
            },
            once: true
        });
        
        // Liquid distortion on mouse move
        if (!CONFIG.isTouch) {
            this.footerName.addEventListener('mousemove', (e) => {
                const rect = this.footerName.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                gsap.to(this.footerName, {
                    skewX: x * 8,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            
            this.footerName.addEventListener('mouseleave', () => {
                gsap.to(this.footerName, {
                    skewX: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        }
    }
}

// ========================================
// EASTER EGG
// ========================================
class EasterEgg {
    constructor(soundSystem) {
        this.sequence = '';
        this.target = 'PHYSICS';
        this.soundSystem = soundSystem;
        this.toast = document.getElementById('easter-egg-toast');
        
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => {
            this.sequence += e.key.toUpperCase();
            
            if (this.sequence.length > this.target.length) {
                this.sequence = this.sequence.slice(-this.target.length);
            }
            
            if (this.sequence === this.target) {
                this.trigger();
            }
        });
    }
    
    trigger() {
        // Particle explosion
        this.createParticleExplosion();
        
        // Sound
        if (this.soundSystem) {
            this.soundSystem.playTone(1000, 100, 0.1, 'sine');
        }
        
        // Show toast
        if (this.toast) {
            this.toast.classList.add('show');
            setTimeout(() => {
                this.toast.classList.remove('show');
            }, 3000);
        }
    }
    
    createParticleExplosion() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            const size = 4 + Math.random() * 4;
            const angle = (Math.PI * 2 * i) / 50;
            const velocity = 100 + Math.random() * 200;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: #FFE500;
                border-radius: 50%;
            `;
            
            container.appendChild(particle);
            
            gsap.to(particle, {
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => particle.remove()
            });
        }
        
        setTimeout(() => container.remove(), 1000);
    }
}

// ========================================
// IDLE ANIMATIONS
// ========================================
class IdleAnimations {
    constructor() {
        this.heroHeading = document.getElementById('hero-heading');
        this.lastMouseMove = Date.now();
        this.isIdle = false;
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', () => {
            this.lastMouseMove = Date.now();
            if (this.isIdle) {
                this.isIdle = false;
                this.stopIdleAnimations();
            }
        }, { passive: true });
        
        setInterval(() => {
            const idleTime = Date.now() - this.lastMouseMove;
            if (idleTime > 5000 && !this.isIdle) {
                this.isIdle = true;
                this.startIdleAnimations();
            }
        }, 1000);
    }
    
    startIdleAnimations() {
        // Disabled to keep the hero heading static after first animation
        /*
        if (this.heroHeading) {
            gsap.to(this.heroHeading, {
                scale: 1.02,
                duration: 1.5,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
        */
    }
    
    stopIdleAnimations() {
        /*
        if (this.heroHeading) {
            gsap.killTweensOf(this.heroHeading);
            gsap.to(this.heroHeading, { scale: 1, duration: 0.3 });
        }
        */
    }
}

// ========================================
// SCROLL REVEALS
// ========================================
class ScrollReveals {
    constructor() {
        this.init();
    }
    
    init() {
        const intensity = CONFIG.isMobile ? CONFIG.mobileIntensity : 1;
        
        // Currently badge
        const badge = document.getElementById('currently-badge');
        if (badge) {
            gsap.to(badge, {
                scale: 1,
                duration: 0.8 * intensity,
                ease: 'elastic.out(1, 0.5)',
                scrollTrigger: {
                    trigger: badge,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        }
        
        // Education items
        gsap.utils.toArray('.education-item').forEach((item, i) => {
            gsap.from(item, {
                y: 50,
                opacity: 0,
                duration: 0.6 * intensity,
                delay: i * 0.12 * intensity,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });
        
        // Research card
        const researchCard = document.getElementById('research-card');
        if (researchCard) {
            gsap.from(researchCard, {
                y: 60,
                opacity: 0,
                duration: 0.8 * intensity,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: researchCard,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });
        }
        
        // Project cards
        gsap.utils.toArray('.project-card').forEach((card, i) => {
            gsap.from(card, {
                y: 50,
                opacity: 0,
                duration: 0.6 * intensity,
                delay: i * 0.12 * intensity,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });
        
        // Dark mode transition
        this.initDarkModeTransition();
    }
    
    initDarkModeTransition() {
        const contactSection = document.getElementById('contact');
        if (!contactSection) return;
        
        ScrollTrigger.create({
            trigger: contactSection,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1.5,
            onUpdate: (self) => {
                if (self.progress > 0.5) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            }
        });
    }
}

// ========================================
// SKILL TAG RC CIRCUIT
// ========================================
class SkillTagRC {
    constructor() {
        this.tags = document.querySelectorAll('.skill-tag');
        this.init();
    }
    
    init() {
        this.tags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                gsap.to(tag, {
                    '--rc-fill': '100%',
                    duration: 1.5,
                    ease: 'expo.out',
                    overwrite: 'auto'
                });
            });
            
            tag.addEventListener('mouseleave', () => {
                gsap.to(tag, {
                    '--rc-fill': '0%',
                    duration: 1.5,
                    ease: 'expo.out',
                    overwrite: 'auto'
                });
            });
        });
    }
}

// ========================================
// KINETIC WORD HIGHLIGHT
// ========================================
class KineticHighlight {
    constructor() {
        this.highlights = document.querySelectorAll('.kinetic-highlight');
        if (!this.highlights.length) return;
        this.init();
    }
    
    init() {
        this.highlights.forEach(el => {
            ScrollTrigger.create({
                trigger: el,
                start: 'bottom 85%',
                onEnter: () => {
                    el.classList.add('visible');
                },
                once: true
            });
        });
    }
}

// ========================================
// MAIN APP
// ========================================
class App {
    constructor() {
        this.soundSystem = null;
        this.loader = new Loader();
        this.scrollProgress = null;
        this.cursor = null;
        this.magneticElements = null;
        this.heroParticles = null;
        this.contactParticles = null;
        this.smoothScroll = null;
        this.horizontalScroll = null;
        this.navbar = null;
        this.heroNameScramble = null;
        this.heroTagline = null;
        this.marqueeSystem = null;
        this.scrollReveals = null;
        this.card3DTilt = null;
        this.contactEmail = null;
        this.footerLetterDrop = null;
        this.easterEgg = null;
        this.idleAnimations = null;
    }
    
    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.soundSystem = new SoundSystem();
        this.scrollProgress = new ScrollProgress();
        this.loader.start();
    }
    
    initAfterLoader() {
        // Core systems
        this.magneticElements = new MagneticElements(this.soundSystem);
        this.heroParticles = new MorphingParticles();
        this.contactParticles = new ContactParticles();
        this.smoothScroll = new SmoothScroll();
        this.horizontalScroll = new HorizontalScroll();
        this.navbar = new Navbar(this.soundSystem);
        
        // Hero animations
        this.heroNameScramble = new HeroNameScramble(document.getElementById('hero-heading'));
        this.heroNameScramble.start();
        this.heroTagline = new HeroTagline();
        
        // Content animations
        this.marqueeSystem = new MarqueeSystem();
        this.scrollReveals = new ScrollReveals();
        this.card3DTilt = new Card3DTilt();
        
        // Section-specific animations
        new BioReveal();
        new TypingAnimation();
        new ResearchAnimations();
        new ProjectCardAnimations();
        new SkillsChaoticEntrance();
        new AchievementsAnimations();
        new SkillTagRC();
        new KineticHighlight();
        
        // Contact & footer
        this.contactEmail = new ContactEmailAnimations();
        new PercentageCounter();
        this.footerGravity = new FooterGravityLetters();
        
        // Extras
        this.easterEgg = new EasterEgg(this.soundSystem);
        this.idleAnimations = new IdleAnimations();
        
        // Setup Typewriter Buttons
        document.querySelectorAll('.typewriter-btn').forEach(btn => {
            new TypewriterButton(btn);
        });
        
        // Hero button smooth scroll
        document.querySelectorAll('.hero-buttons a').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(btn.getAttribute('href'));
                if (target) {
                    if (this.smoothScroll) {
                        this.smoothScroll.scrollTo(target);
                    } else {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
        
        // Button click sounds
        document.querySelectorAll('.btn, .project-link').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.soundSystem) this.soundSystem.click();
            });
        });
    }
}

// ========================================
// INITIALIZE
// ========================================
const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 150);
}, { passive: true });
