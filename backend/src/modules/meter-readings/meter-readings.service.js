// const ApiError = require('../../common/ApiError');
// const repository = require('./meter-readings.repository');
// const utilityRepository = require('../utility-setup/utility-setup.repository');

// const ABNORMAL_JUMP_MULTIPLIER = 2; // flag if consumption more than doubles vs the prior cycle

// // --- readings --------------------------------------------------------------------

// /**
//  * "Reading validation: current reading cannot be lower than previous
//  * unless a reset/rollover is explicitly recorded" - enforced here, not
//  * just documented. isRollover must be explicitly passed to bypass it.
//  */
// const submitReading = async ({ meterId, readingDate, readingValue, source, capturedBy, imageDocumentId, isRollover }) => {
//   const meter = await utilityRepository.findMeterById(meterId);
//   if (!meter) throw new ApiError(404, 'Meter not found');

//   const previous = await repository.findLastAcceptedReading(meterId, readingDate || new Date());
//   if (previous && readingValue < parseFloat(previous.reading_value) && !isRollover) {
//     throw new ApiError(
//       400,
//       `New reading (${readingValue}) is lower than the previous reading (${previous.reading_value}). ` +
//         'If this is a genuine meter reset/rollover, resubmit with isRollover: true.'
//     );
//   }

//   return repository.createReading({ meterId, readingDate, readingValue, source, capturedBy, imageDocumentId, status: 'SUBMITTED' });
// };

// /** Estimated reading workflow - used when the actual reading is unavailable. */
// const submitEstimatedReading = async ({ meterId, readingDate, readingValue, capturedBy }) => {
//   const meter = await utilityRepository.findMeterById(meterId);
//   if (!meter) throw new ApiError(404, 'Meter not found');
//   return repository.createReading({ meterId, readingDate, readingValue, source: 'MANUAL', capturedBy, status: 'ESTIMATED' });
// };

// const listReadings = (query) => repository.listReadings(query);

// const getReading = async (id) => {
//   const reading = await repository.findReadingById(id);
//   if (!reading) throw new ApiError(404, 'Reading not found');
//   return reading;
// };

// /**
//  * Validates a SUBMITTED/ESTIMATED reading. Computes consumption against
//  * the last accepted reading and flags (not blocks) an abnormal jump -
//  * "Abnormal consumption alerts" from the spec, surfaced as a response
//  * field rather than a blocking error since there's no notification
//  * system to escalate it to (Phase 14, not built).
//  */
// const validateReading = async (id) => {
//   const reading = await repository.findReadingById(id);
//   if (!reading) throw new ApiError(404, 'Reading not found');
//   if (reading.status !== 'SUBMITTED' && reading.status !== 'ESTIMATED') {
//     throw new ApiError(400, `Cannot validate a reading that is currently ${reading.status}`);
//   }

//   const previous = await repository.findLastAcceptedReading(reading.meter_id, reading.reading_date, reading.id);
//   let consumption = previous ? parseFloat(reading.reading_value) - parseFloat(previous.reading_value) : null;
//   // A reading can only be lower than the previous one if it was submitted
//   // with isRollover: true (submitReading blocks it otherwise). The meter
//   // reset, so consumption restarts from zero = the new reading itself.
//   if (consumption !== null && consumption < 0) {
//     consumption = parseFloat(reading.reading_value);
//   }

//   let abnormal = false;
//   if (previous) {
//     const priorPrevious = await repository.findLastAcceptedReading(reading.meter_id, previous.reading_date, previous.id);
//     if (priorPrevious) {
//       const priorConsumption = parseFloat(previous.reading_value) - parseFloat(priorPrevious.reading_value);
//       if (priorConsumption > 0 && consumption > priorConsumption * ABNORMAL_JUMP_MULTIPLIER) {
//         abnormal = true;
//       }
//     }
//   }

//   const updated = await repository.updateReadingStatus(id, 'VALIDATED');
//   return { ...updated, consumption, abnormalConsumption: abnormal };
// };

// const rejectReading = async (id, remarks) => {
//   const reading = await repository.findReadingById(id);
//   if (!reading) throw new ApiError(404, 'Reading not found');
//   if (reading.status !== 'SUBMITTED' && reading.status !== 'ESTIMATED') {
//     throw new ApiError(400, `Cannot reject a reading that is currently ${reading.status}`);
//   }
//   return repository.updateReadingStatus(id, 'REJECTED');
// };

// /** Later adjustment of an ESTIMATED reading once the actual value is known. */
// const adjustReading = async (id, { actualValue }) => {
//   const reading = await repository.findReadingById(id);
//   if (!reading) throw new ApiError(404, 'Reading not found');
//   if (reading.status !== 'ESTIMATED' && reading.status !== 'VALIDATED') {
//     throw new ApiError(400, 'Only an ESTIMATED or VALIDATED reading can be adjusted');
//   }
//   return repository.adjustReading(id, { readingValue: actualValue, status: 'SUBMITTED' });
// };

// // --- utility bills --------------------------------------------------------------------

// /**
//  * Calculates a bill from a VALIDATED reading using the applicable
//  * tariff's slab_config. slab_config shape (JSONB) is expected as:
//  *   { "flatRate": 8.5 } for a simple flat rate, OR
//  *   { "slabs": [ { "upTo": 100, "rate": 5 }, { "upTo": null, "rate": 8 } ] }
//  * for tiered slab billing. This is my own interpretation of how to use
//  * the JSONB config - the doc specifies the column exists, not its exact
//  * internal shape.
//  */
// const calculateAmount = (consumption, slabConfig) => {
//   if (slabConfig.flatRate !== undefined) {
//     return consumption * slabConfig.flatRate;
//   }
//   if (Array.isArray(slabConfig.slabs)) {
//     let remaining = consumption;
//     let total = 0;
//     let lowerBound = 0;
//     for (const slab of slabConfig.slabs) {
//       const slabCapacity = slab.upTo === null ? remaining : Math.max(slab.upTo - lowerBound, 0);
//       const unitsInSlab = Math.min(remaining, slabCapacity);
//       total += unitsInSlab * slab.rate;
//       remaining -= unitsInSlab;
//       lowerBound = slab.upTo;
//       if (remaining <= 0) break;
//     }
//     return total;
//   }
//   throw new ApiError(400, 'Tariff slab_config is not in a recognized shape (expected flatRate or slabs)');
// };

// const createBillFromReading = async (readingId) => {
//   const reading = await repository.findReadingById(readingId);
//   if (!reading) throw new ApiError(404, 'Reading not found');
//   if (reading.status !== 'VALIDATED') {
//     throw new ApiError(400, 'A bill can only be calculated from a VALIDATED reading');
//   }

//   const meter = await utilityRepository.findMeterById(reading.meter_id);
//   const previous = await repository.findLastAcceptedReading(reading.meter_id, reading.reading_date, reading.id);
//   if (!previous) {
//     throw new ApiError(400, 'No prior accepted reading found to calculate consumption against');
//   }

//   let consumption = parseFloat(reading.reading_value) - parseFloat(previous.reading_value);
//   if (consumption < 0) {
//     consumption = parseFloat(reading.reading_value); // recorded rollover/reset - see validateReading
//   }
//   const tariff = await utilityRepository.findApplicableTariff(meter.utility_type_id, reading.reading_date);
//   if (!tariff) {
//     throw new ApiError(400, 'No applicable tariff found for this utility type on this date');
//   }

//   const amount = calculateAmount(consumption, tariff.slab_config);

//   const bill = await repository.createBill({
//     meterId: meter.id,
//     previousReading: previous.reading_value,
//     currentReading: reading.reading_value,
//     consumption,
//     amount,
//   });

//   await repository.updateReadingStatus(readingId, 'BILLED');
//   return bill;
// };

// const listBillsForMeter = (meterId) => repository.listBillsForMeter(meterId);

// const getBill = async (id) => {
//   const bill = await repository.findBillById(id);
//   if (!bill) throw new ApiError(404, 'Utility bill not found');
//   return bill;
// };

// /** Links a calculated bill to the teammate's Billing-phase records (placeholder ids, no FK validation possible here). */
// const linkBillToInvoice = async (id, payload) => {
//   const bill = await repository.findBillById(id);
//   if (!bill) throw new ApiError(404, 'Utility bill not found');
//   return repository.linkBillToInvoice(id, { ...payload, status: 'INVOICED' });
// };

// module.exports = {
//   submitReading,
//   submitEstimatedReading,
//   listReadings,
//   getReading,
//   validateReading,
//   rejectReading,
//   adjustReading,
//   createBillFromReading,
//   listBillsForMeter,
//   getBill,
//   linkBillToInvoice,
// };


// new code after fixing the issues 

const ApiError = require('../../common/ApiError');
const repository = require('./meter-readings.repository');
const utilityRepository = require('../utility-setup/utility-setup.repository');

const ABNORMAL_JUMP_MULTIPLIER = 2;

// Calculate consumption consistently during validation and bill creation.
const calculateConsumption = (currentReading, previousReading, meter = {}) => {
  const current = Number(currentReading);
  const previous = Number(previousReading);

  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    throw new ApiError(400, 'Cannot calculate consumption from invalid meter readings');
  }

  // Normal reading: consumption is the difference.
  if (current >= previous) {
    return current - previous;
  }

  // Lower reading: use the configured rollover limit when available.
  const configuredLimit = [
    meter.max_reading,
    meter.maxReading,
    meter.max_reading_value,
    meter.maxReadingValue,
    meter.max_value,
    meter.maxValue,
    meter.rollover_at,
    meter.rolloverAt,
  ]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > previous);

  // Fallback: infer the next power-of-ten boundary, e.g. 980 -> 1000.
  const inferredLimit =
    10 ** (Math.floor(Math.log10(Math.max(previous, 1))) + 1);

  const rolloverLimit = configuredLimit || inferredLimit;

  if (!Number.isFinite(rolloverLimit) || rolloverLimit <= previous) {
    throw new ApiError(400, 'Cannot determine the meter rollover limit for this reading');
  }

  return (rolloverLimit - previous) + current;
};

// --- readings ---

const submitReading = async ({
  meterId,
  readingDate,
  readingValue,
  source,
  capturedBy,
  imageDocumentId,
  isRollover,
}) => {
  const meter = await utilityRepository.findMeterById(meterId);
  if (!meter) throw new ApiError(404, 'Meter not found');

  const previous = await repository.findLastAcceptedReading(
    meterId,
    readingDate || new Date()
  );

  if (
    previous &&
    readingValue < parseFloat(previous.reading_value) &&
    !isRollover
  ) {
    throw new ApiError(
      400,
      `New reading (${readingValue}) is lower than the previous reading (${previous.reading_value}). ` +
        'If this is a genuine meter reset/rollover, resubmit with isRollover: true.'
    );
  }

  return repository.createReading({
    meterId,
    readingDate,
    readingValue,
    source,
    capturedBy,
    imageDocumentId,
    status: 'SUBMITTED',
  });
};

const submitEstimatedReading = async ({
  meterId,
  readingDate,
  readingValue,
  capturedBy,
}) => {
  const meter = await utilityRepository.findMeterById(meterId);
  if (!meter) throw new ApiError(404, 'Meter not found');

  return repository.createReading({
    meterId,
    readingDate,
    readingValue,
    source: 'MANUAL',
    capturedBy,
    status: 'ESTIMATED',
  });
};

const listReadings = (query) => repository.listReadings(query);

const getReading = async (id) => {
  const reading = await repository.findReadingById(id);
  if (!reading) throw new ApiError(404, 'Reading not found');
  return reading;
};

const validateReading = async (id) => {
  const reading = await repository.findReadingById(id);
  if (!reading) throw new ApiError(404, 'Reading not found');

  if (reading.status !== 'SUBMITTED' && reading.status !== 'ESTIMATED') {
    throw new ApiError(
      400,
      `Cannot validate a reading that is currently ${reading.status}`
    );
  }

  const previous = await repository.findLastAcceptedReading(
    reading.meter_id,
    reading.reading_date,
    reading.id
  );

  const meter = await utilityRepository.findMeterById(reading.meter_id);

  const consumption = previous
    ? calculateConsumption(
        reading.reading_value,
        previous.reading_value,
        meter || {}
      )
    : null;

  let abnormal = false;

  if (previous) {
    const priorPrevious = await repository.findLastAcceptedReading(
      reading.meter_id,
      previous.reading_date,
      previous.id
    );

    if (priorPrevious) {
      const priorConsumption =
        parseFloat(previous.reading_value) -
        parseFloat(priorPrevious.reading_value);

      if (
        priorConsumption > 0 &&
        consumption > priorConsumption * ABNORMAL_JUMP_MULTIPLIER
      ) {
        abnormal = true;
      }
    }
  }

  const updated = await repository.updateReadingStatus(id, 'VALIDATED');

  return {
    ...updated,
    consumption,
    abnormalConsumption: abnormal,
  };
};

const rejectReading = async (id, remarks) => {
  const reading = await repository.findReadingById(id);
  if (!reading) throw new ApiError(404, 'Reading not found');

  if (reading.status !== 'SUBMITTED' && reading.status !== 'ESTIMATED') {
    throw new ApiError(
      400,
      `Cannot reject a reading that is currently ${reading.status}`
    );
  }

  return repository.updateReadingStatus(id, 'REJECTED');
};

const adjustReading = async (id, { actualValue }) => {
  const reading = await repository.findReadingById(id);
  if (!reading) throw new ApiError(404, 'Reading not found');

  if (reading.status !== 'ESTIMATED' && reading.status !== 'VALIDATED') {
    throw new ApiError(
      400,
      'Only an ESTIMATED or VALIDATED reading can be adjusted'
    );
  }

  return repository.adjustReading(id, {
    readingValue: actualValue,
    status: 'SUBMITTED',
  });
};

// --- utility bills ---

const calculateAmount = (consumption, slabConfig) => {
  if (slabConfig.flatRate !== undefined) {
    return consumption * slabConfig.flatRate;
  }

  if (Array.isArray(slabConfig.slabs)) {
    let remaining = consumption;
    let total = 0;
    let lowerBound = 0;

    for (const slab of slabConfig.slabs) {
      const slabCapacity =
        slab.upTo === null
          ? remaining
          : Math.max(slab.upTo - lowerBound, 0);

      const unitsInSlab = Math.min(remaining, slabCapacity);

      total += unitsInSlab * slab.rate;
      remaining -= unitsInSlab;
      lowerBound = slab.upTo;

      if (remaining <= 0) break;
    }

    return total;
  }

  throw new ApiError(
    400,
    'Tariff slab_config is not in a recognized shape (expected flatRate or slabs)'
  );
};

const createBillFromReading = async (readingId) => {
  const reading = await repository.findReadingById(readingId);
  if (!reading) throw new ApiError(404, 'Reading not found');

  if (reading.status !== 'VALIDATED') {
    throw new ApiError(
      400,
      'A bill can only be calculated from a VALIDATED reading'
    );
  }

  const meter = await utilityRepository.findMeterById(reading.meter_id);

  const previous = await repository.findLastAcceptedReading(
    reading.meter_id,
    reading.reading_date,
    reading.id
  );

  if (!previous) {
    throw new ApiError(
      400,
      'No prior accepted reading found to calculate consumption against'
    );
  }

  // Use the same calculation as validation, including rollover.
  const consumption = calculateConsumption(
    reading.reading_value,
    previous.reading_value,
    meter || {}
  );

  const tariff = await utilityRepository.findApplicableTariff(
    meter.utility_type_id,
    reading.reading_date
  );

  if (!tariff) {
    throw new ApiError(
      400,
      'No applicable tariff found for this utility type on this date'
    );
  }

  const amount = calculateAmount(consumption, tariff.slab_config);

  const bill = await repository.createBill({
    meterId: meter.id,
    previousReading: previous.reading_value,
    currentReading: reading.reading_value,
    consumption,
    amount,
  });

  await repository.updateReadingStatus(readingId, 'BILLED');

  return bill;
};

const listBillsForMeter = (meterId) =>
  repository.listBillsForMeter(meterId);

const getBill = async (id) => {
  const bill = await repository.findBillById(id);
  if (!bill) throw new ApiError(404, 'Utility bill not found');
  return bill;
};

const linkBillToInvoice = async (id, payload) => {
  const bill = await repository.findBillById(id);
  if (!bill) throw new ApiError(404, 'Utility bill not found');

  return repository.linkBillToInvoice(id, {
    ...payload,
    status: 'INVOICED',
  });
};

module.exports = {
  submitReading,
  submitEstimatedReading,
  listReadings,
  getReading,
  validateReading,
  rejectReading,
  adjustReading,
  createBillFromReading,
  listBillsForMeter,
  getBill,
  linkBillToInvoice,
};