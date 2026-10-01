import { useState, useEffect } from 'react';
import { Settings, Zap, Truck, AlertOctagon, Leaf, Lightbulb, Activity, CheckCircle, Play, Loader2, Map, Cpu, X, Maximize2 } from 'lucide-react';
import UltimateSimCity from './components/UltimateSimCity';
import { smallCityNodes, smallCityRoutes, bigCityNodes, bigCityRoutes } from './data';
import { runSimulation } from './logic';
import type { FacilityData, RouteData } from './types';

// Injecting spin keyframe for the loader icon natively
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

// --- THE 2D NETWORK GRAPH COMPONENT ---
const NetworkGraph2D = ({ nodes, links, isExpanded = false }: { nodes: FacilityData[], links: RouteData[], isExpanded?: boolean }) => {
  // Find bounding box for auto-scaling, with extra padding so edge nodes don't clip
  const minX = Math.min(...nodes.map(n => n.coords[0])) - 50;
  const maxX = Math.max(...nodes.map(n => n.coords[0])) + 50;
  const minZ = Math.min(...nodes.map(n => n.coords[2])) - 50;
  const maxZ = Math.max(...nodes.map(n => n.coords[2])) + 50;
  const width = maxX - minX;
  const height = maxZ - minZ;

  const getColor = (type: string, isChoked: boolean) => {
    if (isChoked) return '#ef4444';
    switch(type) {
      case 'zone': return '#3b82f6';
      case 'transfer': return '#8b5cf6';
      case 'sorting': return '#f59e0b';
      case 'landfill': return '#10b981';
      default: return '#cbd5e1';
    }
  };

  return (
    <svg 
      viewBox={`${minX} ${minZ} ${width} ${height}`} 
      style={{ 
        width: isExpanded ? '180%' : '100%', 
        height: isExpanded ? '180%' : '100%', 
        minWidth: isExpanded ? '800px' : 'auto',
        minHeight: isExpanded ? '800px' : 'auto',
        background: '#0f172a', 
        borderRadius: 'inherit' 
      }}
    >
      {/* Draw Routes */}
      {links.map(link => {
        const source = nodes.find(n => n.id === link.source_coords.toString() ? link.source_coords : null) || { coords: link.source_coords };
        const target = nodes.find(n => n.id === link.target_coords.toString() ? link.target_coords : null) || { coords: link.target_coords };
        return (
          <line 
            key={link.id}
            x1={source.coords[0]} y1={source.coords[2]} 
            x2={target.coords[0]} y2={target.coords[2]}
            stroke={link.is_bottleneck ? '#ef4444' : '#334155'} 
            strokeWidth={link.is_bottleneck ? 4 : 2}
            opacity={0.8}
          />
        );
      })}
      {/* Draw Nodes */}
      {nodes.map(node => (
        <circle 
          key={node.id}
          cx={node.coords[0]} cy={node.coords[2]} 
          r={node.type === 'zone' ? 6 : 10}
          fill={getColor(node.type, node.is_choked)}
          stroke={node.is_choked ? '#fca5a5' : '#1e293b'}
          strokeWidth={2}
        >
          <title>{node.name}</title>
        </circle>
      ))}
    </svg>
  );
};


export default function App() {
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState('simulation');
  const [bypassActive, setBypassActive] = useState(false);
  const [cityMode, setCityMode] = useState<'small' | 'big'>('small');
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  
  // --- SCENARIO STATES (Sliders) ---
  const [traffic, setTraffic] = useState(1.0);
  const [emissions, setEmissions] = useState(1.0);
  const [wasteVolume, setWasteVolume] = useState(1.0);
  
  // Dynamic Sorting State
  const [sortingMultipliers, setSortingMultipliers] = useState<Record<string, number>>({});
  
  // --- GRAPH STATES (Rendered 3D Engine Data) ---
  const [facilities, setFacilities] = useState(smallCityNodes);
  const [routes, setRoutes] = useState(smallCityRoutes);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // --- STATS ---
  const scaleFactor = cityMode === 'small' ? 1 : 3.5;
  const [stats, setStats] = useState({ co2: '4250', fuel: '1600', trips: 142, landfillRate: '45%' });

  const bottleneckNode = facilities.find(f => f.is_choked);

  // Instantly swap the 3D map data when the judge clicks the toggle
  useEffect(() => {
    const baseNodes = cityMode === 'small' ? smallCityNodes : bigCityNodes;
    setFacilities(baseNodes);
    setRoutes(cityMode === 'small' ? smallCityRoutes : bigCityRoutes);
    
    // Auto-generate state for however many sorting centers exist in this dataset
    const initialSortState: Record<string, number> = {};
    baseNodes.filter(n => n.type === 'sorting').forEach(n => {
      initialSortState[n.id] = 1.0;
    });
    setSortingMultipliers(initialSortState);

    // Auto-update stats to scale when they toggle
    setStats({
      co2: (4250 * emissions * wasteVolume * scaleFactor).toFixed(0),
      fuel: (1600 * traffic * wasteVolume * scaleFactor).toFixed(0),
      trips: Math.round(142 * wasteVolume * scaleFactor),
      landfillRate: bypassActive ? '68%' : '45%'
    });
  }, [cityMode]);

  const handleRunSimulation = async (useBypass = bypassActive, newSortingMultipliers = sortingMultipliers) => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      setStats({
        co2: (4250 * emissions * wasteVolume * scaleFactor).toFixed(0),
        fuel: (1600 * traffic * wasteVolume * scaleFactor).toFixed(0),
        trips: Math.round(142 * wasteVolume * scaleFactor),
        landfillRate: useBypass ? '68%' : '45%'
      });

      const baseNodes = cityMode === 'small' ? smallCityNodes : bigCityNodes;
      const baseRoutes = cityMode === 'small' ? smallCityRoutes : bigCityRoutes;

      const adjustedNodes = baseNodes.map(node => {
        let cap = undefined;
        if (node.type === 'sorting') {
            const baseCap = node.id.includes('taloja') ? 2000 : 1500;
            cap = Math.round(baseCap * (newSortingMultipliers[node.id] || 1.0));
        }
        return {
          ...node,
          demand: node.type === 'zone' ? Math.round(-500 * wasteVolume) : 0,
          capacity: cap
        };
      });

      const payload = {
        nodes: adjustedNodes,
        links: baseRoutes,
        global_traffic_multiplier: traffic,
        global_emissions_factor: emissions,
        apply_bypass: useBypass
      };

      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        setFacilities(result.nodes); 
        setRoutes(result.links);     
      }
    } catch (error) {
      console.error("Backend offline or failed:", error);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // FALLBACK FOR DEMO
      const mockBaseWaste = 5000;
      const tCap = Math.round(2000 * (newSortingMultipliers['sorting_taloja'] || 1.0));
      const mCap = Math.round(1500 * (newSortingMultipliers['sorting_mahape'] || 1.0));
      const mockResult = runSimulation(mockBaseWaste * wasteVolume, tCap, mCap, traffic, useBypass, cityMode);
      setFacilities(mockResult.facilities);
      setRoutes(mockResult.routes);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => { handleRunSimulation(false, sortingMultipliers); }, []);

  const sortingNodes = facilities.filter(n => n.type === 'sorting');

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f172a' }}>
      <style>{spinKeyframes}</style>

      {/* LEFT SIDE: 3D MAP */}
      <div style={{ 
        width: isGraphExpanded ? '50vw' : '100vw', 
        height: '100vh', 
        position: 'relative', 
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        <UltimateSimCity facilities={facilities} routes={routes} isOptimizing={isOptimizing} onNodeClick={() => {}} />

        {/* MULTI-TAB MASTER PANEL - Fixed z-index */}
        <div style={{
          position: 'absolute', top: '20px', left: '20px', width: '380px',
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'system-ui', overflow: 'hidden',
          zIndex: 1000, display: 'flex', flexDirection: 'column', maxHeight: '90vh'
        }}>
          
          {/* DATASET TOGGLE (Small vs Mega City) */}
          <div style={{ padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setCityMode('small')} disabled={isOptimizing}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold',
                  background: cityMode === 'small' ? '#ffffff' : 'transparent',
                  color: cityMode === 'small' ? '#0f172a' : '#64748b',
                  boxShadow: cityMode === 'small' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  cursor: isOptimizing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                }}
              >
                <Map size={14} /> Local Demo
              </button>
              <button 
                onClick={() => setCityMode('big')} disabled={isOptimizing}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold',
                  background: cityMode === 'big' ? '#ffffff' : 'transparent',
                  color: cityMode === 'big' ? '#0f172a' : '#64748b',
                  boxShadow: cityMode === 'big' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  cursor: isOptimizing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                }}
              >
                <Activity size={14} /> Mega Region
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { id: 'simulation', icon: <Settings size={16}/>, label: 'What-If' },
              { id: 'environment', icon: <Leaf size={16}/>, label: 'Impact' },
              { id: 'optimization', icon: <Lightbulb size={16}/>, label: 'AI Fixes' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isOptimizing}
                style={{
                  flex: 1, padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#2563eb' : '#64748b', fontSize: '13px', fontWeight: 'bold', 
                  cursor: isOptimizing ? 'not-allowed' : 'pointer', opacity: isOptimizing ? 0.5 : 1, transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            
            {/* TAB 1: WHAT-IF SIMULATION */}
            {activeTab === 'simulation' && (
              <div style={{ opacity: isOptimizing ? 0.6 : 1, pointerEvents: isOptimizing ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertOctagon size={14} color="#ef4444"/> Festival Waste Spike</span>
                    <span style={{ color: '#ef4444' }}>+{Math.round((wasteVolume - 1) * 100)}%</span>
                  </div>
                  <input type="range" min="1.0" max="2.0" step="0.05" value={wasteVolume} onChange={(e) => setWasteVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ef4444', cursor: 'grab' }} disabled={isOptimizing} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={14}/> Traffic Congestion</span>
                    <span>{traffic.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="1.0" max="3.0" step="0.1" value={traffic} onChange={(e) => setTraffic(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', cursor: 'grab' }} disabled={isOptimizing} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14}/> Fleet Emissions (EV Shift)</span>
                    <span>{emissions.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={emissions} onChange={(e) => setEmissions(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#10b981', cursor: 'grab' }} disabled={isOptimizing} />
                </div>

                {/* DYNAMIC SORTING SLIDERS */}
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '15px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>
                    Facility Capacity Interventions ({sortingNodes.length} active)
                  </div>
                  
                  {sortingNodes.map((fac) => (
                    <div key={fac.id} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={12} color={fac.is_choked ? "#ef4444" : "#8b5cf6"}/> {fac.name}</span>
                        <span style={{ color: fac.is_choked ? '#ef4444' : '#8b5cf6' }}>{Math.round((sortingMultipliers[fac.id] || 1) * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.8" max="2.0" step="0.1" 
                        value={sortingMultipliers[fac.id] || 1.0} 
                        onChange={(e) => setSortingMultipliers({...sortingMultipliers, [fac.id]: parseFloat(e.target.value)})} 
                        style={{ width: '100%', accentColor: fac.is_choked ? '#ef4444' : '#8b5cf6', cursor: 'grab' }} 
                        disabled={isOptimizing}
                      />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleRunSimulation()}
                  disabled={isOptimizing}
                  style={{ 
                    width: '100%', padding: '12px', background: isOptimizing ? '#94a3b8' : '#0f172a', 
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', 
                    cursor: isOptimizing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', 
                    alignItems: 'center', gap: '8px', transition: 'background 0.2s', marginTop: '10px'
                  }}
                >
                  {isOptimizing ? (
                    <><Loader2 size={18} className="animate-spin" /> Simulating Flow...</>
                  ) : (
                    <><Play size={18} /> Run Simulation</>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: ENVIRONMENTAL IMPACT */}
            {activeTab === 'environment' && (
              <div style={{ opacity: isOptimizing ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <Activity size={18} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>Live System Metrics</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Daily COe</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{stats.co2} <span style={{fontSize:'12px', fontWeight:'normal'}}>kg</span></div>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Fuel Consumed</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{stats.fuel} <span style={{fontSize:'12px', fontWeight:'normal'}}>L</span></div>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Trips</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{stats.trips}</div>
                  </div>
                  <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase' }}>Landfill Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#991b1b' }}>{stats.landfillRate}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OPTIMIZATION SUGGESTIONS */}
            {activeTab === 'optimization' && (
              <div style={{ opacity: isOptimizing ? 0.6 : 1, pointerEvents: isOptimizing ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
                {bottleneckNode ? (
                  <>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                        <AlertOctagon size={16} /> Root-Cause Identified
                      </div>
                      <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                        <strong>{bottleneckNode.name}</strong> is operating at {Math.round(bottleneckNode.utilization_percent)}% capacity. 
                        Insufficient sorting throughput is forcing waste to bottleneck and eventually spill directly to landfills.
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0f172a' }}>AI Recommended Interventions:</h4>
                    
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>1. Activate Emergency Bypass</div>
                      <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>Reroute transfer stations directly to Landfills to prevent sorting queue delays.</div>
                      <button 
                        onClick={() => { setBypassActive(true); handleRunSimulation(true); }}
                        disabled={isOptimizing}
                        style={{ 
                          width: '100%', padding: '8px', background: isOptimizing ? '#94a3b8' : '#3b82f6', color: 'white', 
                          border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', 
                          cursor: isOptimizing ? 'not-allowed' : 'pointer', transition: 'background 0.2s' 
                        }}
                      >
                        Apply Bypass (-12% delays)
                      </button>
                    </div>
                    
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>2. Expand Node Capacity</div>
                      <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>Deploy temporary sorting modules at choked facilities.</div>
                      <button 
                        onClick={() => {
                          const updatedMultipliers = { ...sortingMultipliers };
                          facilities.filter(f => f.is_choked && f.type === 'sorting').forEach(f => {
                            updatedMultipliers[f.id] = 2.0; // Double capacity of choked nodes
                          });
                          setSortingMultipliers(updatedMultipliers);
                          setBypassActive(false);
                          handleRunSimulation(false, updatedMultipliers);
                        }}
                        disabled={isOptimizing}
                        style={{ 
                          width: '100%', padding: '8px', background: isOptimizing ? '#94a3b8' : '#10b981', color: 'white', 
                          border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', 
                          cursor: isOptimizing ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        Auto-Scale Flow (+100% throughput)
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', color: '#10b981' }}>
                    <CheckCircle size={40} style={{ marginBottom: '10px' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Network is Optimal</div>
                    <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                      No critical bottlenecks detected at current waste volumes.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* YOUTUBE STYLE MINI-PLAYER (Only visible when graph is collapsed) */}
        {!isGraphExpanded && (
          <div 
            onClick={() => setIsGraphExpanded(true)}
            style={{
              position: 'absolute', top: '20px', right: '20px', width: '280px', height: '200px',
              background: '#0f172a', border: '2px solid #334155', borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)', cursor: 'pointer', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', zIndex: 1000
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
              <Maximize2 size={12} /> EXPAND
            </div>
            <NetworkGraph2D nodes={facilities} links={routes} />
          </div>
        )}
      </div>

      {/* RIGHT SIDE: FULL 2D GRAPH VIEW (Only visible when expanded) */}
      {isGraphExpanded && (
        <div style={{ width: '50vw', height: '100vh', background: '#0f172a', position: 'relative', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#3b82f6" /> Topological Network Flow
              </h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>2D Abstraction for bottleneck isolation</p>
            </div>
            <button 
              onClick={() => setIsGraphExpanded(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
             <NetworkGraph2D nodes={facilities} links={routes} isExpanded={true} />
          </div>

          {/* Graph Legend */}
          <div style={{ padding: '20px', background: '#0b1120', display: 'flex', gap: '15px', justifyContent: 'center' }}>
            {[
              { label: 'Zone', color: '#3b82f6' },
              { label: 'Transfer', color: '#8b5cf6' },
              { label: 'Sorting', color: '#f59e0b' },
              { label: 'Landfill', color: '#10b981' },
              { label: 'Choked/Bottleneck', color: '#ef4444' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} /> {item.label}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}