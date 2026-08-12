const Message = require('../models/Message');
const { Conversation } = require('../models/Message');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const { notifyUser } = require('./notificationController');

const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId, propertyId } = req.body;
    if (!userId) throw new AppError('Recipient is required', 400);

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
      property: propertyId || null,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        property: propertyId || null,
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort('-lastMessageAt')
      .populate('participants', 'name profileImage role')
      .populate('property', 'title images city');
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      throw new AppError('Not a participant of this conversation', 403);
    }

    await Message.updateMany(
      { conversation: conversationId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    const messages = await Message.find({ conversation: conversationId })
      .sort('createdAt')
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage');
    res.json({ success: true, data: messages, conversation });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { text, propertyId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      throw new AppError('Not a participant of this conversation', 403);
    }

    const receiver = conversation.participants.find((p) => String(p) !== String(req.user._id));

    let property = conversation.property;
    if (propertyId && !property) {
      const found = await Property.findById(propertyId);
      if (found) property = found._id;
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      receiver,
      property: property || null,
      message: text,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    if (property && !conversation.property) conversation.property = property;
    await conversation.save();

    const full = await Message.findById(message._id)
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage')
      .populate('property', 'title images');

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiver}`).emit('message:new', full.toObject());
    }

    await notifyUser({
      io,
      userId: receiver,
      type: 'message',
      message: `${req.user.name}: ${text.slice(0, 120)}`,
      link: `/dashboard/messages?conversation=${conversation._id}`,
    });

    res.status(201).json({ success: true, data: full });
  } catch (error) {
    next(error);
  }
};

const postSystemMessage = async ({ io, propertyId, senderId, receiverId, text }) => {
  if (!propertyId || !senderId || !receiverId || !text) return null;

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
    property: propertyId,
  });
  if (!conversation) {
    conversation = await Conversation.create({ participants: [senderId, receiverId], property: propertyId });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    property: propertyId,
    message: text,
    isSystem: true,
  });

  conversation.lastMessage = text;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  if (io) {
    const payload = message.toObject();
    io.to(`user:${senderId}`).emit('message:new', payload);
    io.to(`user:${receiverId}`).emit('message:new', payload);
  }

  return conversation;
};

module.exports = { getOrCreateConversation, getConversations, getMessages, sendMessage, postSystemMessage };
