"""
Pricing and Subscription Tiers Configuration
"""
from app.models.user import SubscriptionTier

# Define all subscription tiers
FREE_TIER = SubscriptionTier(
    name="Free",
    price=0,
    price_display="$0",
    period="/month",
    features=[
        "20 calculations per month",
        "Basic combustion calculator",
        "Unit converter",
        "Emission calculator"
    ],
    max_calculations=20,
    has_pdf_export=False,
    has_pro_calculators=False,
    has_team_features=False,
    max_team_members=1
)

PRO_TIER = SubscriptionTier(
    name="Pro",
    price=1900,  # $19.00 in cents
    price_display="$19",
    period="/month",
    stripe_price_id="price_pro_monthly",
    features=[
        "Unlimited calculations",
        "All calculators included",
        "PDF report export",
        "Calculation history",
        "Multiple fuel types",
        "Advanced orifice calculator",
        "EPA & EU IED compliance"
    ],
    max_calculations=None,  # unlimited
    has_pdf_export=True,
    has_pro_calculators=True,
    has_team_features=False,
    max_team_members=1
)

TEAM_TIER = SubscriptionTier(
    name="Team",
    price=4900,  # $49.00 in cents
    price_display="$49",
    period="/month",
    stripe_price_id="price_team_monthly",
    features=[
        "Everything in Pro",
        "Up to 5 team members",
        "Shared team projects",
        "Team collaboration",
        "Member management",
        "Shared calculation history",
        "Priority support"
    ],
    max_calculations=None,  # unlimited
    has_pdf_export=True,
    has_pro_calculators=True,
    has_team_features=True,
    max_team_members=5
)

SUBSCRIPTION_TIERS = {
    "free": FREE_TIER,
    "pro": PRO_TIER,
    "team": TEAM_TIER
}
