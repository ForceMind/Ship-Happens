import { PlayerState, Route } from '../types';
import { ROUTES } from './data';
import { getVisibleRoutes } from './progression';

const PORT_SEA_REGION_NAMES: Record<string, string> = {
  port_royal: '王室近海与暴风边境',
  port_tortuga: '黑旗暗流与传说外海',
  port_nassau: '自由港黑潮水道',
  port_cartagena: '要塞护航海域',
  port_oriental: '远东季风与珊瑚海',
  port_azores: '远洋补给中继海域',
  port_madagascar: '旧海盗深海外缘',
};

const PORT_ROUTE_ACCESS: Record<string, string[]> = {
  port_royal: ['route_coastal', 'route_storm', 'route_black_tide', 'route_coral'],
  port_tortuga: ['route_coastal', 'route_black_tide', 'route_legend', 'route_abyss'],
  port_nassau: ['route_coastal', 'route_storm', 'route_black_tide', 'route_monsoon'],
  port_cartagena: ['route_coastal', 'route_storm', 'route_coral', 'route_monsoon'],
  port_oriental: ['route_storm', 'route_coral', 'route_monsoon', 'route_legend'],
  port_azores: ['route_storm', 'route_black_tide', 'route_coral', 'route_monsoon', 'route_legend'],
  port_madagascar: ['route_black_tide', 'route_coral', 'route_monsoon', 'route_legend', 'route_abyss'],
};

export function getPortSeaRegionName(portId: string): string {
  return PORT_SEA_REGION_NAMES[portId] || '普通商路海域';
}

export function getPortRouteIds(portId: string): string[] {
  return PORT_ROUTE_ACCESS[portId] || ['route_coastal'];
}

export function getPortVisibleRoutes(player: Pick<PlayerState, 'storyProgress'>, portId: string): Route[] {
  const routeIds = new Set(getPortRouteIds(portId));
  return getVisibleRoutes(player).filter(route => routeIds.has(route.id));
}

export function getPortUnavailableRouteNames(player: Pick<PlayerState, 'storyProgress'>, portId: string): string[] {
  const routeIds = new Set(getPortRouteIds(portId));
  return getVisibleRoutes(player)
    .filter(route => !routeIds.has(route.id))
    .map(route => route.name);
}

export function getRouteById(routeId: string): Route | undefined {
  return ROUTES.find(route => route.id === routeId);
}
