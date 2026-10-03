/**
 * Seeds demo accounts with realistic data so the app can be explored right away.
 *
 *   npm run seed
 *
 * Only the demo accounts below (and data linked to them) are reset; other users are untouched.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');
const Category = require('../models/Category');
const MonthlyBudget = require('../models/MonthlyBudget');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const FamilyPlan = require('../models/FamilyPlan');
const FamilyMember = require('../models/FamilyMember');
const FamilyBudget = require('../models/FamilyBudget');
const FamilyExpense = require('../models/FamilyExpense');
const Invite = require('../models/Invite');
const Notification = require('../models/Notification');
const { lastMonths, monthRange, startOfUtcDay, addDays } = require('../utils/dates');

const DEMO_PASSWORD = 'DemoPass123';
const DEMO_USERS = [
  { key: 'alex', name: 'Alex Morgan', email: 'demo@budgetbuddy.app' },
  { key: 'sara', name: 'Sara Khan', email: 'sara@budgetbuddy.app' },
];

const CATEGORY_PLAN = [
  // name, monthly limit, typical expenses per month, [min, max] amount, descriptions
  ['Rent', 45000, 1, [45000, 45000], ['Monthly rent']],
  ['Groceries', 25000, 8, [1200, 4500], ['Weekly groceries', 'Fruit & vegetables', 'Supermarket run', 'Bakery']],
  ['Utilities', 12000, 3, [2500, 5000], ['Electricity bill', 'Gas bill', 'Internet']],
  ['Transport', 10000, 6, [600, 2200], ['Fuel', 'Ride share', 'Car wash', 'Parking']],
  ['Dining Out', 8000, 4, [900, 3200], ['Dinner with friends', 'Coffee', 'Lunch at work', 'Pizza night']],
  ['Entertainment', 6000, 2, [800, 2500], ['Cinema', 'Streaming subscription', 'Concert tickets']],
  ['Health', 5000, 1, [1000, 4000], ['Pharmacy', 'Gym membership', 'Doctor visit']],
];

// Small deterministic PRNG so every seed run produces the same data.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
const random = createRandom(42);
const pick = (items) => items[Math.floor(random() * items.length)];
const between = (min, max) => Math.round((min + random() * (max - min)) / 10) * 10;

async function removeExistingDemoData() {
  const users = await User.find({ email: { $in: DEMO_USERS.map((u) => u.email) } }).select('_id').lean();
  const userIds = users.map((u) => u._id);
  if (!userIds.length) return;

  const plans = await FamilyPlan.find({ owner_user_id: { $in: userIds } }).select('_id').lean();
  const planIds = plans.map((p) => p._id);

  await Promise.all([
    Category.deleteMany({ user_id: { $in: userIds } }),
    MonthlyBudget.deleteMany({ user_id: { $in: userIds } }),
    Budget.deleteMany({ user_id: { $in: userIds } }),
    Expense.deleteMany({ user_id: { $in: userIds } }),
    Notification.deleteMany({ recipient_user_id: { $in: userIds } }),
    FamilyMember.deleteMany({ $or: [{ user_id: { $in: userIds } }, { plan_id: { $in: planIds } }] }),
    FamilyBudget.deleteMany({ plan_id: { $in: planIds } }),
    FamilyExpense.deleteMany({ plan_id: { $in: planIds } }),
    Invite.deleteMany({ $or: [{ plan_id: { $in: planIds } }, { invitee_user_id: { $in: userIds } }] }),
    FamilyPlan.deleteMany({ _id: { $in: planIds } }),
  ]);
  await User.deleteMany({ _id: { $in: userIds } });
}

async function createUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = {};
  for (const demo of DEMO_USERS) {
    users[demo.key] = await User.create({
      name: demo.name,
      email: demo.email,
      password_hash: passwordHash,
      currency_preference: 'PKR',
    });
  }
  return users;
}

async function seedPersonalFinances(user) {
  const today = startOfUtcDay(new Date());
  const months = lastMonths(6);
  const currentMonth = months[months.length - 1];

  const categories = {};
  for (const [name] of CATEGORY_PLAN) {
    categories[name] = await Category.create({ name, user_id: user._id });
  }

  const { start, endExclusive } = monthRange(currentMonth);
  await MonthlyBudget.create({
    user_id: user._id,
    month_year: currentMonth,
    total_budget_amount: 150000,
    start_date: start,
    end_date: addDays(endExclusive, -1),
  });

  await Budget.insertMany(
    CATEGORY_PLAN.map(([name, limit]) => ({
      user_id: user._id,
      category_id: categories[name]._id,
      month_year: currentMonth,
      limit_amount: limit,
    }))
  );

  const expenses = [];
  months.forEach((month) => {
    const range = monthRange(month);
    const isCurrent = month === currentMonth;
    const lastDay = isCurrent ? today.getUTCDate() : addDays(range.endExclusive, -1).getUTCDate();
    // Spread the current month's expenses over the days that have passed so far.
    const share = isCurrent ? Math.max(0.25, lastDay / 30) : 1;

    CATEGORY_PLAN.forEach(([name, , perMonth, [min, max], descriptions]) => {
      const count = name === 'Rent' ? 1 : Math.max(1, Math.round(perMonth * share * (0.7 + random() * 0.6)));
      for (let i = 0; i < count; i += 1) {
        const day = name === 'Rent' ? 1 : 1 + Math.floor(random() * lastDay);
        expenses.push({
          user_id: user._id,
          category_id: categories[name]._id,
          amount: between(min, max),
          description: pick(descriptions),
          expense_date: new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), day)),
        });
      }
    });
  });
  await Expense.insertMany(expenses);

  return categories;
}

async function seedFamily({ alex, sara }, categories) {
  const today = startOfUtcDay(new Date());
  const { start, endExclusive } = monthRange(lastMonths(1)[0]);

  const household = await FamilyPlan.create({
    plan_name: 'Morgan Household',
    owner_user_id: alex._id,
    total_budget_amount: 80000,
    start_date: start,
    end_date: addDays(endExclusive, -1),
    currency: 'PKR',
    require_approval: true,
  });
  await FamilyMember.insertMany([
    { plan_id: household._id, user_id: alex._id, role: 'admin' },
    { plan_id: household._id, user_id: sara._id, role: 'editor' },
  ]);
  await FamilyBudget.insertMany([
    { plan_id: household._id, category_id: categories.Groceries._id, limit_amount: 30000 },
    { plan_id: household._id, category_id: categories.Utilities._id, limit_amount: 15000 },
    { plan_id: household._id, category_id: categories['Dining Out']._id, limit_amount: 10000 },
  ]);

  const day = (offset) => (offset < today.getUTCDate() ? addDays(start, offset) : today);
  const familyExpenses = await FamilyExpense.insertMany([
    { added_by_user_id: alex._id, category_id: categories.Groceries._id, amount: 6400, description: 'Monthly bulk groceries', expense_date: day(1), status: 'approved' },
    { added_by_user_id: sara._id, category_id: categories.Utilities._id, amount: 4800, description: 'Electricity bill', expense_date: day(3), status: 'approved', approved_by_user_id: alex._id },
    { added_by_user_id: sara._id, category_id: categories.Groceries._id, amount: 3150, description: 'Fresh produce', expense_date: day(6), status: 'approved', approved_by_user_id: alex._id },
    { added_by_user_id: alex._id, category_id: categories['Dining Out']._id, amount: 5200, description: 'Family dinner', expense_date: day(9), status: 'approved' },
    { added_by_user_id: sara._id, category_id: categories.Groceries._id, amount: 2750, description: 'Snacks for guests', expense_date: day(12), status: 'rejected', approved_by_user_id: alex._id },
    { added_by_user_id: sara._id, category_id: categories.Utilities._id, amount: 3900, description: 'Internet + phone', expense_date: today, status: 'pending' },
  ].map((expense) => ({ ...expense, plan_id: household._id })));

  // A plan Sara owns, with a pending invitation for Alex to explore the invite flow.
  const trip = await FamilyPlan.create({
    plan_name: 'Hunza Road Trip',
    owner_user_id: sara._id,
    total_budget_amount: 120000,
    currency: 'PKR',
  });
  await FamilyMember.create({ plan_id: trip._id, user_id: sara._id, role: 'admin' });
  const invite = await Invite.create({
    plan_id: trip._id,
    invitee_user_id: alex._id,
    inviter_user_id: sara._id,
    invitee_email: alex.email,
    role_assigned: 'editor',
  });

  const pending = familyExpenses.find((expense) => expense.status === 'pending');
  await Notification.insertMany([
    {
      recipient_user_id: alex._id,
      type: 'generic_message',
      message: 'Welcome to BudgetBuddy, Alex Morgan! Start by setting a monthly budget and adding your categories.',
      link: '/budget-management',
      is_read: true,
      created_at: addDays(new Date(), -20),
    },
    {
      recipient_user_id: alex._id,
      type: 'invite_accepted',
      message: 'Sara Khan accepted your invitation to "Morgan Household".',
      actor_user_id: sara._id,
      link: `/shared-budgeting?plan=${household._id}`,
      is_read: true,
      created_at: addDays(new Date(), -14),
    },
    {
      recipient_user_id: alex._id,
      type: 'invite_received',
      message: 'Sara Khan invited you to join "Hunza Road Trip" as an editor.',
      actor_user_id: sara._id,
      related_entity: { id: invite._id, model_type: 'Invite' },
      link: '/settings',
      created_at: addDays(new Date(), -1),
    },
    {
      recipient_user_id: alex._id,
      type: 'expense_needs_approval',
      message: 'Sara Khan added PKR 3,900.00 for Utilities ("Internet + phone") to "Morgan Household". It needs your approval.',
      actor_user_id: sara._id,
      related_entity: { id: pending._id, model_type: 'FamilyExpense' },
      link: `/shared-budgeting?plan=${household._id}`,
      created_at: new Date(),
    },
  ]);
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected. Resetting demo data...');

  await removeExistingDemoData();
  const users = await createUsers();
  const categories = await seedPersonalFinances(users.alex);
  await seedFamily(users, categories);

  console.log('\nDemo data ready. Log in with:');
  DEMO_USERS.forEach((demo) => console.log(`  ${demo.email}  /  ${DEMO_PASSWORD}`));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
