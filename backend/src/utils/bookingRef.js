const crypto = require('crypto');

/**
 * Generate a unique booking reference like CB-A1B2C3D4
 */
function generateBookingReference() {
  const part = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CB-${part}`;
}

module.exports = { generateBookingReference };
