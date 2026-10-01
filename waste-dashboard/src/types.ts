export interface FacilityData {
  id: string;
  name: string;
  type: string;
  coords: number[];
  utilization_percent: number;
  is_choked: boolean;
}

export interface RouteData {
  id: string;
  source_coords: number[];
  target_coords: number[];
  flow_volume: number;
  capacity: number;
  is_bottleneck: boolean;
  emissions_kg: number;
}

export interface MetricsData {
  total_waste_generated: number;
  total_landfilled: number;
  total_recycled: number;
  total_emissions_kg: number;
  system_health: string;
}