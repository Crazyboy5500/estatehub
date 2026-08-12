const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const Property = require('../models/Property');
const Review = require('../models/Review');
const Visit = require('../models/Visit');

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Noida'];
const TYPES = ['Apartment', 'Villa', 'House', 'Plot', 'Commercial', 'PG'];
const AMENITIES = ['Swimming Pool', 'Gym', 'Parking', 'Lift', 'Power Backup', 'Club House', 'Security', 'Garden', 'Children Play Area', 'Intercom'];

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const IMAGE_IDS = [
  '1568605114967-8130f3a36994', '1570129477492-45c003edd2be', '1580587771525-78b9dba3b914',
  '1600047509807-ba8f99d2cdde', '1600585154526-990dced4db0d', '1564013799919-ab600027ffc6',
  '1512917774080-9991f1c4c750', '1613490493576-7fde63acd811', '1600566753190-17f0baa2a6c3',
  '1600607687920-4e2a09cf159d', '1600210492486-724fe5c67fb0', '1616486338812-3dadae4b4ace',
  '1493809842364-78817add7ffb', '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688',
  '1613977257363-707ba9348227',
];

const randomImages = (count = 3) => {
  const shuffled = [...IMAGE_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`);
};

const VIDEO_POOL = [
  'https://cdn.pixabay.com/video/2020/11/07/55527-501275358_large.mp4', // bedroom & furniture interior
  'https://cdn.pixabay.com/video/2022/08/08/127112-737747526_large.mp4', // bedroom, house interior
  'https://cdn.pixabay.com/video/2016/07/23/3967-175963622_large.mp4', // cozy cabin interior
  'https://cdn.pixabay.com/video/2024/05/08/211152_large.mp4', // swimming pool villa
  'https://cdn.pixabay.com/video/2022/02/04/106674-673786323_large.mp4', // swimming pool house
  'https://cdn.pixabay.com/video/2024/02/26/201985-916894647_large.mp4', // apartment & sofa
  'https://cdn.pixabay.com/video/2020/11/07/55529-501275364_large.mp4', // 3D real estate render
  'https://cdn.pixabay.com/video/2020/11/07/55298-499594243_large.mp4', // modern interior
];

const PANORAMA_POOL = [
  'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg',
  'https://pannellum.org/images/alma.jpg',
  'https://threejs.org/examples/textures/equirectangular.png',
];

const seed = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB, seeding...');

    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Review.deleteMany({}),
      Visit.deleteMany({}),
    ]);

    const password = 'password123';
    const admin = await User.create({
      name: 'EstateHub Admin',
      email: 'admin@estatehub.dev',
      password,
      role: 'admin',
      isEmailVerified: true,
    });

    const owners = [];
    for (let i = 1; i <= 6; i++) {
      owners.push(
        await User.create({
          name: `Agent ${i}`,
          email: `owner${i}@estatehub.dev`,
          password,
          role: 'owner',
          phone: `+91 98${randInt(10000000, 99999999)}`,
          isEmailVerified: true,
          bio: 'Experienced real estate agent.',
          location: random(CITIES),
        })
      );
    }

    const buyers = [];
    for (let i = 1; i <= 8; i++) {
      buyers.push(
        await User.create({
          name: `Buyer ${i}`,
          email: `buyer${i}@estatehub.dev`,
          password,
          role: 'buyer',
          phone: `+91 99${randInt(10000000, 99999999)}`,
          isEmailVerified: true,
        })
      );
    }

    const properties = [];
    for (let i = 0; i < 60; i++) {
      const owner = random(owners);
      const city = random(CITIES);
      const type = random(TYPES);
      const purpose = Math.random() > 0.35 ? 'sale' : 'rent';
      const bedrooms = type === 'Plot' || type === 'Commercial' || type === 'PG' ? 0 : randInt(1, 5);
      const bathrooms = type === 'Plot' || type === 'Commercial' ? 0 : Math.max(1, Math.round(bedrooms / 2) || 1);
      const area = type === 'Plot' ? randInt(1000, 5000) : randInt(500, 3500);
      const basePrice = area * randInt(4000, 20000);
      const price = purpose === 'rent' ? Math.round(basePrice / 100) * 100 : Math.round(basePrice / 100000) * 100000;

      const amenities = [...new Set([random(AMENITIES), random(AMENITIES), random(AMENITIES), random(AMENITIES)])];

      properties.push(
        await Property.create({
          ownerId: owner._id,
          title: `${type} for ${purpose === 'sale' ? 'Sale' : 'Rent'} in ${city} – ${randInt(1, 20)} ${random(['Oak', 'Maple', 'Rose', 'Sunrise', 'Emerald', 'Cedar'])} ${random(['Enclave', 'Heights', 'Residency', 'Towers', 'Garden', 'Villa'])}`,
          description: `Beautiful ${type.toLowerCase()} with ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''}, ${bathrooms} bathroom${bathrooms !== 1 ? 's' : ''} spread over ${area} sq.ft. Well connected to metro and schools. Perfect for families.`,
          type,
          purpose,
          price,
          pricePerSqft: Math.round((price / area) * 100) / 100,
          area,
          bedrooms,
          bathrooms,
          balconies: bedrooms > 0 ? randInt(1, 3) : 0,
          floors: randInt(1, 3),
          totalFloors: randInt(3, 20),
          parking: bedrooms > 0 ? randInt(0, 2) : 0,
          furnished: random(['Unfurnished', 'Semi-Furnished', 'Fully-Furnished']),
          age: randInt(0, 25),
          address: `${randInt(1, 500)}, ${random(['MG Road', 'Ring Road', 'Park Avenue', 'Lake View Street', 'Market Lane'])}`,
          city,
          state: city === 'Delhi' || city === 'Noida' ? 'Delhi NCR' : 'Maharashtra',
          pincode: String(randInt(110000, 560000)),
          coordinates: { lat: 19.076 + (Math.random() - 0.5) * 6, lng: 72.8777 + (Math.random() - 0.5) * 6 },
          images: randomImages(3),
          video: i % 2 === 0 ? random(VIDEO_POOL) : '',
          panorama: i % 4 === 0 ? random(PANORAMA_POOL) : '',
          amenities,
          status: i < 12 ? 'pending' : i % 7 === 0 ? 'sold' : i % 9 === 0 ? 'rented' : 'verified',
          featured: i % 6 === 0,
          views: randInt(50, 4000),
          rating: randInt(30, 50) / 10,
          ratingCount: randInt(1, 30),
        })
      );
    }

    const reviews = [];
    const seenPairs = new Set();
    for (let i = 0; i < 40; i++) {
      const buyer = buyers[i % buyers.length];
      const property = random(properties);
      if (property.ownerId.toString() === buyer._id.toString()) continue;
      const pair = `${buyer._id}:${property._id}`;
      if (seenPairs.has(pair)) continue;
      seenPairs.add(pair);
      reviews.push(
        await Review.create({
          userId: buyers[i % buyers.length]._id,
          propertyId: property._id,
          rating: randInt(3, 5),
          comment: random([
            'Great property, exactly as described. Highly recommend!',
            'Smooth process and helpful owner.',
            'Good location and well maintained.',
            'The neighborhood is quiet and family friendly.',
            'Value for money. Would definitely consider again.',
          ]),
        })
      );
    }

    for (let i = 0; i < 15; i++) {
      const property = random(properties);
      await Visit.create({
        buyerId: random(buyers)._id,
        ownerId: property.ownerId,
        propertyId: property._id,
        date: new Date(Date.now() + randInt(1, 20) * 86400000),
        time: `${randInt(10, 18)}:00`,
        message: 'I would like to see this property.',
        status: random(['pending', 'accepted', 'rejected', 'completed']),
      });
    }

    console.log(`Seeded: ${await User.countDocuments()} users, ${await Property.countDocuments()} properties, ${await Review.countDocuments()} reviews, ${await Visit.countDocuments()} visits`);
    console.log('Demo logins:');
    console.log(`  Admin: admin@estatehub.dev / ${password}`);
    console.log(`  Owner: owner1@estatehub.dev / ${password}`);
    console.log(`  Buyer: buyer1@estatehub.dev / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
