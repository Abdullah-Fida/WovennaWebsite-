const mongoose = require('mongoose');

/**
 * Small key/value store for switches an admin needs to flip without a deploy.
 *
 * Currently one key: `influencerEligibility`, which decides who may apply to
 * the programme —
 *   'delivered' : must have an order marked Delivered (the default)
 *   'any-order' : any order placed, whatever its status
 *   'open'      : any signed-in customer
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

const DEFAULTS = {
  influencerEligibility: 'delivered',
};

async function getSetting(key) {
  const row = await Setting.findOne({ key });
  return row && row.value !== null && row.value !== undefined ? row.value : DEFAULTS[key];
}

async function setSetting(key, value) {
  await Setting.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return value;
}

module.exports = { Setting, getSetting, setSetting, DEFAULTS };
