import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBasketball() {
  const containerRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const targetPosRef = useRef({ x: 1.2, y: 0.2, z: 0 });
  const targetScaleRef = useRef(1.3);
  
  // Track scroll and window size to update target position and scale dynamically
  useEffect(() => {
    let scrollHeight = document.documentElement.scrollHeight;
    let innerHeight = window.innerHeight;
    let maxScroll = scrollHeight - innerHeight;
    let isMobile = window.innerWidth < 768;

    const recache = () => {
      scrollHeight = document.documentElement.scrollHeight;
      innerHeight = window.innerHeight;
      maxScroll = scrollHeight - innerHeight;
      isMobile = window.innerWidth < 768;

      // Define coordinates for the Hero state (right side on desktop, centered on mobile)
      const xHero = isMobile ? 0 : 1.25;
      const yHero = isMobile ? 0.95 : 0.15;
      const zHero = isMobile ? -0.5 : 0;
      const scaleHero = isMobile ? 1.0 : 1.35;

      // Keep the ball at the Hero position and scale so it only rotates and fades out in place
      targetPosRef.current = {
        x: xHero,
        y: yHero,
        z: zHero
      };
      targetScaleRef.current = scaleHero;
    };

    let ticking = false;

    const updateTargets = () => {
      const scrollY = window.scrollY;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      scrollProgressRef.current = progress;

      // Smoothly fade out container opacity as the user scrolls past the Hero section
      if (containerRef.current) {
        const fadeStart = 50; // start fading almost immediately when scrolling
        const fadeEnd = innerHeight * 0.65; // completely invisible by 65% height
        let opacity = 1.0;
        if (scrollY > fadeStart) {
          opacity = Math.max(0.35, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
        }
        containerRef.current.style.opacity = opacity;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateTargets);
        ticking = true;
      }
    };

    const onResize = () => {
      recache();
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    
    // Initial call to set positions correctly
    recache();
    updateTargets();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer, geometry, material, colorMap, bumpMap;
    let animationFrameId;
    let handleResize;

    try {
      // 1. Setup Scene, Camera, Renderer
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      const scene = new THREE.Scene();
      
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // 2. Procedural Basketball Texture Generator
      const createBasketballTextures = () => {
        const size = 512; // Reduced size for performance and compatibility
        
        // Color texture canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size / 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context for color map");
        
        // Bump map canvas (grayscale for depth)
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size / 2;
        const bumpCtx = bumpCanvas.getContext('2d');
        if (!bumpCtx) throw new Error("Could not get 2d context for bump map");

        // Orange base color (burnt leather orange)
        ctx.fillStyle = '#C84B1E'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Bump base (neutral middle gray/white)
        bumpCtx.fillStyle = '#E0E0E0';
        bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        // Pebble grain generation (dense grid for realistic leather)
        const rows = 100;
        const cols = 200;
        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = (c + 0.5 + (Math.random() - 0.5) * 0.4) * cellWidth;
            const y = (r + 0.5 + (Math.random() - 0.5) * 0.4) * cellHeight;
            const radius = Math.min(cellWidth, cellHeight) * 0.42;
            
            // Pebble base shadow / lighting gradient (makes it look 3D and premium)
            const pebbleGrad = ctx.createRadialGradient(x - radius * 0.15, y - radius * 0.15, 0, x, y, radius);
            pebbleGrad.addColorStop(0, '#F45D22'); // Highlights
            pebbleGrad.addColorStop(0.4, '#C84B1E'); // Burnt orange
            pebbleGrad.addColorStop(0.9, '#9E320A'); // Base shadow
            pebbleGrad.addColorStop(1.0, '#751B00'); // Edge crease
            
            ctx.fillStyle = pebbleGrad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Grayscale bump map: dome-like radial gradients
            const bumpGrad = bumpCtx.createRadialGradient(x - radius * 0.1, y - radius * 0.1, 0, x, y, radius);
            bumpGrad.addColorStop(0, '#FFFFFF');
            bumpGrad.addColorStop(0.65, '#A0A0A0');
            bumpGrad.addColorStop(1.0, '#1A1A1A');
            
            bumpCtx.fillStyle = bumpGrad;
            bumpCtx.beginPath();
            bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
            bumpCtx.fill();
          }
        }

        // Add high-frequency micro-grain noise for realistic leather pores
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let i = 0; i < 15000; i++) {
          const nx = Math.random() * canvas.width;
          const ny = Math.random() * canvas.height;
          ctx.fillRect(nx, ny, 1, 1);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 8000; i++) {
          const nx = Math.random() * canvas.width;
          const ny = Math.random() * canvas.height;
          ctx.fillRect(nx, ny, 1, 1);
        }
        
        // Also apply pores to the bump map to give physical leather depth
        bumpCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let i = 0; i < 10000; i++) {
          const nx = Math.random() * bumpCanvas.width;
          const ny = Math.random() * bumpCanvas.height;
          bumpCtx.fillRect(nx, ny, 1, 1);
        }

        // Draw Seams (Black lines)
        const drawSeams = (c, b) => {
          const w = c.width;
          const h = c.height;

          const drawLineOnCtx = (context, color, lineWidth) => {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            
            // Horizontal line (Equator)
            context.beginPath();
            context.moveTo(0, h / 2);
            context.lineTo(w, h / 2);
            context.stroke();

            // Vertical line (Prime Meridian)
            context.beginPath();
            context.moveTo(w / 4, 0);
            context.lineTo(w / 4, h);
            context.moveTo(3 * w / 4, 0);
            context.lineTo(3 * w / 4, h);
            context.stroke();

            // Left curved seam loop
            context.beginPath();
            context.moveTo(0, 0);
            context.bezierCurveTo(w * 0.18, h * 0.25, w * 0.18, h * 0.75, 0, h);
            context.stroke();

            context.beginPath();
            context.moveTo(w / 2, 0);
            context.bezierCurveTo(w * 0.32, h * 0.25, w * 0.32, h * 0.75, w / 2, h);
            context.stroke();

            // Right curved seam loop
            context.beginPath();
            context.moveTo(w / 2, 0);
            context.bezierCurveTo(w * 0.68, h * 0.25, w * 0.68, h * 0.75, w / 2, h);
            context.stroke();

            context.beginPath();
            context.moveTo(w, 0);
            context.bezierCurveTo(w * 0.82, h * 0.25, w * 0.82, h * 0.75, w, h);
            context.stroke();
          };

          // Draw black line on color map
          drawLineOnCtx(ctx, '#080808', 6);
          
          // Draw deep recessed black line on bump map (darker = deeper)
          drawLineOnCtx(bumpCtx, '#000000', 8);
        };

        drawSeams(canvas, bumpCanvas);

        return {
          colorMap: new THREE.CanvasTexture(canvas),
          bumpMap: new THREE.CanvasTexture(bumpCanvas)
        };
      };

      const textures = createBasketballTextures();
      colorMap = textures.colorMap;
      bumpMap = textures.bumpMap;

      // 3. Create Sphere (Basketball)
      geometry = new THREE.SphereGeometry(1, 64, 64);
      material = new THREE.MeshPhysicalMaterial({
        map: colorMap,
        bumpMap: bumpMap,
        bumpScale: 0.015,
        roughness: 0.45,
        metalness: 0.0,
        clearcoat: 0.18,
        clearcoatRoughness: 0.28,
        sheen: 0.8,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color('#FF5722'),
      });
      
      const ball = new THREE.Mesh(geometry, material);
      scene.add(ball);

      // Initial ball transformation
      ball.position.x = targetPosRef.current.x;
      ball.position.y = targetPosRef.current.y;
      ball.position.z = targetPosRef.current.z;
      ball.scale.setScalar(targetScaleRef.current);

      // 4. Lighting Configuration
      const ambientLight = new THREE.AmbientLight('#080e2b', 2.0);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight('#FF6D00', 8.0);
      sunLight.position.set(-5, 3, 2);
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight('#00E5FF', 5.0);
      rimLight.position.set(5, -2, -2);
      scene.add(rimLight);

      const glowLight = new THREE.PointLight('#FFA000', 4.0, 10);
      glowLight.position.set(0, 0, -2);
      scene.add(glowLight);

      // 5. Animation and Render Loop
      let lastTime = 0;
      const currentPos = { x: ball.position.x, y: ball.position.y, z: ball.position.z };
      let currentScale = ball.scale.x;

      const animate = (time) => {
        animationFrameId = requestAnimationFrame(animate);
        
        const delta = (time - lastTime) / 1000 || 0;
        lastTime = time;

        const scrollSpeed = scrollProgressRef.current * 3.0 + 0.12;
        ball.rotation.y += delta * scrollSpeed;
        ball.rotation.x += delta * 0.15;
        ball.rotation.z += delta * 0.05;

        const lerpSpeed = 0.07;
        currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPosRef.current.x, lerpSpeed);
        currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetPosRef.current.y, lerpSpeed);
        currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPosRef.current.z, lerpSpeed);
        currentScale = THREE.MathUtils.lerp(currentScale, targetScaleRef.current, lerpSpeed);

        ball.position.set(currentPos.x, currentPos.y, currentPos.z);
        ball.scale.setScalar(currentScale);

        sunLight.position.x = -5 + scrollProgressRef.current * 3;
        rimLight.position.x = 5 - scrollProgressRef.current * 3;

        renderer.render(scene, camera);
      };

      animationFrameId = requestAnimationFrame(animate);

      // 6. Handle Resizing
      handleResize = () => {
        if (!containerRef.current || !renderer) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (w < 768) {
          camera.position.z = 7.5;
        } else {
          camera.position.z = 6;
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Call on start

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (handleResize) window.removeEventListener('resize', handleResize);
        if (containerRef.current && renderer && renderer.domElement) {
          try { containerRef.current.removeChild(renderer.domElement); } catch(_) {}
        }
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (colorMap) colorMap.dispose();
        if (bumpMap) bumpMap.dispose();
        if (renderer) renderer.dispose();
      };
    } catch (e) {
      console.warn("Could not load 3D basketball. Falling back gracefully. Error:", e);
      // Ensure absolute cleanup
      cancelAnimationFrame(animationFrameId);
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer && renderer.domElement) {
        try { containerRef.current.removeChild(renderer.domElement); } catch(_) {}
      }
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (colorMap) colorMap.dispose();
      if (bumpMap) bumpMap.dispose();
      if (renderer) renderer.dispose();
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
