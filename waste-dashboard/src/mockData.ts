import type { RouteData, FacilityData, MetricsData } from './types';

// The hardcoded Panvel City Model
export const MOCK_FACILITIES: FacilityData[] = [
  { id: 'zone_panvel', name: 'Panvel Zones', type: 'zone', coords: [73.1066, 18.9894], utilization_percent: 0, is_choked: false },
  { id: 'zone_kharghar', name: 'Kharghar Zones', type: 'zone', coords: [73.0699, 19.0269], utilization_percent: 0, is_choked: false },
  { id: 'transfer_1', name: 'Kalamboli Transfer', type: 'transfer', coords: [73.0850, 19.0050], utilization_percent: 75, is_choked: false },
  { id: 'sorting_1', name: 'Taloja Sorting', type: 'sorting', coords: [73.1111, 19.0645], utilization_percent: 100, is_choked: true }, // Choked!
  { id: 'landfill_1', name: 'Taloja Landfill', type: 'landfill', coords: [73.1500, 19.0800], utilization_percent: 60, is_choked: false }
];

export const MOCK_ROUTES: RouteData[] = [
  // Normal flows to Transfer
  { id: 'r1', source_coords: [73.1066, 18.9894], target_coords: [73.0850, 19.0050], flow_volume: 200, capacity: 500, is_bottleneck: false, emissions_kg: 400 },
  { id: 'r2', source_coords: [73.0699, 19.0269], target_coords: [73.0850, 19.0050], flow_volume: 300, capacity: 500, is_bottleneck: false, emissions_kg: 600 },
  
  // Transfer to Sorting (Hitting Bottleneck)
  { id: 'r3', source_coords: [73.0850, 19.0050], target_coords: [73.1111, 19.0645], flow_volume: 300, capacity: 300, is_bottleneck: true, emissions_kg: 1200 },
  
  // The Red Overflow Route (Bypassing sorting, straight to landfill)
  { id: 'r4', source_coords: [73.0850, 19.0050], target_coords: [73.1500, 19.0800], flow_volume: 200, capacity: 1000, is_bottleneck: true, emissions_kg: 8500 }
];

export const MOCK_METRICS: MetricsData = {
  total_waste_generated: 500,
  total_landfilled: 200,
  total_recycled: 300,
  total_emissions_kg: 10700,
  system_health: 'Warning'
};

export const SIMCITY_FACILITIES: FacilityData[] = [
  { id: 'zone_panvel', name: 'Panvel Zones', type: 'zone', coords: [-10, 0, 8], utilization_percent: 0, is_choked: false },
  { id: 'transfer_1', name: 'City Transfer', type: 'transfer', coords: [0, 0, 2], utilization_percent: 75, is_choked: false },
  { id: 'sorting_1', name: 'Main Sorting', type: 'sorting', coords: [10, 0, 2], utilization_percent: 100, is_choked: true },
  { id: 'landfill_1', name: 'Landfill', type: 'landfill', coords: [10, 0, -8], utilization_percent: 60, is_choked: false }
];

export const SIMCITY_ROUTES: RouteData[] = [
  { id: 'r1', source_coords: [-10, 0, 8], target_coords: [0, 0, 2], flow_volume: 500, capacity: 500, emissions_kg: 500, is_bottleneck: false },
  { id: 'r2', source_coords: [0, 0, 2], target_coords: [10, 0, 2], flow_volume: 300, capacity: 300, emissions_kg: 300, is_bottleneck: true },
  { id: 'r3', source_coords: [0, 0, 2], target_coords: [10, 0, -8], flow_volume: 200, capacity: 500, emissions_kg: 400, is_bottleneck: true } // Bypass Overflow
];