'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe as GlobeIcon, Radio, Cloud, Navigation } from 'lucide-react';

export default function ThreeGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('New Delhi (HQ)');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Earth Sphere Geometry
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x1e1b4b,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // Inner Core Glow
    const coreGeo = new THREE.SphereGeometry(0.96, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.15,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Orbiting Satellite Markers
    const markerGeo = new THREE.SphereGeometry(0.025, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    const nodes = [
      { lat: 28.6139, lon: 77.2090, label: 'New Delhi (HQ)' },
      { lat: 37.7749, lon: -122.4194, label: 'San Francisco (US-West)' },
      { lat: 51.5074, lon: -0.1278, label: 'London (EU-Central)' },
      { lat: 1.3521, lon: 103.8198, label: 'Singapore (AP-South)' },
    ];

    nodes.forEach(n => {
      const phi = (90 - n.lat) * (Math.PI / 180);
      const theta = (n.lon + 180) * (Math.PI / 180);
      const x = -(Math.sin(phi) * Math.cos(theta));
      const z = Math.sin(phi) * Math.sin(theta);
      const y = Math.cos(phi);

      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, y, z);
      globeMesh.add(marker);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      globeMesh.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[300px] bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md overflow-hidden flex flex-col justify-between">
      {/* HUD Header */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <GlobeIcon className="w-4 h-4" />
          <span>LIVE 3D GLOBE (THREE.JS)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Radio className="w-3 h-3 animate-ping" /> SATELLITE LIVE
          </span>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* HUD Bottom Info Bar */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 text-slate-300">
          <span className="flex items-center gap-1 text-yellow-400">
            <Cloud className="w-3.5 h-3.5" /> 28°C Clear
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Navigation className="w-3.5 h-3.5" /> {selectedNode}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">60 FPS • 4 Global Swarm Nodes</span>
      </div>
    </div>
  );
}
