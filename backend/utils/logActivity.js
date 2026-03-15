const ActivityLog = require('../models/ActivityLog');

/**
 * Reusable activity logger.
 * Call this after any successful write operation.
 *
 * @param {string} action      - Short label, e.g. "Faculty Added"
 * @param {string} description - Human-readable sentence, e.g. "Dr. John Smith added to CS"
 * @param {string} module      - One of: Faculty | Subject | Classroom | Department | Timetable | Workload
 */
const logActivity = async (action, description, module) => {
  try {
    await ActivityLog.create({ action, description, module });
  } catch (err) {
    // Logging errors should never crash the main operation
    console.error('[ActivityLog] Failed to log:', err.message);
  }
};

module.exports = logActivity;
