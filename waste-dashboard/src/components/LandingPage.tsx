import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll, useGLTF, Environment, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function StaticModel({ path, scale, position, rotation }: { path: string, scale: number, position: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(path);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clonedScene} scale={scale} position={position} rotation={rotation || [0, 0, 0]} />;
}

function SceneEnvironment() {
  const group = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (!group.current) return;
    const r1 = scroll.offset;
    // Move the entire environment backward (towards the camera) as the user scrolls down,
    // giving the illusion of continuous forward motion for the truck.
    group.current.position.z = THREE.MathUtils.lerp(0, 15, r1);
    group.current.position.x = THREE.MathUtils.lerp(0, 2, r1);
  });

  return (
    <group ref={group}>
      {/* The Road */}
      <StaticModel path="/models/low_road_draco.glb" scale={0.5} position={[0, -1.1, -10]} rotation={[0, Math.PI / 2, 0]} />

      {/* Homes */}
      <StaticModel path="/models/low_poly_home.glb" scale={0.5} position={[4, -1, -5]} rotation={[0, -Math.PI / 4, 0]} />
      <StaticModel path="/models/low_poly_home.glb" scale={0.5} position={[6, -1, -15]} rotation={[0, -Math.PI / 3, 0]} />
      
      {/* Dumpsters and Garbage */}
      <StaticModel path="/models/dumpsters_draco.glb" scale={0.005} position={[3, -1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <StaticModel path="/models/dumpster_single_draco.glb" scale={0.005} position={[3.5, -1, -8]} rotation={[0, -Math.PI / 4, 0]} />
      <StaticModel path="/models/garbage_pile_draco.glb" scale={0.005} position={[-4, -1, 8]} />
      
      {/* Factories */}
      <StaticModel path="/models/low_poly_factory.glb" scale={0.5} position={[-6, -1, -25]} rotation={[0, Math.PI / 4, 0]} />
      <StaticModel path="/models/factory_draco.glb" scale={0.005} position={[5, -1, -28]} rotation={[0, -Math.PI / 6, 0]} />
      
      {/* Other Vehicles */}
      <StaticModel path="/models/dump_truck_draco.glb" scale={0.005} position={[-3, -1, -10]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

function TruckModel(props: any) {
  const { scene } = useGLTF('/models/garbage_truck_draco.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const group = useRef<THREE.Group>(null);
  const scroll = useScroll();
  
  const prevOffset = useRef(0);
  const isScrollingBack = useRef(false);
  const currentRotation = useRef(Math.PI);

  useFrame((state) => {
    if (!group.current) return;

    // r1 is the scroll progress from 0 to 1
    const r1 = scroll.offset;
    
    // Update direction only if actually scrolling (prevents snapping when stopped)
    if (Math.abs(r1 - prevOffset.current) > 0.001) {
      isScrollingBack.current = r1 < prevOffset.current;
    }
    prevOffset.current = r1;

    let pathRot = 0;

    // Path logic based purely on scroll progress
    // Section 1 (0 - 0.33)
    if (r1 < 0.33) {
      const p = r1 / 0.33; 
      group.current.position.x = THREE.MathUtils.lerp(1, 0, p);
      group.current.position.z = THREE.MathUtils.lerp(1, 0, p);
      pathRot = THREE.MathUtils.lerp(Math.PI / 6, 0, p);
    } 
    // Section 2 (0.33 - 0.66)
    else if (r1 < 0.66) {
      const p = (r1 - 0.33) / 0.33;
      group.current.position.x = THREE.MathUtils.lerp(0, -1, p);
      group.current.position.z = THREE.MathUtils.lerp(0, 0, p);
      pathRot = THREE.MathUtils.lerp(0, -Math.PI / 8, p);
    } 
    // Section 3 (0.66 - 1)
    else {
      const p = (r1 - 0.66) / 0.34;
      group.current.position.x = THREE.MathUtils.lerp(-1, -2, p);
      group.current.position.z = THREE.MathUtils.lerp(0, -2, p);
      pathRot = THREE.MathUtils.lerp(-Math.PI / 8, -Math.PI / 4, p);
    }

    // Base rotation: Math.PI means facing away from camera (forward in the world)
    const baseRot = isScrollingBack.current ? 0 : Math.PI;
    
    // Smoothly turn the truck around
    currentRotation.current = THREE.MathUtils.lerp(currentRotation.current, baseRot, 0.05);
    
    // Combine base rotation with the weaving path rotation
    group.current.rotation.y = currentRotation.current + pathRot;

    // Chassis bounce
    group.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.03 - 1; 
  });

  return (
    <group ref={group} {...props}>
      <primitive object={clonedScene} scale={0.005} />
    </group>
  );
}

// Preload the models
useGLTF.preload('/models/garbage_truck_draco.glb');
useGLTF.preload('/models/low_poly_home.glb');
useGLTF.preload('/models/low_poly_factory.glb');
useGLTF.preload('/models/dumpsters_draco.glb');
useGLTF.preload('/models/garbage_pile_draco.glb');
useGLTF.preload('/models/low_road_draco.glb');
useGLTF.preload('/models/dump_truck_draco.glb');
useGLTF.preload('/models/dumpster_single_draco.glb');
useGLTF.preload('/models/factory_draco.glb');

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#ffffff', color: '#0f172a', overflow: 'hidden', margin: 0, padding: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#4ade80" />
        <directionalLight position={[-10, 10, -5]} intensity={1} color="#3b82f6" />
        <Environment preset="city" />

        <ScrollControls pages={3} damping={0.2}>
          {/* Entire Environment Moves */}
          <SceneEnvironment />
          
          {/* Moving Truck Model */}
          <TruckModel />

          <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#2563eb" />
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />

          {/* HTML Overlay */}
          <Scroll html style={{ width: '100%' }}>
            {/* Page 1: Hero */}
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10vw' }}>
              <h1 style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #16a34a, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Next-Gen <br /> Waste Routing
              </h1>
              <p style={{ fontSize: '1.5rem', maxWidth: '600px', color: '#475569', marginBottom: '2rem' }}>
                Optimize your fleet, reduce emissions, and streamline transfer station logistics with our AI-powered Min-Cost Max-Flow routing engine.
              </p>
            </div>

            {/* Page 2: Feature */}
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', padding: '0 10vw', textAlign: 'right' }}>
              <h2 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
                Smart & <span style={{ color: '#2563eb' }}>Dynamic</span>
              </h2>
              <p style={{ fontSize: '1.25rem', maxWidth: '500px', color: '#475569' }}>
                Real-time tracking of thousands of tons of waste. Prevent bottlenecks and spillovers before they happen. Watch your efficiency skyrocket.
              </p>
            </div>

            {/* Page 3: CTA */}
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 10vw', textAlign: 'center' }}>
              <h2 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '2rem', color: '#0f172a' }}>
                Ready to optimize?
              </h2>
              <button
                onClick={onEnter}
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 8px 10px -6px rgba(37, 99, 235, 0.5)',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                Launch Dashboard
              </button>
            </div>
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
