import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Grid, Clone, useGLTF, QuadraticBezierLine } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AlertTriangle, Factory, Home, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import type { FacilityData, RouteData } from '../types';

// 1. LOCK ASSETS IN VRAM (Fires immediately on page load)
// Updated file paths to exactly match the available .glb files in /public/models/
useGLTF.preload('/models/low_poly_home.glb');
useGLTF.preload('/models/factory_draco.glb');
useGLTF.preload('/models/garbage_pile_draco.glb');
useGLTF.preload('/models/garbage_truck_draco.glb');

interface RouteProps {
  start: number[];
  end: number[];
  isBottleneck: boolean;
  traffic: number;
}

// 2. ANIMATED ROUTE & TRUCK COMPONENT
const AnimatedRoute: React.FC<RouteProps> = ({ start, end, isBottleneck, traffic }) => {
  const lineRef = useRef<any>(null);
  const truckRef = useRef<any>(null);
  const { scene: truckModel } = useGLTF('/models/garbage_truck_draco.glb');

  // Create the mathematical path for the truck to follow
  const curve = useMemo(() => {
    const midPoint = [(start[0] + end[0]) / 2, 0.05, start[2]];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(start[0], 0.05, start[2]),
      new THREE.Vector3(midPoint[0], midPoint[1], midPoint[2]),
      new THREE.Vector3(end[0], 0.05, end[2])
    );
  }, [start, end]);

  // Animate dashed lines and truck movement
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Animate glowing flow lines
    if (lineRef.current) lineRef.current.material.dashOffset -= delta * 3;
    
    // Animate Truck along the curve (speed affected by traffic slider)
    if (truckRef.current) {
      const progress = (time * (0.2 / traffic)) % 1; // Loops from 0 to 1
      const position = curve.getPoint(progress);
      const tangent = curve.getTangent(progress);
      
      truckRef.current.position.copy(position);
      // Make the truck face the direction of travel
      const target = position.clone().add(tangent);
      truckRef.current.lookAt(target);
    }
  });

  return (
    <group>
      {/* The Glowing Route on the ground */}
      <QuadraticBezierLine
        ref={lineRef}
        start={[start[0], 0.05, start[2]]}
        end={[end[0], 0.05, end[2]]}
        mid={[(start[0] + end[0]) / 2, 0.05, start[2]]}
        color={isBottleneck ? new THREE.Color(4, 0.1, 0.1) : new THREE.Color(0.1, 0.5, 4)}
        lineWidth={isBottleneck ? 5 : 3}
        dashed dashScale={4} dashSize={2} dashOffset={0}
        toneMapped={false}
      />
      {/* The instanced Truck */}
      <group ref={truckRef}>
        <Clone object={truckModel} scale={[0.003, 0.003, 0.003]} />
      </group>
    </group>
  );
};

interface FacilityProps {
  fac: FacilityData;
  onNodeClick?: (fac: FacilityData) => void;
}

// 3. STATIC FACILITY COMPONENT
const FacilityNode: React.FC<FacilityProps> = ({ fac, onNodeClick }) => {
  const { scene: zoneScene } = useGLTF('/models/low_poly_home.glb');
  const { scene: factoryScene } = useGLTF('/models/factory_draco.glb');
  const { scene: landfillScene } = useGLTF('/models/garbage_pile_draco.glb');

  // Determine model, scaling, and UI icons based on Node Type
  const { model, dynamicScale, icon: Icon } = useMemo(() => {
    switch(fac.type) {
      case 'landfill':
        return { model: landfillScene, dynamicScale: [0.05, 0.05 + (fac.utilization_percent / 500), 0.05], icon: Trash2 };
      case 'zone':
        return { model: zoneScene, dynamicScale: [0.25, 0.25, 0.25], icon: Home };
      case 'sorting':
      case 'transfer':
      default:
        return { model: factoryScene, dynamicScale: [1, 1, 1], icon: Factory };
    }
  }, [fac.type, fac.utilization_percent, zoneScene, factoryScene, landfillScene]);

  return (
    <group position={fac.coords as [number, number, number]} onClick={(e) => { e.stopPropagation(); if (onNodeClick) onNodeClick(fac); }}>
      
      <Clone object={model} scale={dynamicScale as [number, number, number]} />

      {/* Emissive Holographic Warning Box if Choked */}
      {fac.is_choked && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#ff0000" wireframe emissive="#ff0000" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}

      {/* Floating HTML UI Card */}
      <Html position={[0, fac.type === 'landfill' ? 8 : (fac.type === 'zone' ? 3 : 6), 0]} center zIndexRange={[100, 0]}>
        <div style={{
          background: fac.is_choked ? 'rgba(254, 226, 226, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${fac.is_choked ? '#ef4444' : '#cbd5e1'}`,
          borderRadius: '8px', padding: '10px', width: '140px',
          boxShadow: fac.is_choked ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 8px 20px rgba(0,0,0,0.15)', 
          fontFamily: 'system-ui', pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: fac.is_choked ? '#991b1b' : '#0f172a' }}>
            {fac.is_choked ? <AlertTriangle size={16} /> : <Icon size={16} />}
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{fac.name}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: '#e2e8f0', marginTop: '6px' }}>
            <div style={{ height: '100%', background: fac.is_choked ? '#ef4444' : '#3b82f6', width: `${Math.min(fac.utilization_percent, 100)}%` }} />
          </div>
        </div>
      </Html>
    </group>
  );
};

interface SimCityMapProps {
  facilities: FacilityData[];
  routes: RouteData[];
  isOptimizing: boolean;
  onNodeClick?: (fac: FacilityData) => void;
}

// 4. MASTER CANVAS
const SimCityMap: React.FC<SimCityMapProps> = ({ facilities, routes, isOptimizing, onNodeClick }) => {
  return (
    <div style={{ width: '100%', height: '100%', filter: isOptimizing ? 'grayscale(100%) blur(4px)' : 'none', transition: 'all 0.3s' }}>
      <Canvas camera={{ position: [20, 20, 20], fov: 40 }} shadows>
        
        {/* Dark lighting makes the Bloom pop */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 20, 10]} intensity={0.5} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        
        {/* City Floor Grid */}
        <Grid position={[0, -0.01, 0]} args={[50, 50]} cellSize={1} cellThickness={1} cellColor="#e2e8f0" sectionSize={5} sectionThickness={1.5} sectionColor="#cbd5e1" fadeDistance={30} />

        {/* Generate Static Elements */}
        {facilities.map((fac) => (
          <FacilityNode key={fac.id} fac={fac} onNodeClick={onNodeClick} />
        ))}
        {routes.map((route) => (
          <AnimatedRoute 
            key={route.id} 
            start={route.source_coords} 
            end={route.target_coords} 
            isBottleneck={route.is_bottleneck} 
            traffic={(route as any).traffic || 1} 
          />
        ))}

        {/* The Cyberpunk Glow */}
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
      </Canvas>
    </div>
  );
};

export default React.memo(SimCityMap);
