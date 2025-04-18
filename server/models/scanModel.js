const mongoose = require('mongoose');

const scanSchema = mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Идет анализ', 'Успешно', 'Ошибка'],
      default: 'Идет анализ',
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    vulnerabilitiesCount: {
      type: Number,
      default: 0,
    },
    priorities: {
      type: [
        {
          level: Number,
          count: Number,
        },
      ],
      default: [],
    },
    stats: {
      critical: {
        type: Number,
        default: 0,
      },
      high: {
        type: Number,
        default: 0,
      },
      medium: {
        type: Number,
        default: 0,
      },
      low: {
        type: Number,
        default: 0,
      },
      info: {
        type: Number,
        default: 0,
      },
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;