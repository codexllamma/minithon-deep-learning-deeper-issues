import type { FacilityData, RouteData } from './types';
import { extraNodes, extraRoutes } from './data';

export const runSimulation = (wasteGeneration: number, talojaCap: number, mahapeCap: number, _traffic: number, applyBypass: boolean = false, cityMode: 'small' | 'big' = 'small') => {
  const TOTAL_WASTE = wasteGeneration;
  
  // Math: Advanced Cross-City Flow Balancing (Simulating MCMF Algorithm)
  const K_demand = TOTAL_WASTE * 0.6;
  const S_demand = TOTAL_WASTE * 0.4;
  
  let K_to_T = Math.min(K_demand, talojaCap);
  let S_to_M = Math.min(S_demand, mahapeCap);
  
  const T_remaining = Math.max(0, talojaCap - K_to_T);
  const M_remaining = Math.max(0, mahapeCap - S_to_M);
  
  const K_spillover = K_demand - K_to_T;
  const S_spillover = S_demand - S_to_M;
  
  // Cross-flow attempts (Routing waste across the city to use available capacity)
  const K_to_M = Math.min(K_spillover, M_remaining);
  const S_to_T = Math.min(S_spillover, T_remaining);
  
  let K_final_spill = K_spillover - K_to_M;
  let S_final_spill = S_spillover - S_to_T;

  // If bypass is NOT applied, the remaining waste just piles up and jams the primary facilities
  if (!applyBypass) {
    K_to_T += K_final_spill;
    S_to_M += S_final_spill;
    K_final_spill = 0;
    S_final_spill = 0;
  }

  const talojaDemand = K_to_T + S_to_T;
  const mahapeDemand = S_to_M + K_to_M;
  
  const talojaChoked = talojaDemand > talojaCap;
  const mahapeChoked = mahapeDemand > mahapeCap;
  const anyChoked = talojaChoked || mahapeChoked;

  // Cascading Network Failure
  const systemBackupTaloja = talojaChoked && !applyBypass;
  const systemBackupMahape = mahapeChoked && !applyBypass;

  // 1. Generate 3D Facilities
  const facilities: FacilityData[] = [
    { id: 'zone_panvel_n', name: 'Panvel North', type: 'zone', coords: [-140, 0, -100], utilization_percent: systemBackupTaloja ? 110 : 65, is_choked: systemBackupTaloja },
    { id: 'zone_panvel_s', name: 'Panvel South', type: 'zone', coords: [-120, 0, -40], utilization_percent: systemBackupTaloja ? 125 : 80, is_choked: systemBackupTaloja },
    { id: 'zone_kharghar', name: 'Kharghar', type: 'zone', coords: [-100, 0, 20], utilization_percent: systemBackupTaloja ? 115 : 75, is_choked: systemBackupTaloja },
    { id: 'zone_belapur', name: 'Belapur CBD', type: 'zone', coords: [-140, 0, 80], utilization_percent: systemBackupMahape ? 130 : 90, is_choked: systemBackupMahape },
    { id: 'zone_nerul', name: 'Nerul', type: 'zone', coords: [-100, 0, 140], utilization_percent: systemBackupMahape ? 105 : 60, is_choked: systemBackupMahape },
    { id: 'zone_vashi', name: 'Vashi', type: 'zone', coords: [-130, 0, 200], utilization_percent: systemBackupMahape ? 110 : 85, is_choked: systemBackupMahape },

    { id: 'transfer_kalamboli', name: 'Kalamboli Transfer', type: 'transfer', coords: [-30, 0, -40], utilization_percent: systemBackupTaloja ? 140 : Math.min(92 + (TOTAL_WASTE / 10000) * 10, 100), is_choked: systemBackupTaloja },
    { id: 'transfer_sanpada', name: 'Sanpada Transfer', type: 'transfer', coords: [-30, 0, 120], utilization_percent: systemBackupMahape ? 135 : Math.min(88 + (TOTAL_WASTE / 10000) * 10, 100), is_choked: systemBackupMahape },

    { id: 'sorting_taloja', name: 'Taloja Sorting', type: 'sorting', coords: [50, 0, -20], utilization_percent: (talojaDemand / talojaCap) * 100, is_choked: talojaChoked },
    { id: 'sorting_mahape', name: 'Mahape Sorting', type: 'sorting', coords: [50, 0, 100], utilization_percent: (mahapeDemand / mahapeCap) * 100, is_choked: mahapeChoked },

    { id: 'landfill_taloja', name: 'Taloja Landfill', type: 'landfill', coords: [160, 0, -70], utilization_percent: 110 + (applyBypass ? (K_final_spill / 50) : 0), is_choked: false },
    { id: 'landfill_turbhe', name: 'Turbhe Landfill', type: 'landfill', coords: [170, 0, 160], utilization_percent: 85 + (applyBypass ? (S_final_spill / 50) : 0), is_choked: false }
  ];

  // 2. The Complex Route Network
  const routes: RouteData[] = [
    // Local Zones
    { id: 'r_pn_k', source_coords: [-140, 0, -100], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupTaloja, is_highway: false, traffic_multiplier: systemBackupTaloja ? 4.0 : 1.0 },
    { id: 'r_ps_k', source_coords: [-120, 0, -40], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupTaloja, is_highway: false, traffic_multiplier: systemBackupTaloja ? 4.2 : 1.2 },
    { id: 'r_kh_k', source_coords: [-100, 0, 20], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupTaloja, is_highway: false, traffic_multiplier: systemBackupTaloja ? 4.5 : 1.5 },
    { id: 'r_be_s', source_coords: [-140, 0, 80], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupMahape, is_highway: false, traffic_multiplier: systemBackupMahape ? 4.8 : 1.8 },
    { id: 'r_ne_s', source_coords: [-100, 0, 140], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupMahape, is_highway: false, traffic_multiplier: systemBackupMahape ? 4.1 : 1.1 },
    { id: 'r_va_s', source_coords: [-130, 0, 200], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: systemBackupMahape, is_highway: false, traffic_multiplier: systemBackupMahape ? 4.4 : 1.4 },

    // Primary Transfer
    { id: 'r_k_t', source_coords: [-30, 0, -40], target_coords: [50, 0, -20], flow_volume: K_to_T, capacity: talojaCap, emissions_kg: 200, is_bottleneck: systemBackupTaloja, is_highway: false, traffic_multiplier: systemBackupTaloja ? 6.0 : 1.5 },
    { id: 'r_s_m', source_coords: [-30, 0, 120], target_coords: [50, 0, 100], flow_volume: S_to_M, capacity: mahapeCap, emissions_kg: 200, is_bottleneck: systemBackupMahape, is_highway: false, traffic_multiplier: systemBackupMahape ? 6.0 : 1.5 },
    
    // Cross-Flows (Light up dynamically when balancing loads!)
    { id: 'r_k_m', source_coords: [-30, 0, -40], target_coords: [50, 0, 100], flow_volume: K_to_M, capacity: 1000, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 2.2 },
    { id: 'r_s_t', source_coords: [-30, 0, 120], target_coords: [50, 0, -20], flow_volume: S_to_T, capacity: 1000, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 2.0 },

    // Highways
    { id: 'h_t_tl', source_coords: [50, 0, -20], target_coords: [160, 0, -70], flow_volume: K_to_T + S_to_T, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
    { id: 'h_m_tu', source_coords: [50, 0, 100], target_coords: [170, 0, 160], flow_volume: S_to_M + K_to_M, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
  ];

  // EMERGENCY BYPASS HIGHWAYS
  if (applyBypass) {
    if (K_final_spill > 0) {
      routes.push({ id: 'bypass_k_tl', source_coords: [-30, 0, -40], target_coords: [160, 0, -70], flow_volume: K_final_spill, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.5 });
    }
    if (S_final_spill > 0) {
      routes.push({ id: 'bypass_s_tu', source_coords: [-30, 0, 120], target_coords: [170, 0, 160], flow_volume: S_final_spill, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.2 });
    }
  }

  // Mega City Injection
  if (cityMode === 'big') {
    facilities.push(...extraNodes);
    routes.push(...extraRoutes);
  }

  return { facilities, routes, hasBottleneck: anyChoked, spillover: K_final_spill + S_final_spill };
};
