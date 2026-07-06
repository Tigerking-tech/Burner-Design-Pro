# Creem Payment Integration Guide

## Overview

This guide explains how to set up Creem payment integration for your Burner Design Pro application. Creem is a Merchant of Record (MoR) platform that handles payment processing, tax compliance, and global payouts automatically.

## Features

- **Subscription Management**: Create and manage recurring subscriptions
- **Checkout Flows**: Hosted checkout pages for secure payment
- **Webhooks**: Real-time payment event notifications
- **Customer Portal**: Allow users to manage their subscriptions
- **Automatic Payouts**: Automatic fund transfers to your bank account

## Setup Steps

### 1. Register Creem Account

1. Go to [https://creem.io](https://creem.io) and sign up
2. Complete your merchant profile and business verification
3. Navigate to Dashboard > Developers to get your API key

### 2. Create Products in Creem

Create subscription products in your Creem dashboard:

1. Log in to [Creem Dashboard](https://creem.io/dashboard)
2. Go to **Products** > **New Product**
3. Create the following products:

#### Product: Pro Plan
```
Name: Pro
Price: $9.99/month (or your preferred price)
Type: Subscription
Billing Interval: Monthly
```

4. After creating each product, copy the **Product ID** (e.g., `prod_xxxxxxxxxxxxx`)

### 3. Configure Environment Variables

Copy the example env file and update with your Creem credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Creem credentials:

```env
# Creem API Configuration
CREEM_API_KEY=creem_your_api_key_here
CREEM_TEST_MODE=false  # Set to true for testing
CREEM_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Product IDs from Creem Dashboard
CREEM_PRO_PRODUCT_ID=prod_production_id_here

# Application URL (for payment redirects)
APP_URL=https://your-domain.com
```

### 4. Configure Webhook

1. In Creem Dashboard, go to **Developers** > **Webhooks**
2. Click **Add Endpoint**
3. Set URL to: `https://your-domain.com/api/webhooks/creem/webhook`
4. Select events to subscribe to:
   - `checkout.completed`
   - `subscription.active`
   - `subscription.paid`
   - `subscription.canceled`
   - `subscription.expired`
5. Copy the **Webhook Secret** and add it to your `.env`

### 5. Test Mode

Before going live, test your integration:

1. Set `CREEM_TEST_MODE=true` in your `.env`
2. Use Creem's test card numbers:
   - `4242 4242 4242 4242` - Successful payment
   - `4000 0000 0000 0002` - Declined card
   - `4000 0000 0000 9995` - Insufficient funds

### 6. Go Live

1. Set `CREEM_TEST_MODE=false` in production
2. Verify all webhooks are receiving events
3. Test a real payment with a small amount
4. Monitor Creem Dashboard for payments

## How It Works

### Payment Flow

1. User selects a subscription plan
2. Frontend calls `/api/payment/create-checkout`
3. Backend creates a Creem checkout session
4. User is redirected to Creem's hosted checkout
5. User completes payment on Creem
6. Creem redirects back to your app with checkout ID
7. Your app verifies payment and activates subscription
8. Creem sends webhook event for confirmation

### Subscription Activation

Subscriptions are activated in two ways:

1. **Redirect Flow**: User returns from Creem checkout
   - Frontend calls `/api/payment/confirm/{order_id}`
   - Backend verifies checkout with Creem
   - User's subscription is activated

2. **Webhook Flow**: Creem sends webhook event
   - Backend receives `subscription.active` event
   - Updates user subscription in database

### Customer Management

Users can manage their subscriptions via the Customer Portal:

1. Call `/api/subscription` to get the current subscription
2. If user has a Creem subscription, `creem_portal_url` will be returned
3. Redirect user to this URL to manage billing

## API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get available subscription products |
| GET | `/api/subscription` | Get current user's subscription |
| POST | `/api/subscription/cancel` | Cancel current subscription |
| POST | `/api/payment/create-checkout` | Create Creem checkout session |
| GET | `/api/orders` | Get user's order history |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/revenue` | Get revenue statistics |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/orders` | Get all orders |
| GET | `/api/admin/withdrawals` | Get withdrawal requests |

### Webhook Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/creem/webhook` | Handle Creem webhook events |

## Withdrawal/Payouts

### How Payouts Work

Creem operates as a Merchant of Record (MoR), which means:

1. **Creem collects payments** from customers on your behalf
2. **Creem handles taxes** - VAT, sales tax, etc. are calculated and remitted
3. **Creem pays out** - Funds are transferred to your bank account

### Setting Up Payouts

1. In Creem Dashboard, go to **Settings** > **Payouts**
2. Add your bank account information
3. Configure payout schedule (weekly, bi-weekly, monthly)
4. Set minimum payout threshold

### Checking Payout Status

- View transactions in Creem Dashboard > Transactions
- Monitor pending payouts in Settings > Payouts
- Set up email notifications for payout events

### Withdrawal via API

You can also create withdrawal requests via the API:

```bash
# Get revenue info
curl -X GET http://localhost:8000/api/admin/revenue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Create withdrawal request
curl -X POST http://localhost:8000/api/admin/withdrawals \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "payment_method": "bank_transfer",
    "notes": "Monthly payout"
  }'
```

## Troubleshooting

### Common Issues

#### 1. Webhook not receiving events

- Verify webhook URL is accessible
- Check webhook is subscribed to correct events
- Ensure `CREEM_WEBHOOK_SECRET` is configured
- Check server logs for webhook errors

#### 2. Checkout not redirecting

- Verify `APP_URL` is correctly set
- Check success/cancel URLs are configured
- Ensure frontend subscription page exists at `/subscription`

#### 3. Subscription not activating

- Check webhook is receiving `subscription.active` event
- Verify webhook handler is processing events correctly
- Check user exists in database before webhook arrives

#### 4. Payment declined

- Test with Creem test cards first
- Check card details are correct
- Verify payment method is supported in user's region

### Testing Checklist

- [ ] Test checkout creation
- [ ] Test successful payment flow
- [ ] Test declined card flow
- [ ] Verify webhook events are received
- [ ] Check subscription activates correctly
- [ ] Test subscription cancellation
- [ ] Verify customer portal works
- [ ] Check payout settings in Creem dashboard

## Security Considerations

1. **Never expose API keys** - Keep them server-side only
2. **Verify webhook signatures** - Use the webhook secret
3. **Use HTTPS** - Always use HTTPS in production
4. **Validate user permissions** - Ensure users can only access their own data
5. **Monitor for fraud** - Review Creem's fraud protection settings

## Support

- Creem Documentation: https://docs.creem.io
- Creem Support: support@creem.io
- API Status: https://status.creem.io

## Next Steps

1. Set up your Creem account and products
2. Configure environment variables
3. Test in sandbox mode
4. Go live!

Good luck with your integration! 🚀
