/**
 * Simple forecasting utilities for inventory management
 * Uses moving average and basic trend analysis - nothing fancy, just practical
 */

// Calculate simple moving average
function movingAverage(data, window = 7) {
  if (data.length < window) {
    return data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;
  }

  const recent = data.slice(-window);
  return recent.reduce((a, b) => a + b, 0) / window;
}

// Calculate weighted moving average (recent data weighted more)
function weightedMovingAverage(data, window = 7) {
  if (data.length === 0) return 0;

  const slice = data.slice(-window);
  let sum = 0;
  let weightSum = 0;

  slice.forEach((val, i) => {
    const weight = i + 1;
    sum += val * weight;
    weightSum += weight;
  });

  return sum / weightSum;
}

// Detect trend direction
function detectTrend(data, window = 7) {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-window);
  const older = data.slice(-window * 2, -window);

  if (older.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

// Forecast days until stockout
function daysUntilStockout(currentStock, dailyUsageData) {
  if (dailyUsageData.length === 0 || currentStock <= 0) {
    return currentStock <= 0 ? 0 : null;
  }

  const avgDailyUsage = weightedMovingAverage(dailyUsageData);

  if (avgDailyUsage <= 0) return null; // No usage, won't run out

  return Math.floor(currentStock / avgDailyUsage);
}

// Suggest reorder point based on lead time and safety stock
function suggestReorderPoint(dailyUsageData, leadTimeDays = 7, safetyStockDays = 3) {
  if (dailyUsageData.length === 0) return 10; // Default fallback

  const avgDailyUsage = weightedMovingAverage(dailyUsageData);
  const trend = detectTrend(dailyUsageData);

  // Adjust for trend
  let adjustedUsage = avgDailyUsage;
  if (trend === 'increasing') {
    adjustedUsage *= 1.1; // 10% buffer for increasing demand
  }

  const reorderPoint = Math.ceil(adjustedUsage * (leadTimeDays + safetyStockDays));

  return reorderPoint;
}

// Generate forecast for next N days
function forecastDemand(dailyUsageData, daysAhead = 30) {
  if (dailyUsageData.length === 0) {
    return Array(daysAhead).fill(0);
  }

  const avgUsage = weightedMovingAverage(dailyUsageData);
  const trend = detectTrend(dailyUsageData);

  // Calculate trend multiplier
  let trendMultiplier = 0;
  if (trend === 'increasing') {
    trendMultiplier = 0.01; // 1% daily increase
  } else if (trend === 'decreasing') {
    trendMultiplier = -0.01;
  }

  const forecast = [];
  for (let i = 0; i < daysAhead; i++) {
    const projected = avgUsage * (1 + trendMultiplier * i);
    forecast.push(Math.max(0, roundToTwoDecimals(projected)));
  }

  return forecast;
}

// Helper function to round numbers to two decimal places
function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

// Calculate total forecasted usage over a period
function calculateTotalForecastedUsage(forecast) {
  return forecast.reduce((sum, dailyUsage) => sum + dailyUsage, 0);
}

// Calculate projected stock level after forecasted usage
function calculateProjectedStock(currentStock, forecast) {
  const totalUsage = calculateTotalForecastedUsage(forecast);
  const projectedStock = currentStock - totalUsage;
  return Math.max(0, Math.round(projectedStock));
}

// Determine if threshold adjustment is recommended (>20% difference)
function isThresholdAdjustmentNeeded(suggestedThreshold, currentThreshold) {
  const difference = Math.abs(suggestedThreshold - currentThreshold);
  const changePercentage = difference / currentThreshold;
  return changePercentage > 0.2; // More than 20% difference
}

// Calculate average daily usage from historical data
function calculateAverageDailyUsage(dailyUsageData) {
  if (dailyUsageData.length === 0) {
    return 0;
  }
  return roundToTwoDecimals(weightedMovingAverage(dailyUsageData));
}

// Analyze item and return insights
function analyzeItem(currentStock, lowStockThreshold, dailyUsageData) {
  // Calculate metrics
  const avgDailyUsage = calculateAverageDailyUsage(dailyUsageData);
  const trend = detectTrend(dailyUsageData);
  const daysToStockout = daysUntilStockout(currentStock, dailyUsageData);
  const suggestedThreshold = suggestReorderPoint(dailyUsageData);
  const twoWeekForecast = forecastDemand(dailyUsageData, 14);

  // Build analysis result
  return {
    currentStock,
    avgDailyUsage,
    trend,
    daysToStockout,
    suggestedThreshold,
    currentThreshold: lowStockThreshold,
    shouldAdjustThreshold: isThresholdAdjustmentNeeded(suggestedThreshold, lowStockThreshold),
    twoWeekForecast,
    projectedStockIn14Days: calculateProjectedStock(currentStock, twoWeekForecast)
  };
}

module.exports = {
  movingAverage,
  weightedMovingAverage,
  detectTrend,
  daysUntilStockout,
  suggestReorderPoint,
  forecastDemand,
  analyzeItem,
  // Exported for testing and reuse
  roundToTwoDecimals,
  calculateTotalForecastedUsage,
  calculateProjectedStock,
  isThresholdAdjustmentNeeded,
  calculateAverageDailyUsage
};
