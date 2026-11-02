// ======================================
// DELIVERY / ORDER PRICING SERVICE
// ======================================

// ======================================
// DELIVERY PRICING
// ======================================

// R1.20 per actual driving kilometre
const PRICE_PER_KM = 1.2;

// Delivery fee limits
const MIN_DELIVERY_FEE = 3;
const MAX_DELIVERY_FEE = 50;

// ======================================
// SERVICE FEE PRICING
// ======================================

// 5% of food subtotal
const SERVICE_FEE_PERCENTAGE = 0.05;

// Service fee limits
const MIN_SERVICE_FEE = 3;
const MAX_SERVICE_FEE = 30;

// ======================================
// ROUND MONEY
// ======================================

const roundMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number(number.toFixed(2));
};

// ======================================
// CALCULATE DELIVERY PRICE
// ======================================
//
// Delivery price:
//
// distance × R1.20
//
// Minimum = R3
// Maximum = R50
//
// Examples:
//
// 1 km × R1.20 = R1.20
// Customer pays R3 minimum
//
// 10 km × R1.20 = R12
// Customer pays R12
//
// 50 km × R1.20 = R60
// Customer pays R50 maximum
//
// ======================================

const calculateDeliveryPrice = (distanceKm) => {
  const distance = Number(distanceKm);

  if (!Number.isFinite(distance) || distance < 0) {
    return null;
  }

  // ======================================
  // RAW DELIVERY PRICE
  // ======================================

  const calculatedPrice = distance * PRICE_PER_KM;

  // ======================================
  // APPLY MINIMUM / MAXIMUM
  // ======================================

  const deliveryPrice = Math.min(
    Math.max(calculatedPrice, MIN_DELIVERY_FEE),
    MAX_DELIVERY_FEE,
  );

  return roundMoney(deliveryPrice);
};

// ======================================
// CALCULATE SERVICE FEE
// ======================================
//
// 5% of food subtotal
//
// Minimum = R3
// Maximum = R30
//
// ======================================

const calculateServiceFee = (subtotal) => {
  const orderSubtotal = Number(subtotal);

  if (!Number.isFinite(orderSubtotal) || orderSubtotal < 0) {
    return null;
  }

  // No service fee when basket is empty
  if (orderSubtotal === 0) {
    return 0;
  }

  const calculatedFee = orderSubtotal * SERVICE_FEE_PERCENTAGE;

  const serviceFee = Math.min(
    Math.max(calculatedFee, MIN_SERVICE_FEE),
    MAX_SERVICE_FEE,
  );

  return roundMoney(serviceFee);
};

// ======================================
// CALCULATE FULL ORDER PRICING
// ======================================

const calculateOrderPricing = ({ subtotal, distanceKm }) => {
  const orderSubtotal = Number(subtotal);

  const distance = Number(distanceKm);

  // ======================================
  // VALIDATE SUBTOTAL
  // ======================================

  if (!Number.isFinite(orderSubtotal) || orderSubtotal < 0) {
    throw new Error("A valid food subtotal is required.");
  }

  // ======================================
  // VALIDATE DISTANCE
  // ======================================

  if (!Number.isFinite(distance) || distance < 0) {
    throw new Error("A valid delivery distance is required.");
  }

  // ======================================
  // DELIVERY PRICE
  // ======================================

  const deliveryPrice = calculateDeliveryPrice(distance);

  // ======================================
  // SERVICE FEE
  // ======================================

  const serviceFee = calculateServiceFee(orderSubtotal);

  if (deliveryPrice === null || serviceFee === null) {
    throw new Error("Could not calculate order pricing.");
  }

  // ======================================
  // TOTAL
  // ======================================

  const total = orderSubtotal + deliveryPrice + serviceFee;

  // ======================================
  // RETURN PRICING
  // ======================================

  return {
    // ======================================
    // FOOD
    // ======================================

    subtotal: roundMoney(orderSubtotal),

    // ======================================
    // DISTANCE
    // ======================================

    distanceKm: Number(distance.toFixed(2)),

    // ======================================
    // DELIVERY
    // ======================================

    pricePerKm: PRICE_PER_KM,

    minimumDeliveryFee: MIN_DELIVERY_FEE,

    maximumDeliveryFee: MAX_DELIVERY_FEE,

    deliveryPrice,

    // ======================================
    // SERVICE FEE
    // ======================================

    serviceFeePercentage: SERVICE_FEE_PERCENTAGE * 100,

    minimumServiceFee: MIN_SERVICE_FEE,

    maximumServiceFee: MAX_SERVICE_FEE,

    serviceFee,

    // ======================================
    // TOTAL
    // ======================================

    total: roundMoney(total),
  };
};

// ======================================
// EXPORTS
// ======================================

module.exports = {
  // ======================================
  // DELIVERY
  // ======================================

  PRICE_PER_KM,

  MIN_DELIVERY_FEE,

  MAX_DELIVERY_FEE,

  // ======================================
  // SERVICE FEE
  // ======================================

  SERVICE_FEE_PERCENTAGE,

  MIN_SERVICE_FEE,

  MAX_SERVICE_FEE,

  // ======================================
  // FUNCTIONS
  // ======================================

  calculateDeliveryPrice,

  calculateServiceFee,

  calculateOrderPricing,
};
