const { cloudinary, isConfigured } = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (filePath, options = {}) => {
  if (!isConfigured) {
    return null;
  }
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: options.resourceType || 'auto',
    folder: options.folder || 'estatehub',
    transformation: options.transformation || [],
  });
  return result.secure_url;
};

const deleteLocalFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.warn('Failed to delete local file:', error.message);
  }
};

module.exports = { uploadToCloudinary, deleteLocalFile };
