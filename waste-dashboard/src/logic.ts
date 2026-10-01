import type { FacilityData, RouteData } from './types';

export const runSimulation = (wasteGeneration: number, talojaCap: number, mahapeCap: number, _traffic: number, applyBypass: boolean = false) => {
  const TOTAL_WASTE = wasteGeneration;
  
  // Math: Split demand. 60% historically goes to Taloja, 40% to Mahape
  const talojaDemand = TOTAL_WASTE * 0.6;
  const mahapeDemand = TOTAL_WASTE * 0.4;

  const flowToTaloja = Math.min(talojaDemand, talojaCap);
  const flowToMahape = Math.min(mahapeDemand, mahapeCap);

  const talojaChoked = talojaDemand > talojaCap;
  const mahapeChoked = mahapeDemand > mahapeCap;
  const anyChoked = talojaChoked || mahapeChoked;

  const talojaSpillover = talojaDemand - flowToTaloja;
  const mahapeSpillover = mahapeDemand - flowToMahape;

  // 1. Generate 3D Facilities (Nodes) using dense city coordinates
  const facilities: FacilityData[] = [
    // THE ZONES
    { id: 'zone_panvel_n', name: 'Panvel North', type: 'zone', coords: [-140, 0, -100], utilization_percent: 65, is_choked: false },
    { id: 'zone_panvel_s', name: 'Panvel South', type: 'zone', coords: [-120, 0, -40], utilization_percent: 80, is_choked: false },
    { id: 'zone_kharghar', name: 'Kharghar', type: 'zone', coords: [-100, 0, 20], utilization_percent: 75, is_choked: false },
    { id: 'zone_belapur', name: 'Belapur CBD', type: 'zone', coords: [-140, 0, 80], utilization_percent: 90, is_choked: false },
    { id: 'zone_nerul', name: 'Nerul', type: 'zone', coords: [-100, 0, 140], utilization_percent: 60, is_choked: false },
    { id: 'zone_vashi', name: 'Vashi', type: 'zone', coords: [-130, 0, 200], utilization_percent: 85, is_choked: false },

    // TRANSFER STATIONS
    { id: 'transfer_kalamboli', name: 'Kalamboli Transfer', type: 'transfer', coords: [-30, 0, -40], utilization_percent: Math.min(92 + (TOTAL_WASTE / 10000) * 10, 100), is_choked: false },
    { id: 'transfer_sanpada', name: 'Sanpada Transfer', type: 'transfer', coords: [-30, 0, 120], utilization_percent: Math.min(88 + (TOTAL_WASTE / 10000) * 10, 100), is_choked: false },

    // SORTING PLANTS (If bypass isn't active, they take all demand and massively over-utilize)
    { id: 'sorting_taloja', name: 'Taloja Sorting', type: 'sorting', coords: [50, 0, -20], utilization_percent: applyBypass ? (flowToTaloja / talojaCap) * 100 : (talojaDemand / talojaCap) * 100, is_choked: talojaChoked },
    { id: 'sorting_mahape', name: 'Mahape Sorting', type: 'sorting', coords: [50, 0, 100], utilization_percent: applyBypass ? (flowToMahape / mahapeCap) * 100 : (mahapeDemand / mahapeCap) * 100, is_choked: mahapeChoked },

    // LANDFILLS
    { id: 'landfill_taloja', name: 'Taloja Landfill', type: 'landfill', coords: [160, 0, -70], utilization_percent: 110 + (applyBypass ? (talojaSpillover / 50) : 0), is_choked: false },
    { id: 'landfill_turbhe', name: 'Turbhe Landfill', type: 'landfill', coords: [170, 0, 160], utilization_percent: 85 + (applyBypass ? (mahapeSpillover / 50) : 0), is_choked: false }
  ];

  // 2. The Complex Route Network
  const routes: RouteData[] = [
    // --- LOCAL ROUTES ---
    { id: 'r_pn_k', source_coords: [-140, 0, -100], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
    { id: 'r_ps_k', source_coords: [-120, 0, -40], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.2 },
    { id: 'r_kh_k', source_coords: [-100, 0, 20], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
    
    { id: 'r_be_s', source_coords: [-140, 0, 80], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.8 },
    { id: 'r_ne_s', source_coords: [-100, 0, 140], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.1 },
    { id: 'r_va_s', source_coords: [-130, 0, 200], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.4 },

    // Transfer to Sorting
    { id: 'r_k_t', source_coords: [-30, 0, -40], target_coords: [50, 0, -20], flow_volume: applyBypass ? flowToTaloja : talojaDemand, capacity: talojaCap, emissions_kg: 200, is_bottleneck: talojaChoked, is_highway: false, traffic_multiplier: 2.0 },
    { id: 'r_s_m', source_coords: [-30, 0, 120], target_coords: [50, 0, 100], flow_volume: applyBypass ? flowToMahape : mahapeDemand, capacity: mahapeCap, emissions_kg: 200, is_bottleneck: mahapeChoked, is_highway: false, traffic_multiplier: 2.0 },
    { id: 'r_s_t', source_coords: [-30, 0, 120], target_coords: [50, 0, -20], flow_volume: 100, capacity: 500, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },

    // --- HIGHWAY ROUTES ---
    { id: 'h_t_tl', source_coords: [50, 0, -20], target_coords: [160, 0, -70], flow_volume: flowToTaloja, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
    { id: 'h_m_tu', source_coords: [50, 0, 100], target_coords: [170, 0, 160], flow_volume: flowToMahape, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 }
  ];

  // EMERGENCY BYPASS HIGHWAYS
  if (applyBypass) {
    if (talojaSpillover > 0) {
      routes.push({ id: 'bypass_k_tl', source_coords: [-30, 0, -40], target_coords: [160, 0, -70], flow_volume: talojaSpillover, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.5 });
    }
    if (mahapeSpillover > 0) {
      routes.push({ id: 'bypass_s_tu', source_coords: [-30, 0, 120], target_coords: [170, 0, 160], flow_volume: mahapeSpillover, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.2 });
    }
  }

  return { facilities, routes, hasBottleneck: anyChoked, spillover: talojaSpillover + mahapeSpillover };
};
