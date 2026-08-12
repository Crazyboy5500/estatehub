const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
    type: {
      type: String,
      enum: ['Apartment', 'Villa', 'House', 'Plot', 'Commercial', 'PG', 'Other'],
      required: true,
    },
    purpose: { type: String, enum: ['sale', 'rent'], required: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    pricePerSqft: { type: Number, default: 0 },
    area: { type: Number, required: [true, 'Area is required'], min: 0 }, // sq.ft
    bedrooms: { type: Number, default: 0, min: 0 },
    bathrooms: { type: Number, default: 0, min: 0 },
    balconies: { type: Number, default: 0 },
    floors: { type: Number, default: 1 },
    totalFloors: { type: Number, default: 1 },
    parking: { type: Number, default: 0 },
    furnished: { type: String, enum: ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished'], default: 'Unfurnished' },
    age: { type: Number, default: 0 }, // years
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    images: [{ type: String }],
    video: { type: String, default: '' },
    panorama: { type: String, default: '' }, // equirectangular 360° image URL
    amenities: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'sold', 'rented'],
      default: 'pending',
    },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  },
  { timestamps: true }
);

propertySchema.index({ city: 1, purpose: 1, type: 1, price: 1 });
propertySchema.index({ title: 'text', description: 'text', address: 'text', city: 'text' });

propertySchema.methods.toSafeJSON = function () {
  const p = this.toObject();
  return p;
};

module.exports = mongoose.models.Property || mongoose.model('Property', propertySchema);
