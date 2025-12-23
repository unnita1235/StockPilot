const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Raw Material', 'Packaging Material', 'Product for Sale']
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    min: [0, 'Threshold cannot be negative'],
    default: 10
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ stock: 1 });

// Virtual to check if item is low on stock
itemSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Include virtuals in JSON output
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);
