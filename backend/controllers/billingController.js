const Subscription = require('../models/Subscription');
const Entitlement = require('../models/Entitlement');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICE_ID = process.env.STRIPE_PRICE_FAMILY_BUDGETING;
const SUCCESS_URL = `${process.env.FRONTEND_URL}/billing/success`;
const CANCEL_URL = `${process.env.FRONTEND_URL}/billing/cancel`;

// POST /api/billing/checkout-session
const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required', data: null });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { userId },
    });

    return res.status(200).json({ success: true, data: { url: session.url }, message: 'Checkout session created' });
  } catch (err) {
    console.error('Error creating checkout session', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', data: null });
  }
};

// POST /api/billing/webhook
const handleWebhook = async (req, res) => {
  let event = req.body;
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, endpointSecret);
    }
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(event);
        break;
      case 'customer.subscription.deleted':
        await deactivateSubscription(event);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling failed', err);
    res.status(500).json({ received: false });
  }
};

const handleCheckoutSessionCompleted = async (event) => {
  const session = event.data.object;
  const userId = session.metadata?.userId;
  if (!userId) return;

  await Entitlement.findOneAndUpdate(
    { user_id: userId, feature: 'family_budgeting' },
    { user_id: userId, feature: 'family_budgeting', active: true, source: 'stripe', metadata: { sessionId: session.id } },
    { upsert: true, new: true }
  );

  if (session.subscription) {
    // Attach subscription if available
    await Subscription.findOneAndUpdate(
      { user_id: userId },
      {
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        price_id: PRICE_ID,
      },
      { upsert: true, new: true }
    );
  }
};

const upsertSubscription = async (event) => {
  const obj = event.data.object;
  const userId = obj.metadata?.userId;
  if (!userId) return;

  const sub = await Subscription.findOneAndUpdate(
    { user_id: userId },
    {
      user_id: userId,
      stripe_customer_id: obj.customer,
      stripe_subscription_id: obj.subscription || obj.id,
      status: obj.status || 'active',
      price_id: obj.items?.data?.[0]?.price?.id,
      current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000) : undefined,
    },
    { upsert: true, new: true }
  );

  await Entitlement.findOneAndUpdate(
    { user_id: userId, feature: 'family_budgeting' },
    { user_id: userId, feature: 'family_budgeting', active: true, source: 'stripe', metadata: { subscription: sub._id } },
    { upsert: true, new: true }
  );
};

const deactivateSubscription = async (event) => {
  const obj = event.data.object;
  const userId = obj.metadata?.userId;
  if (!userId) return;

  await Subscription.findOneAndUpdate(
    { user_id: userId },
    { status: 'canceled' }
  );

  await Entitlement.findOneAndUpdate(
    { user_id: userId, feature: 'family_budgeting' },
    { active: false }
  );
};

module.exports = { createCheckoutSession, handleWebhook };
