import type { FacilityData, RouteData } from './types';

export const denseCityData: FacilityData[] = [
  // THE ZONES
  { id: 'zone_panvel_n', name: 'Panvel North', type: 'zone', coords: [-140, 0, -100], utilization_percent: 65, is_choked: false },
  { id: 'zone_panvel_s', name: 'Panvel South', type: 'zone', coords: [-120, 0, -40], utilization_percent: 80, is_choked: false },
  { id: 'zone_kharghar', name: 'Kharghar', type: 'zone', coords: [-100, 0, 20], utilization_percent: 75, is_choked: false },
  { id: 'zone_belapur', name: 'Belapur CBD', type: 'zone', coords: [-140, 0, 80], utilization_percent: 90, is_choked: false },
  { id: 'zone_nerul', name: 'Nerul', type: 'zone', coords: [-100, 0, 140], utilization_percent: 60, is_choked: false },
  { id: 'zone_vashi', name: 'Vashi', type: 'zone', coords: [-130, 0, 200], utilization_percent: 85, is_choked: false },

  // TRANSFER STATIONS
  { id: 'transfer_kalamboli', name: 'Kalamboli Transfer', type: 'transfer', coords: [-30, 0, -40], utilization_percent: 92, is_choked: false },
  { id: 'transfer_sanpada', name: 'Sanpada Transfer', type: 'transfer', coords: [-30, 0, 120], utilization_percent: 88, is_choked: false },

  // SORTING PLANTS
  { id: 'sorting_taloja', name: 'Taloja Sorting', type: 'sorting', coords: [50, 0, -20], utilization_percent: 100, is_choked: true },
  { id: 'sorting_mahape', name: 'Mahape Sorting', type: 'sorting', coords: [50, 0, 100], utilization_percent: 100, is_choked: true },

  // LANDFILLS
  { id: 'landfill_taloja', name: 'Taloja Landfill', type: 'landfill', coords: [160, 0, -70], utilization_percent: 110, is_choked: false },
  { id: 'landfill_turbhe', name: 'Turbhe Landfill', type: 'landfill', coords: [170, 0, 160], utilization_percent: 85, is_choked: false }
];

export const denseRouteData: RouteData[] = [
  // --- LOCAL ROUTES ---
  { id: 'r_pn_k', source_coords: [-140, 0, -100], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'r_ps_k', source_coords: [-120, 0, -40], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.2 },
  { id: 'r_kh_k', source_coords: [-100, 0, 20], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'r_be_s', source_coords: [-140, 0, 80], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.8 },
  { id: 'r_ne_s', source_coords: [-100, 0, 140], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.1 },
  { id: 'r_va_s', source_coords: [-130, 0, 200], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.4 },

  // --- MIDDLE-MILE: TRANSFER TO SORTING ---
  { id: 'r_k_t', source_coords: [-30, 0, -40], target_coords: [50, 0, -20], flow_volume: 1500, capacity: 2000, emissions_kg: 200, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'r_s_m', source_coords: [-30, 0, 120], target_coords: [50, 0, 100], flow_volume: 1500, capacity: 2000, emissions_kg: 200, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'r_k_m', source_coords: [-30, 0, -40], target_coords: [50, 0, 100], flow_volume: 0, capacity: 1000, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 2.2 },
  { id: 'r_s_t', source_coords: [-30, 0, 120], target_coords: [50, 0, -20], flow_volume: 0, capacity: 1000, emissions_kg: 100, is_bottleneck: false, is_highway: false, traffic_multiplier: 2.0 },

  // --- HIGHWAY ROUTES ---
  { id: 'h_t_tl', source_coords: [50, 0, -20], target_coords: [160, 0, -70], flow_volume: 1500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
  { id: 'h_m_tu', source_coords: [50, 0, 100], target_coords: [170, 0, 160], flow_volume: 1500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
  { id: 'h_t_tu', source_coords: [50, 0, -20], target_coords: [170, 0, 160], flow_volume: 0, capacity: 2000, emissions_kg: 100, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.8 },
  { id: 'h_m_tl', source_coords: [50, 0, 100], target_coords: [160, 0, -70], flow_volume: 0, capacity: 2000, emissions_kg: 100, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.7 }
];

export const smallCityNodes = denseCityData;
export const smallCityRoutes = denseRouteData;

// --- EXTRAS FOR MEGA CITY TOGGLE ---
export const extraNodes: FacilityData[] = [
  { id: 'zone_m1', name: 'Thane West', type: 'zone', coords: [-160, 0, -180], utilization_percent: 70, is_choked: false },
  { id: 'zone_m2', name: 'Thane East', type: 'zone', coords: [-120, 0, -180], utilization_percent: 75, is_choked: false },
  { id: 'zone_m3', name: 'Airoli', type: 'zone', coords: [-180, 0, -100], utilization_percent: 85, is_choked: false },
  { id: 'zone_m4', name: 'Ghansoli', type: 'zone', coords: [-180, 0, -20], utilization_percent: 60, is_choked: false },
  { id: 'zone_m5', name: 'Koparkhairane', type: 'zone', coords: [-180, 0, 60], utilization_percent: 65, is_choked: false },
  { id: 'zone_m6', name: 'Seawoods', type: 'zone', coords: [-180, 0, 140], utilization_percent: 72, is_choked: false },
  { id: 'zone_m7', name: 'CBD Belapur N', type: 'zone', coords: [-180, 0, 220], utilization_percent: 88, is_choked: false },
  { id: 'zone_m8', name: 'Ulwe', type: 'zone', coords: [-120, 0, 280], utilization_percent: 55, is_choked: false },
  { id: 'zone_m9', name: 'Uran', type: 'zone', coords: [-80, 0, 300], utilization_percent: 45, is_choked: false },
  { id: 'zone_m10', name: 'Dronagiri', type: 'zone', coords: [-40, 0, 280], utilization_percent: 50, is_choked: false },
  { id: 'transfer_thane', name: 'Thane Transfer', type: 'transfer', coords: [-30, 0, -150], utilization_percent: 80, is_choked: false },
  { id: 'transfer_ulwe', name: 'Ulwe Transfer', type: 'transfer', coords: [-30, 0, 250], utilization_percent: 70, is_choked: false },
  { id: 'sorting_kalyan', name: 'Kalyan Sorting', type: 'sorting', coords: [50, 0, -120], utilization_percent: 90, is_choked: false },
  { id: 'sorting_panvel', name: 'Panvel Sorting', type: 'sorting', coords: [50, 0, 220], utilization_percent: 85, is_choked: false },
  { id: 'landfill_kalyan', name: 'Kalyan Landfill', type: 'landfill', coords: [160, 0, -150], utilization_percent: 60, is_choked: false },
  { id: 'landfill_panvel', name: 'Panvel Landfill', type: 'landfill', coords: [160, 0, 250], utilization_percent: 50, is_choked: false },
];

export const extraRoutes: RouteData[] = [
  { id: 'rm_1', source_coords: [-160, 0, -180], target_coords: [-30, 0, -150], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'rm_2', source_coords: [-120, 0, -180], target_coords: [-30, 0, -150], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.2 },
  { id: 'rm_3', source_coords: [-180, 0, -100], target_coords: [-30, 0, -150], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'rm_4', source_coords: [-180, 0, -20], target_coords: [-30, 0, -40], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'rm_5', source_coords: [-180, 0, 60], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'rm_6', source_coords: [-180, 0, 140], target_coords: [-30, 0, 120], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.1 },
  { id: 'rm_7', source_coords: [-180, 0, 220], target_coords: [-30, 0, 250], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.6 },
  { id: 'rm_8', source_coords: [-120, 0, 280], target_coords: [-30, 0, 250], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.2 },
  { id: 'rm_9', source_coords: [-80, 0, 300], target_coords: [-30, 0, 250], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.0 },
  { id: 'rm_10', source_coords: [-40, 0, 280], target_coords: [-30, 0, 250], flow_volume: 500, capacity: 500, emissions_kg: 50, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.1 },
  { id: 'rm_11', source_coords: [-30, 0, -150], target_coords: [50, 0, -120], flow_volume: 1500, capacity: 2000, emissions_kg: 200, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'rm_12', source_coords: [-30, 0, 250], target_coords: [50, 0, 220], flow_volume: 1500, capacity: 2000, emissions_kg: 200, is_bottleneck: false, is_highway: false, traffic_multiplier: 1.5 },
  { id: 'hm_1', source_coords: [50, 0, -120], target_coords: [160, 0, -150], flow_volume: 1500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 },
  { id: 'hm_2', source_coords: [50, 0, 220], target_coords: [160, 0, 250], flow_volume: 1500, capacity: 5000, emissions_kg: 150, is_bottleneck: false, is_highway: true, traffic_multiplier: 1.0 }
];

export const bigCityNodes = [...smallCityNodes, ...extraNodes];
export const bigCityRoutes = [...smallCityRoutes, ...extraRoutes];
