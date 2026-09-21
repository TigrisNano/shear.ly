import {
  registerClick,
  getLinkAnalytics,
  getTotalClicks,
} from "./analytics.repository";

export async function registerClickService(shortCode: string) {
  return registerClick(shortCode);
}

export async function getLinkAnalyticsService(shortCode: string) {
  return getLinkAnalytics(shortCode);
}

export async function getTotalClicksService() {
  return getTotalClicks();
}
