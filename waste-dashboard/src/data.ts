import type { FacilityData, RouteData } from './types';

export const denseCityData: FacilityData[] = [
  // THE ZONES (Sources: Generating 5000 TPD total)
  { id: 'zone_panvel_n', name: 'Panvel North', type: 'zone', coords: [-140, 0, -100], utilization_percent: 65, is_choked: false },
  { id: 'zone_panvel_s', name: 'Panvel South', type: 'zone', coords: [-120, 0, -40], utilization_percent: 80, is_choked: false },
  { id: 'zone_kharghar', name: 'Kharghar', type: 'zone', coords: [-100, 0, 20], utilization_percent: 75, is_choked: false },
  { id: 'zone_belapur', name: 'Belapur CBD', type: 'zone', coords: [-140, 0, 80], utilization_percent: 90, is_choked: false },
  { id: 'zone_nerul', name: 'Nerul', type: 'zone', coords: [-100, 0, 140], utilization_percent: 60, is_choked: false },
  { id: 'zone_vashi', name: 'Vashi', type: 'zone', coords: [-130, 0, 200], utilization_percent: 85, is_choked: false },

  // TRANSFER STATIONS (Consolidation points)
  { id: 'transfer_kalamboli', name: 'Kalamboli Transfer', type: 'transfer', coords: [-30, 0, -40], utilization_percent: 92, is_choked: false },
  { id: 'transfer_sanpada', name: 'Sanpada Transfer', type: 'transfer', coords: [-30, 0, 120], utilization_percent: 88, is_choked: false },

  // SORTING PLANTS (The Bottlenecks: Combined capacity is only 3500 TPD)
  { id: 'sorting_taloja', name: 'Taloja Sorting', type: 'sorting', coords: [50, 0, -20], utilization_percent: 100, is_choked: true },
  { id: 'sorting_mahape', name: 'Mahape Sorting', type: 'sorting', coords: [50, 0, 100], utilization_percent: 100, is_choked: true },

  // LANDFILLS (The Sinks: Massive capacity, far outside the city)
  { id: 'landfill_taloja', name: 'Taloja Landfill', type: 'landfill', coords: [160, 0, -70], utilization_percent: 110, is_choked: false },
  { id: 'landfill_turbhe', name: 'Turbhe Landfill', type: 'landfill', coords: [170, 0, 160], utilization_percent: 85, is_choked: false }
];

export const denseRouteData: RouteData[] = [
  // --- LOCAL ROUTES (Standard Garbage Trucks) ---
  // Feeding Kalamboli Transfer
  { id: 'r_pn_k', source_coords: [-140, 0, -100], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'r_ps_k', source_coords: [-120, 0, -40], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.2 },
  { id: 'r_kh_k', source_coords: [-100, 0, 20], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  
  // Feeding Sanpada Transfer
  { id: 'r_be_s', source_coords: [-140, 0, 80], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.8 },
  { id: 'r_ne_s', source_coords: [-100, 0, 140], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.1 },
  { id: 'r_va_s', source_coords: [-130, 0, 200], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.4 },

  // Transfer to Sorting (High volume, high stress)
  { id: 'r_k_t', source_coords: [-30, 0, -40], target_coords: [50, 0, -20], flow_volume: 1000, capacity: 500, emissions_kg: 200, is_bottleneck: true, is_highway: false, traffic_multiplier: 2.0 },
  { id: 'r_s_m', source_coords: [-30, 0, 120], target_coords: [50, 0, 100], flow_volume: 1000, capacity: 500, emissions_kg: 200, is_bottleneck: true, is_highway: false, traffic_multiplier: 2.0 },
  
  // Cross-flow (Load balancing between facilities)
  { id: 'r_s_t', source_coords: [-30, 0, 120], target_coords: [50, 0, -20], flow_volume: 500, capacity: 500, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },

  // --- HIGHWAY ROUTES (Heavy Dump Trucks & High Speeds) ---
  // Standard post-sorting waste to landfills
  { id: 'h_t_tl', source_coords: [50, 0, -20], target_coords: [160, 0, -70], flow_volume: 500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
  { id: 'h_m_tu', source_coords: [50, 0, 100], target_coords: [170, 0, 160], flow_volume: 500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },

  // EMERGENCY BYPASS HIGHWAYS (Triggered because Sorting is at 100%)
  // Bypassing choked sorting plants directly to landfills
  { id: 'bypass_k_tl', source_coords: [-30, 0, -40], target_coords: [160, 0, -70], flow_volume: 1500, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.5 },
  { id: 'bypass_s_tu', source_coords: [-30, 0, 120], target_coords: [170, 0, 160], flow_volume: 1500, capacity: 2000, emissions_kg: 500, is_bottleneck: true, is_highway: true, traffic_multiplier: 2.2 }
];
