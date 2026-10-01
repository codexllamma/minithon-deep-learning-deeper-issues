import { useState, useEffect, useRef } from 'react';
import SimCityMap from './components/SimCityMap';
import { runSimulation } from './logic';
import { Factory, Activity } from 'lucide-react';
import type { FacilityData, RouteData } from './types';

export default function App() {
  // 1. Inputs
  const [wasteGeneration, setWasteGeneration] = useState(500);
  const [sortingCapacity, setSortingCapacity] = useState(300);
  const [fleetSize, setFleetSize] = useState(20);
  
  // 2. Outputs (Map Data)
  const [mapData, setMapData] = useState<{ facilities: FacilityData[], routes: RouteData[] }>({ facilities: [], routes: [] });
  
  // 3. Interaction State
  const [isOptimizing, setIsOptimizing] = useState(true); // Start true to load initial data
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Prevent spamming the simulation while dragging the slider
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // START INTERACTION: Blur map, show terminal
    setIsOptimizing(true);
    setTerminalLogs([
      "Building JSON graph payload...",
      `Waste: ${wasteGeneration}t | Sorting: ${sortingCapacity}t | Fleet: ${fleetSize}`
    ]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // RUN INTERACTION: Fake network delay for the "Hacker" effect
    timeoutRef.current = setTimeout(() => {
      setTerminalLogs(prev => [...prev, "POST /api/optimize (Awaiting Python Backend)..."]);
      
      setTimeout(() => {
        // TEMP: Running local simulation until backend is wired up
        // Note: runSimulation will be replaced by axios.post(payload)
        const result = runSimulation(wasteGeneration, sortingCapacity, 1.0); // We will update this later to pass the new variables
        
        if (result.hasBottleneck) {
          setTerminalLogs(prev => [...prev, ` WARNING: Capacity deficit. ${result.spillover}t bypassing to landfill.`]);
        } else {
          setTerminalLogs(prev => [...prev, " SUCCESS: Optimal flow achieved. No spillover."]);
        }

        setTimeout(() => {
          // END INTERACTION: Update map data, close terminal, unblur map
          setMapData({ facilities: result.facilities, routes: result.routes });
          setIsOptimizing(false);
        }, 800); 
        
      }, 600); 
    }, 400); 

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [wasteGeneration, sortingCapacity, fleetSize]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '360px', padding: '24px', background: 'white', borderRight: '1px solid #e2e8f0', zIndex: 10 }}>
        <h2><Activity size={24} color="#2563eb" /> Network Optimizer</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginTop: '20px' }}>
          
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Factory size={16}/> Panvel Waste Gen</span>
              <span>{wasteGeneration} t/day</span>
            </label>
            <input 
              type="range" min="100" max="1000" step="50" 
              value={wasteGeneration} 
              onChange={(e) => setWasteGeneration(Number(e.target.value))} 
              style={{ width: '100%' }} 
            />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Factory size={16}/> Taloja Sorting Max</span>
              <span>{sortingCapacity} t/day</span>
            </label>
            <input 
              type="range" min="100" max="800" step="50" 
              value={sortingCapacity} 
              onChange={(e) => setSortingCapacity(Number(e.target.value))} 
              style={{ width: '100%' }} 
            />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16}/> Kharghar Fleet Size</span>
              <span>{fleetSize} Trucks</span>
            </label>
            <input 
              type="range" min="5" max="50" step="1" 
              value={fleetSize} 
              onChange={(e) => setFleetSize(Number(e.target.value))} 
              style={{ width: '100%' }} 
            />
          </div>

        </div>
      </div>

      {/* 3D CANVAS AREA */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* TERMINAL OVERLAY */}
        {isOptimizing && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: '8px',
            padding: '20px', width: '420px', zIndex: 100, color: '#10b981', fontFamily: 'monospace',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)'
          }}>
            <div style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>system@optimizer:~#</span>
              <Activity size={16} className="animate-pulse" />
            </div>
            {terminalLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', color: log.includes('WARNING') ? '#ef4444' : '#10b981' }}>
                {'>'} {log}
              </div>
            ))}
          </div>
        )}

        {/* 3D MAP */}
        <SimCityMap 
          facilities={mapData.facilities} 
          routes={mapData.routes} 
          isOptimizing={isOptimizing} 
        />
      </div>
    </div>
  );
}