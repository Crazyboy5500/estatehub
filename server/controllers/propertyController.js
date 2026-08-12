const Property = require('../models/Property');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');
const { uploadToCloudinary, deleteLocalFile } = require('../services/cloudinaryService');
const { notifyUser } = require('./notificationController');

const getProperties = async (req, res, next) => {
  try {
    const features = new APIFeatures(Property.find(), req.query)
      .filter()
      .rangeFilter()
      .keyword()
      .sort()
      .paginate();

    const total = await Property.countDocuments(
      features.query._conditions
    );

    const properties = await features.query.populate('ownerId', 'name email phone profileImage');

    res.json({
      success: true,
      count: properties.length,
      total,
      page: features.pagination.page,
      pages: Math.ceil(total / features.pagination.limit),
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ featured: true, status: 'verified' })
      .sort('-createdAt')
      .limit(8)
      .populate('ownerId', 'name email phone profileImage');
    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

const getLatestProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ status: 'verified' })
      .sort('-createdAt')
      .limit(8)
      .populate('ownerId', 'name email phone profileImage');
    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

const getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email phone profileImage role');
    if (!property) throw new AppError('Property not found', 404);

    property.views += 1;
    await property.save({ validateBeforeSave: false });

    const reviews = await Review.find({ propertyId: property._id })
      .sort('-createdAt')
      .populate('userId', 'name profileImage');

    res.json({ success: true, data: { ...property.toSafeJSON(), reviews } });
  } catch (error) {
    next(error);
  }
};

const getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    if (!['owner', 'admin'].includes(req.user.role)) {
      throw new AppError('Only property owners can list properties', 403);
    }

    const {
      title, description, type, purpose, price, area, bedrooms, bathrooms,
      floors, totalFloors, parking, furnished, age, address, city, state,
      pincode, lat, lng, video, panorama,
    } = req.body;

    if (!title || !description || !type || !purpose || !price || !area || !address || !city || !state) {
      throw new AppError('Missing required property fields', 400);
    }

    let images = [];
    if (Array.isArray(req.body.images)) {
      images = req.body.images.filter(Boolean);
    }

    const imageFiles = (req.files && req.files.images) || [];
    if (imageFiles.length) {
      const uploaded = await Promise.all(
        imageFiles.map((f) => uploadToCloudinary(f.path, { folder: 'estatehub/properties', resourceType: 'image' }))
      );
      const urls = uploaded.filter(Boolean);
      const localFallback = urls.length < imageFiles.length
        ? imageFiles.map((f) => `/uploads/${f.filename}`)
        : [];
      images = [...images, ...urls, ...localFallback.filter(Boolean)];
      imageFiles.forEach((f) => deleteLocalFile(f.path));
    }

    let videoUrl = video || '';
    const videoFile = (req.files && req.files.video && req.files.video[0]) || null;
    if (videoFile) {
      const uploaded = await uploadToCloudinary(videoFile.path, { folder: 'estatehub/videos', resourceType: 'video' });
      videoUrl = uploaded || `/uploads/${videoFile.filename}`;
      deleteLocalFile(videoFile.path);
    }

    let amenities = [];
    if (Array.isArray(req.body.amenities)) {
      amenities = req.body.amenities;
    } else if (typeof req.body.amenities === 'string' && req.body.amenities) {
      try {
        amenities = JSON.parse(req.body.amenities);
      } catch {
        amenities = req.body.amenities.split(',');
      }
    }

    const property = await Property.create({
      ownerId: req.user._id,
      title, description, type, purpose,
      price: Number(price),
      pricePerSqft: price && area ? Math.round((Number(price) / Number(area)) * 100) / 100 : 0,
      area: Number(area),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      floors: Number(floors) || 1,
      totalFloors: Number(totalFloors) || 1,
      parking: Number(parking) || 0,
      furnished: furnished || 'Unfurnished',
      age: Number(age) || 0,
      address, city, state,
      pincode: pincode || '',
      coordinates: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
      images,
      video: videoUrl,
      panorama: panorama || '',
      amenities,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new AppError('Property not found', 404);
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized to edit this property', 403);
    }

    const updatable = [
      'title', 'description', 'type', 'purpose', 'price', 'area', 'bedrooms',
      'bathrooms', 'floors', 'totalFloors', 'parking', 'furnished', 'age',
      'address', 'city', 'state', 'pincode', 'video', 'panorama', 'amenities', 'featured', 'status',
    ];
    const updates = {};
    updatable.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (req.body.lat !== undefined || req.body.lng !== undefined) {
      updates.coordinates = {
        lat: Number(req.body.lat) || property.coordinates.lat,
        lng: Number(req.body.lng) || property.coordinates.lng,
      };
    }
    if (req.body.amenities) {
      if (Array.isArray(req.body.amenities)) {
        updates.amenities = req.body.amenities;
      } else {
        try {
          updates.amenities = JSON.parse(req.body.amenities);
        } catch {
          updates.amenities = req.body.amenities.split(',');
        }
      }
    }
    if (updates.price && updates.area) {
      updates.pricePerSqft = Math.round((Number(updates.price) / Number(updates.area)) * 100) / 100;
    }

    const imageFiles = (req.files && req.files.images) || [];
    if (imageFiles.length) {
      const uploaded = await Promise.all(
        imageFiles.map((f) => uploadToCloudinary(f.path, { folder: 'estatehub/properties', resourceType: 'image' }))
      );
      const urls = uploaded.filter(Boolean);
      const localFallback = urls.length < imageFiles.length
        ? imageFiles.map((f) => `/uploads/${f.filename}`)
        : [];
      updates.images = [...(req.body.existingImages ? req.body.existingImages.split(',').filter(Boolean) : property.images), ...urls, ...localFallback.filter(Boolean)];
      imageFiles.forEach((f) => deleteLocalFile(f.path));
    }

    const videoFile = (req.files && req.files.video && req.files.video[0]) || null;
    if (videoFile) {
      const uploaded = await uploadToCloudinary(videoFile.path, { folder: 'estatehub/videos', resourceType: 'video' });
      updates.video = uploaded || `/uploads/${videoFile.filename}`;
      deleteLocalFile(videoFile.path);
    }

    if (req.user.role !== 'admin') {
      updates.status = 'pending';
    }

    const updated = await Property.findByIdAndUpdate(property._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new AppError('Property not found', 404);
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized to delete this property', 403);
    }
    await Review.deleteMany({ propertyId: property._id });
    await property.deleteOne();
    res.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected', 'sold', 'rented'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    const property = await Property.findByIdAndUpdate(id, { status }, { new: true });
    if (!property) throw new AppError('Property not found', 404);

    await notifyUser({
      io: req.app.get('io'),
      userId: property.ownerId,
      type: 'property',
      message: `Your listing "${property.title}" was ${status === 'verified' ? 'approved ✅' : status === 'rejected' ? 'rejected ❌' : `marked as ${status}`}`,
      link: '/dashboard/owner',
    });

    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

const getSimilarProperties = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw new AppError('Property not found', 404);
    const similar = await Property.find({
      _id: { $ne: property._id },
      status: 'verified',
      city: property.city,
      purpose: property.purpose,
    })
      .limit(6)
      .populate('ownerId', 'name profileImage');
    res.json({ success: true, data: similar });
  } catch (error) {
    next(error);
  }
};

const getCities = async (req, res, next) => {
  try {
    const cities = await Property.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
};

const trendingProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ status: 'verified' })
      .sort('-views')
      .limit(6)
      .populate('ownerId', 'name profileImage');
    res.json({ success: true, data: properties });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getFeaturedProperties,
  getLatestProperties,
  getProperty,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  updateStatus,
  getSimilarProperties,
  getCities,
  trendingProperties,
};
