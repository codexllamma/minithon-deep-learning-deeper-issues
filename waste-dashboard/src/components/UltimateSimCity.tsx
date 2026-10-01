import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Grid, Clone, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AlertTriangle, Factory, Home, Trash2, ZoomIn, ZoomOut, Hand, MousePointer2, Focus } from 'lucide-react';
import * as THREE from 'three';
import type { FacilityData, RouteData } from '../types';

// --- ASSET PRELOADING ---
useGLTF.preload('/models/low_poly_home.glb');
useGLTF.preload('/models/factory_draco.glb');
useGLTF.preload('/models/garbage_pile_draco.glb');
useGLTF.preload('/models/garbage_truck_draco.glb');
useGLTF.preload('/models/dump_truck_draco.glb');
// Note: low_road_draco.glb is missing, so we use a native ThreeJS plane below!

// ---------------------------------------------------------
// CENTRALIZED SCALING & POSITION CONFIGURATION
// ---------------------------------------------------------
const MODEL_CONFIG = {
  truck: {
    // Drastically shrunk so wheels match factory doors
    scale: [0.008, 0.008, 0.008] as [number, number, number]
  },
  zone: {
    // Pumped up from 0.15 so houses don't look like monopoly pieces
    scale: 0.4,
    // Pushed apart from 1.5 to 2.5 so the larger models don't clip
    spacing: 2.5,
    // Lifted the UI card slightly higher
    yOffset: 6
  },
  factory: {
    // Base factory scale
    scale: 1.0,
    yOffset: 8
  },
  landfill: {
    // Base garbage mountain scale
    scale: 0.05,
    yOffset: 9
  }
};

interface RouteProps {
  start: number[];
  end: number[];
  isBottleneck: boolean;
  traffic: number;
  isHighway?: boolean;
  flowVolume: number;
}

// --- HIGHWAY & LOCAL ROUTE LOGIC ---
const GridRoute: React.FC<RouteProps> = ({ start, end, isBottleneck, traffic, isHighway, flowVolume }) => {
  const truckRef = useRef<any>(null);
  
  // Choose truck and scale road width based on Highway status
  const { scene: truckModel } = useGLTF(isHighway ? '/models/dump_truck_draco.glb' : '/models/garbage_truck_draco.glb');
  const roadWidth = isHighway ? 1.2 : 0.6; // Highways are twice as wide

  const line = useMemo(() => new THREE.LineCurve3(
    new THREE.Vector3(start[0], 0.05, start[2]), 
    new THREE.Vector3(end[0], 0.05, end[2])
  ), [start, end]);

  const roadMath = useMemo(() => {
    const distance = new THREE.Vector3(start[0], 0, start[2]).distanceTo(new THREE.Vector3(end[0], 0, end[2]));
    const midPoint = [(start[0] + end[0]) / 2, 0, (start[2] + end[2]) / 2];
    const angle = Math.atan2(end[0] - start[0], end[2] - start[2]);
    return { distance, midPoint, angle };
  }, [start, end]);

  useFrame((state) => {
    if (truckRef.current) {
      const speed = isHighway ? 0.35 : 0.15; // Dump trucks on highways drive faster
      const progress = (state.clock.getElapsedTime() * (speed / traffic)) % 1;
      
      const position = line.getPoint(progress);
      truckRef.current.position.copy(position);
      truckRef.current.lookAt(position.clone().add(line.getTangent(progress)));
    }
  });

  return (
    <group>
      {/* Physical Road Base - Native Box */}
      <mesh position={roadMath.midPoint as [number, number, number]} rotation={[0, roadMath.angle, 0]}>
        <boxGeometry args={[roadWidth, 0.05, roadMath.distance]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* Glowing Neon Flow Line (Intensity > 1 triggers Bloom) */}
      {flowVolume > 0 && (
        <mesh>
          <tubeGeometry args={[line as any, 20, isBottleneck ? 0.4 : 0.2, 8, false]} />
          <meshBasicMaterial 
            color={isBottleneck ? new THREE.Color(4, 0, 0) : new THREE.Color(0, 1.5, 4)} 
            toneMapped={false} 
            transparent opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Animated Truck */}
      {flowVolume > 0 && (
        <group ref={truckRef}>
          <Clone object={truckModel} scale={MODEL_CONFIG.truck.scale} />
        </group>
      )}
    </group>
  );
};

interface FacilityProps {
  fac: FacilityData;
  onNodeClick?: (fac: FacilityData) => void;
}

// --- CITY BLOCKS & FACILITIES ---
const FacilityNode: React.FC<FacilityProps> = ({ fac, onNodeClick }) => {
  const { scene: zoneScene } = useGLTF('/models/low_poly_home.glb');
  const { scene: factoryScene } = useGLTF('/models/factory_draco.glb');
  const { scene: landfillScene } = useGLTF('/models/garbage_pile_draco.glb');

  const { elements, icon: Icon, yOffset } = useMemo(() => {
    const dynamicGrowth = 1 + (fac.utilization_percent / 100);

    switch(fac.type) {
      case 'zone':
        const zS = MODEL_CONFIG.zone.scale;
        const zSp = MODEL_CONFIG.zone.spacing;
        return { 
          elements: [
            { model: zoneScene, pos: [-zSp, 0, -zSp], scale: [zS, zS * dynamicGrowth, zS] },
            { model: zoneScene, pos: [zSp, 0, -zSp], scale: [zS, zS * dynamicGrowth, zS] },
            { model: zoneScene, pos: [-zSp, 0, zSp], scale: [zS, zS * dynamicGrowth, zS] },
            { model: zoneScene, pos: [zSp, 0, zSp], scale: [zS, zS * dynamicGrowth, zS] }
          ], 
          icon: Home, yOffset: MODEL_CONFIG.zone.yOffset 
        };
      case 'sorting':
      case 'transfer':
        const fS = MODEL_CONFIG.factory.scale;
        return { 
          elements: [
            { model: factoryScene, pos: [-2, 0, 0], scale: [fS, fS * dynamicGrowth, fS] },
            { model: factoryScene, pos: [2, 0, 0], scale: [fS, fS * dynamicGrowth, fS] }
          ], 
          icon: Factory, yOffset: MODEL_CONFIG.factory.yOffset 
        };
      case 'landfill':
      default:
        const lS = MODEL_CONFIG.landfill.scale;
        const dynamicY = lS * (1 + (fac.utilization_percent / 500));
        return { 
          elements: [
            { model: landfillScene, pos: [0, 0, 0], scale: [lS, dynamicY, lS] }
          ], 
          icon: Trash2, yOffset: MODEL_CONFIG.landfill.yOffset + (dynamicY * 5) 
        };
    }
  }, [fac.type, fac.utilization_percent, zoneScene, factoryScene, landfillScene]);

  return (
    <group position={fac.coords as [number, number, number]} onClick={(e) => { e.stopPropagation(); if(onNodeClick) onNodeClick(fac); }}>
      {elements.map((el, i) => (
        <Clone key={i} object={el.model} position={el.pos as [number, number, number]} scale={el.scale as [number, number, number]} />
      ))}

      {/* Holographic Choke Warning Box */}
      {fac.is_choked && (
        <mesh position={[0, yOffset / 2, 0]}>
          <boxGeometry args={[7, yOffset, 7]} />
          <meshStandardMaterial color="#ef4444" wireframe emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}

      {/* Light Theme UI Cards */}
      <Html position={[0, yOffset, 0]} center zIndexRange={[100, 0]}>
        <div style={{
          background: fac.is_choked ? 'rgba(254, 226, 226, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${fac.is_choked ? '#ef4444' : '#cbd5e1'}`,
          borderRadius: '8px', padding: '12px', width: '160px',
          boxShadow: fac.is_choked ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 10px 25px rgba(0,0,0,0.1)', 
          fontFamily: 'system-ui', pointerEvents: 'none', color: fac.is_choked ? '#991b1b' : '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {fac.is_choked ? <AlertTriangle size={18} color="#dc2626" /> : <Icon size={18} color="#3b82f6" />}
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{fac.name}</span>
          </div>
          <div style={{ fontSize: '12px', color: fac.is_choked ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
            {Math.round(fac.utilization_percent)}% Capacity
          </div>
          <div style={{ width: '100%', height: '5px', background: '#e2e8f0', marginTop: '8px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: fac.is_choked ? '#ef4444' : '#3b82f6', width: `${Math.min(fac.utilization_percent, 100)}%` }} />
          </div>
        </div>
      </Html>
    </group>
  );
};

interface UltimateSimCityProps {
  facilities: FacilityData[];
  routes: RouteData[];
  isOptimizing: boolean;
  onNodeClick?: (fac: FacilityData) => void;
}

// --- MASTER DAYTIME VIEWPORT ---
const UltimateSimCity: React.FC<UltimateSimCityProps> = ({ facilities, routes, isOptimizing, onNodeClick }) => {
  const controlsRef = useRef<any>(null);
  const [isPanMode, setIsPanMode] = useState(false);

  // Math-based Camera Controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      const step = direction === 'in' ? 0.3 : -0.4;
      
      // Interpolate camera position towards or away from the target
      camera.position.lerp(target, step);
      controlsRef.current.update();
    }
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.set(140, 120, 140);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', filter: isOptimizing ? 'grayscale(60%)' : 'none', transition: 'all 0.3s' }}>
      <Canvas camera={{ position: [140, 120, 140], fov: 35 }} shadows>
        
        {/* Light Theme Environment Setup */}
        <color attach="background" args={['#f1f5f9']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[50, 100, 50]} intensity={1.5} color="#ffffff" />
        
        {/* Dynamic Mouse Mapping: Swap between Rotate and Pan based on UI state */}
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2}
          mouseButtons={{
            LEFT: isPanMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
          }}
        />
        
        {/* Crisp Daylight Floor Grid */}
        <Grid 
          position={[0, -0.1, 0]} 
          args={[600, 600]} 
          cellSize={5} cellThickness={1} cellColor="#cbd5e1" 
          sectionSize={25} sectionThickness={2} sectionColor="#94a3b8" 
          fadeDistance={300} 
        />

        {facilities.map((fac) => <FacilityNode key={fac.id} fac={fac} onNodeClick={onNodeClick} />)}
        
        {routes.map((route) => (
          <GridRoute 
            key={route.id} 
            start={route.source_coords} 
            end={route.target_coords} 
            isBottleneck={route.is_bottleneck} 
            traffic={route.traffic_multiplier || 1.0}
            // Explicit highway flag for styling and truck model
            isHighway={route.is_highway} 
            flowVolume={route.flow_volume}
          />
        ))}

        {/* High Threshold Bloom: Only elements with color values > 1.2 will glow */}
        <EffectComposer>
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
        
      </Canvas>

      {/* MAP NAVIGATION TOOLBAR (Floating Bottom Right) */}
      <div style={{
        position: 'absolute', bottom: '30px', right: '30px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)',
        padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10
      }}>
        <button onClick={() => handleZoom('in')} title="Zoom In" style={btnStyle}><ZoomIn size={20} color="#0f172a" /></button>
        <button onClick={() => handleZoom('out')} title="Zoom Out" style={btnStyle}><ZoomOut size={20} color="#0f172a" /></button>
        <div style={{ width: '100%', height: '1px', background: '#cbd5e1', margin: '4px 0' }} />
        <button 
          onClick={() => setIsPanMode(false)} title="Rotate Tool" 
          style={{ ...btnStyle, background: !isPanMode ? '#e0e7ff' : 'transparent' }}
        >
          <MousePointer2 size={20} color={!isPanMode ? '#3b82f6' : '#0f172a'} />
        </button>
        <button 
          onClick={() => setIsPanMode(true)} title="Pan Tool" 
          style={{ ...btnStyle, background: isPanMode ? '#e0e7ff' : 'transparent' }}
        >
          <Hand size={20} color={isPanMode ? '#3b82f6' : '#0f172a'} />
        </button>
        <div style={{ width: '100%', height: '1px', background: '#cbd5e1', margin: '4px 0' }} />
        <button onClick={resetCamera} title="Reset View" style={btnStyle}><Focus size={20} color="#0f172a" /></button>
      </div>
    </div>
  );
};

const btnStyle = {
  background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
};

export default React.memo(UltimateSimCity);
