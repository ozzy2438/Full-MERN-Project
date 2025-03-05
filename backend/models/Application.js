// backend/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: String, // ObjectId yerine String olarak değiştirdik
    required: true
  },
  job: {
    title: String,
    company: String,
    location: String,
    description: String,
    salary: String,
    employmentType: String,
    applicationUrl: String
  },
  status: {
    type: String,
    enum: ['Başvuruldu', 'Değerlendiriliyor', 'Mülakat', 'Teklif', 'Kabul Edildi', 'Reddedildi', 'İptal'],
    default: 'Başvuruldu'
  },
  timeline: [{
    status: String,
    notes: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  nextAction: {
    type: { type: String }, // e.g., "interview", "follow-up", "document-submission"
    dueDate: Date,
    description: String
  },
  notes: [{
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp before saving
applicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
