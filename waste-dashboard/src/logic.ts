import type { FacilityData, RouteData } from './types';

export const runSimulation = (wasteGeneration: number, sortingCapacity: number, _traffic: number) => {
  const TOTAL_WASTE = wasteGeneration;
  
  // 1. Math: Calculate flows and bottlenecks
  const flowToSorting = Math.min(TOTAL_WASTE, sortingCapacity);
  const flowSpillover = TOTAL_WASTE - flowToSorting; // Waste that bypasses sorting
  const isSortingChoked = flowToSorting >= sortingCapacity && TOTAL_WASTE > sortingCapacity;

  // 2. Generate 3D Facilities (Nodes)
  const facilities: FacilityData[] = [
    { id: 'zone_panvel', name: 'Panvel Zones', type: 'zone', coords: [-10, 0, 8], utilization_percent: 100, is_choked: false },
    { id: 'transfer_1', name: 'City Transfer', type: 'transfer', coords: [0, 0, 2], utilization_percent: (TOTAL_WASTE / 600) * 100, is_choked: false },
    { id: 'sorting_1', name: 'Main Sorting', type: 'sorting', coords: [10, 0, 2], utilization_percent: (flowToSorting / sortingCapacity) * 100, is_choked: isSortingChoked },
    { id: 'landfill_1', name: 'Landfill', type: 'landfill', coords: [10, 0, -8], utilization_percent: (flowSpillover / 1000) * 100, is_choked: flowSpillover > 200 }
  ];

  // 3. Generate 3D Routes (Edges)
  const routes: RouteData[] = [
    { id: 'r_zone_transfer', source_coords: [-10, 0, 8], target_coords: [0, 0, 2], flow_volume: TOTAL_WASTE, capacity: 600, emissions_kg: 500, is_bottleneck: false },
    { id: 'r_transfer_sorting', source_coords: [0, 0, 2], target_coords: [10, 0, 2], flow_volume: flowToSorting, capacity: sortingCapacity, emissions_kg: 300, is_bottleneck: isSortingChoked }
  ];

  // Dynamically add the Red Bypass Arc ONLY if sorting is choked
  if (flowSpillover > 0) {
    routes.push({
      id: 'r_bypass_landfill',
      source_coords: [0, 0, 2], // From Transfer
      target_coords: [10, 0, -8], // Straight to Landfill
      flow_volume: flowSpillover,
      capacity: 1000,
      emissions_kg: flowSpillover * 2, // arbitrary
      is_bottleneck: true // Always red because this is a failure route
    });
  }

  return { facilities, routes, hasBottleneck: isSortingChoked, spillover: flowSpillover };
};
