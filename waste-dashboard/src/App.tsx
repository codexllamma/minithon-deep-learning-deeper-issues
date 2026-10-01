import { useState, useEffect } from 'react';
import { Settings, Zap, Truck, AlertOctagon } from 'lucide-react';
import UltimateSimCity from './components/UltimateSimCity';
import { denseCityData, denseRouteData } from './data';
import { runSimulation } from './logic';

export default function Dashboard() {
  // --- SCENARIO STATES ---
  const [traffic, setTraffic] = useState(1.0);
  const [emissions, setEmissions] = useState(1.0);
  const [wasteVolume, setWasteVolume] = useState(1.0);
  
  // --- GRAPH STATES ---
  const [facilities, setFacilities] = useState(denseCityData);
  const [routes, setRoutes] = useState(denseRouteData);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // --- THE FASTAPI CONNECTION ---
  useEffect(() => {
    const runOptimization = async () => {
      setIsOptimizing(true);
      try {
        // Apply the Waste Volume multiplier to the base demand before sending
        const adjustedNodes = denseCityData.map(node => ({
          ...node,
          demand: node.type === 'zone' ? Math.round(-500 * wasteVolume) : 0 // Example base demand
        }));

        const payload = {
          nodes: adjustedNodes,
          links: denseRouteData,
          global_traffic_multiplier: traffic,
          global_emissions_factor: emissions
        };

        const response = await fetch('http://localhost:8000/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        // Update the 3D map with the math engine's results!
        if (result.status === "success") {
          setFacilities(result.nodes); 
          setRoutes(result.links);     
        }
      } catch (error) {
        console.error("Backend offline or failed:", error);
        
        // FALLBACK FOR DEMO: Simulate backend logic locally if FastAPI isn't running
        // We pass wasteVolume multiplier into our existing mock engine
        const mockBaseWaste = 5000;
        const mockResult = runSimulation(mockBaseWaste * wasteVolume, 3500, traffic);
        setFacilities(mockResult.facilities);
        setRoutes(mockResult.routes);
      } finally {
        setIsOptimizing(false);
      }
    };

    // Debounce the API call slightly so dragging a slider doesn't spam the backend
    const timeoutId = setTimeout(() => runOptimization(), 300);
    return () => clearTimeout(timeoutId);
  }, [traffic, emissions, wasteVolume]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
      {/* THE 3D MAP */}
      <UltimateSimCity 
        facilities={facilities} 
        routes={routes} 
        isOptimizing={isOptimizing} 
        onNodeClick={(fac) => console.log("Clicked:", fac)}
      />

      {/* THE SCENARIO CONTROL PANEL */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px', width: '320px',
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'system-ui'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <Settings size={20} color="#0f172a" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>What-If Scenarios</h2>
        </div>

        {/* Traffic Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={14}/> Traffic Congestion</span>
            <span>{traffic.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="1.0" max="3.0" step="0.1" value={traffic} 
            onChange={(e) => setTraffic(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
        </div>

        {/* Emissions / Fleet Efficiency Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14}/> Fleet Emissions (EV)</span>
            <span>{emissions.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="0.5" max="2.0" step="0.1" value={emissions} 
            onChange={(e) => setEmissions(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
        </div>

        {/* Waste Volume Spike Slider */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertOctagon size={14}/> Festival Waste Spike</span>
            <span>+{Math.round((wasteVolume - 1) * 100)}%</span>
          </div>
          <input 
            type="range" min="1.0" max="1.5" step="0.05" value={wasteVolume} 
            onChange={(e) => setWasteVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#ef4444' }}
          />
        </div>

        {isOptimizing && (
          <div style={{ marginTop: '15px', fontSize: '12px', color: '#3b82f6', textAlign: 'center', fontWeight: 'bold' }}>
            Recalculating Min-Cost Max-Flow...
          </div>
        )}
      </div>

    </div>
  );
}