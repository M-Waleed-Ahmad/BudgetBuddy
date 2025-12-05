const Subscription = require('../models/Subscription');
const Entitlement = require('../models/Entitlement');

// Stripe initialized from env (test-mode only). Never hard-code keys.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecret);

// Map plan -> price IDs (set these in .env as valid test price IDs from Stripe dashboard)
const PRICE_MAP = {
  family: process.env.STRIPE_PRICE_FAMILY_BUDGETING,
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
};

const SUCCESS_URL = `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${process.env.FRONTEND_URL}/billing/cancel`;

const resolvePriceId = (planKey, explicitPriceId) => {
  // Prefer explicit priceId from frontend (validated), else map, else family default
  const priceId = explicitPriceId || PRICE_MAP[planKey] || PRICE_MAP.family;
  if (!priceId || !priceId.startsWith('price_')) return null;
  return priceId;
};

// POST /api/billing/checkout-session
const createCheckoutSession = async (req, res) => {
  if (!stripeSecret || !stripeSecret.startsWith('sk_test_')) {
    console.error('Stripe secret key missing or not test-mode (sk_test_*)');
    return res.status(500).json({ success: false, message: 'Payments are not configured. Please try again later.', data: null });
  }
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required', data: null });

    const { plan = 'family', priceId: bodyPriceId } = req.body || {};
    const priceId = resolvePriceId(plan, bodyPriceId);
    if (!priceId) {
      console.error('Missing/invalid Stripe price id. Set STRIPE_PRICE_* env vars with valid test price IDs.');
      return res.status(400).json({ success: false, message: 'Payment configuration unavailable. Please contact support.', data: null });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { userId, plan },
    });

    return res.status(200).json({ success: true, data: { url: session.url }, message: 'Checkout session created' });
  } catch (err) {
    console.error('Error creating checkout session', err);
    const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: 'Unable to create checkout session. Please try again later.', data: null });
  }
};

// POST /api/billing/confirm
// Confirms a checkout session and marks the user as premium (test-mode only).
const confirmCheckoutSession = async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required', data: null });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'line_items'] });
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed yet. Please try again shortly.', data: null });
    }

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan || 'family';
    if (!userId) {
      console.error('Missing userId in session metadata', sessionId);
      return res.status(400).json({ success: false, message: 'Unable to map payment to user.', data: null });
    }

    const sub = session.subscription;
    const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000) : null;
    const priceId = sub?.items?.data?.[0]?.price?.id || session?.line_items?.data?.[0]?.price?.id || null;

    const update = {
      isPremium: true,
      premiumPlan: plan,
      stripeCustomerId: session.customer || null,
      stripeSubscriptionId: sub?.id || sub || null,
      premiumUntil: periodEnd,
    };

    // Update User document with premium flags
    await require('../models/User').findByIdAndUpdate(userId, update, { new: true });

    // Upsert subscription record as well
    await Subscription.findOneAndUpdate(
      { user_id: userId },
      {
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: sub?.id || sub || null,
        status: 'active',
        price_id: priceId || PRICE_MAP[plan],
        current_period_end: periodEnd || undefined,
      },
      { upsert: true, new: true }
    );

    await Entitlement.findOneAndUpdate(
      { user_id: userId, feature: 'family_budgeting' },
      { user_id: userId, feature: 'family_budgeting', active: true, source: 'stripe', metadata: { sessionId, plan } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Subscription activated.', data: { plan, periodEnd } });
  } catch (err) {
    console.error('Error confirming checkout session', err);
    const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    return res.status(status).json({ success: false, message: 'Unable to confirm payment. Please contact support.', data: null });
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
        price_id: session?.line_items?.data?.[0]?.price?.id || PRICE_MAP.family,
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

module.exports = { createCheckoutSession, handleWebhook, confirmCheckoutSession };
