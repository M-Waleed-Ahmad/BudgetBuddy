const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Invite = require('./models/Invites'); // Adjust path if needed

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding Invites...');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

const seedInvites = async () => {
  try {
    await connectDB();

    // --- Clean existing invites (Optional)
    await Invite.deleteMany({});
    console.log('🧹 Existing Invites Cleared.');

    // --- Static Data
    const inviterIds = [
      '680ee36ef95803fe6eebaad2',
      '680ee377f95803fe6eebaad5',
      '680ee37cf95803fe6eebaad8',
      '680ee382f95803fe6eebaadb'
    ];

    const planIds = [
      '680ee4794e6afa5ed976ae80', // Assuming plan IDs are same as inviter IDs — adjust if different
      '680ee4e40b2f604a08796d32',
      '680ee4f68a433aa23cd9357c',
      '680ee382f95803fe6eebaadb'
    ];

    const invitee = {
      _id: '680ee5075ba9cdfc54c78c3b',
      email: 'waleedtest@example.com'
    };

    const roles = ['viewer', 'editor', 'viewer', 'viewer']; // or cycle / randomize if you want variety

    const invitesToCreate = [];

    for (let i = 0; i < inviterIds.length; i++) {
      invitesToCreate.push({
        plan_id: planIds[i],
        invitee_user_id: invitee._id,
        inviter_user_id: inviterIds[i],
        invitee_email: invitee.email,
        role_assigned: roles[i],
        status: 'pending'
      });
    }

    const createdInvites = await Invite.insertMany(invitesToCreate);
    console.log(`🎉 ${createdInvites.length} Invites Seeded Successfully!`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🛑 MongoDB Disconnected.');
  }
};

seedInvites();
