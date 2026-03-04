from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.db_models import User, Stylist, Booking
from app.routes.auth import get_current_user_full
from app.stripe_client import get_stripe_client, get_stripe_publishable_key
from datetime import datetime, timezone
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

def get_frontend_url(request: Request) -> str:
    frontend_url = os.environ.get("FRONTEND_URL")
    if frontend_url:
        return frontend_url.rstrip('/')
    replit_domain = os.environ.get("REPLIT_DEV_DOMAIN")
    if replit_domain:
        return f"https://{replit_domain}"
    is_production = os.environ.get("REPLIT_DEPLOYMENT") == "1"
    if is_production:
        host = request.headers.get("host", "")
        if host:
            return f"https://{host}"
    return "http://localhost:5000"

async def get_or_create_stripe_customer(user: User, db: AsyncSession) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id

    try:
        stripe = await get_stripe_client()
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name,
            metadata={"user_id": user.user_id}
        )
        user.stripe_customer_id = customer.id
        await db.commit()
        return customer.id
    except Exception as e:
        logger.error(f"Failed to create Stripe customer: {e}")
        raise HTTPException(status_code=500, detail="Failed to set up payment profile")

@router.get("/config")
async def get_payment_config():
    publishable_key = await get_stripe_publishable_key()
    return {"publishable_key": publishable_key}

@router.get("/saved-cards")
async def get_saved_cards(user: User = Depends(get_current_user_full), db: AsyncSession = Depends(get_db)):
    if not user.stripe_customer_id:
        return {"cards": []}

    try:
        stripe = await get_stripe_client()
        payment_methods = stripe.PaymentMethod.list(
            customer=user.stripe_customer_id,
            type="card"
        )
        cards = []
        for pm in payment_methods.data:
            cards.append({
                "id": pm.id,
                "brand": pm.card.brand,
                "last4": pm.card.last4,
                "exp_month": pm.card.exp_month,
                "exp_year": pm.card.exp_year,
            })
        return {"cards": cards}
    except Exception as e:
        logger.error(f"Failed to fetch saved cards: {e}")
        return {"cards": []}

@router.delete("/saved-cards/{payment_method_id}")
async def remove_saved_card(payment_method_id: str, user: User = Depends(get_current_user_full)):
    try:
        stripe = await get_stripe_client()
        pm = stripe.PaymentMethod.retrieve(payment_method_id)
        if pm.customer != user.stripe_customer_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        stripe.PaymentMethod.detach(payment_method_id)
        return {"status": "removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove card: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove card")

@router.post("/create-checkout")
async def create_checkout_session(
    booking_id: str,
    request: Request,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.client_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking.payment_status == "completed":
        raise HTTPException(status_code=400, detail="Booking already paid")

    frontend_url = get_frontend_url(request)
    success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_id}"
    cancel_url = f"{frontend_url}/payment-cancelled?booking_id={booking_id}"

    try:
        stripe = await get_stripe_client()
        customer_id = await get_or_create_stripe_customer(user, db)

        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [{
                "price_data": {
                    "currency": "aud",
                    "product_data": {
                        "name": "Onda Booking",
                        "description": f"Booking #{booking_id[:8]}",
                    },
                    "unit_amount": int(booking.total_price * 100),
                },
                "quantity": 1,
            }],
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "payment_intent_data": {
                "setup_future_usage": "on_session",
            },
            "metadata": {
                "booking_id": booking_id,
                "client_id": user.user_id,
                "stylist_id": booking.stylist_id,
            },
        }

        session = stripe.checkout.Session.create(**session_params)

        booking.payment_intent_id = session.id
        await db.commit()

        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe checkout creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@router.post("/charge-saved-card")
async def charge_saved_card(
    booking_id: str,
    payment_method_id: str,
    request: Request,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.client_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.payment_status == "completed":
        raise HTTPException(status_code=400, detail="Booking already paid")

    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No payment profile found")

    try:
        stripe = await get_stripe_client()

        pm = stripe.PaymentMethod.retrieve(payment_method_id)
        if pm.customer != user.stripe_customer_id:
            raise HTTPException(status_code=403, detail="Card does not belong to you")

        intent = stripe.PaymentIntent.create(
            amount=int(booking.total_price * 100),
            currency="aud",
            customer=user.stripe_customer_id,
            payment_method=payment_method_id,
            off_session=False,
            confirm=True,
            metadata={
                "booking_id": booking_id,
                "client_id": user.user_id,
                "stylist_id": booking.stylist_id,
            },
            return_url=f"{get_frontend_url(request)}/payment-success?booking_id={booking_id}",
        )

        if intent.status == "succeeded":
            booking.payment_status = "completed"
            booking.payment_intent_id = intent.id
            booking.status = "confirmed"

            stylist_result = await db.execute(select(Stylist).where(Stylist.stylist_id == booking.stylist_id))
            stylist = stylist_result.scalar_one_or_none()
            if stylist:
                stylist.total_bookings = (stylist.total_bookings or 0) + 1

            await db.commit()
            return {"status": "succeeded", "booking_id": booking_id}
        elif intent.status == "requires_action":
            return {
                "status": "requires_action",
                "client_secret": intent.client_secret,
            }
        else:
            return {"status": intent.status}

    except stripe.error.CardError as e:
        raise HTTPException(status_code=400, detail=f"Card declined: {e.user_message}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Saved card charge failed: {e}")
        raise HTTPException(status_code=500, detail="Payment failed")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        stripe = await get_stripe_client()

        if webhook_secret and sig_header:
            event = stripe.Webhook.construct_event(body, sig_header, webhook_secret)
        else:
            logger.warning("Stripe webhook signature verification skipped - STRIPE_WEBHOOK_SECRET not configured")
            event = stripe.Event.construct_from(
                stripe.util.json.loads(body.decode()),
                stripe.api_key
            )

        if event.type == "checkout.session.completed":
            session = event.data.object
            booking_id = session.metadata.get("booking_id")

            if booking_id:
                result = await db.execute(select(Booking).where(Booking.booking_id == booking_id))
                booking = result.scalar_one_or_none()

                if booking:
                    booking.payment_status = "completed"
                    booking.status = "confirmed"

                    stylist_result = await db.execute(select(Stylist).where(Stylist.stylist_id == booking.stylist_id))
                    stylist = stylist_result.scalar_one_or_none()
                    if stylist:
                        stylist.total_bookings = (stylist.total_bookings or 0) + 1

                    await db.commit()

        return {"status": "success"}
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{session_id}")
async def get_payment_status(session_id: str):
    try:
        stripe = await get_stripe_client()
        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total / 100 if session.amount_total else 0,
            "currency": "aud",
            "metadata": session.metadata,
        }
    except Exception as e:
        logger.error(f"Failed to get payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tip")
async def create_tip(
    stylist_id: str,
    amount: float,
    booking_id: Optional[str] = None,
    request: Request = None,
    user: User = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db)
):
    if amount < 1.0:
        raise HTTPException(status_code=400, detail="Minimum tip amount is $1.00")

    result = await db.execute(select(Stylist).where(Stylist.stylist_id == stylist_id))
    stylist = result.scalar_one_or_none()

    if not stylist:
        raise HTTPException(status_code=404, detail="Stylist not found")

    frontend_url = get_frontend_url(request)
    success_url = f"{frontend_url}/tip-success"
    cancel_url = f"{frontend_url}/tip-cancelled"

    try:
        stripe = await get_stripe_client()
        customer_id = await get_or_create_stripe_customer(user, db)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "aud",
                    "product_data": {
                        "name": "Tip for Stylist",
                    },
                    "unit_amount": int(amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "tip",
                "stylist_id": stylist_id,
                "client_id": user.user_id,
                "booking_id": booking_id or "",
            },
        )

        return {
            "checkout_url": session.url,
            "session_id": session.id,
        }
    except Exception as e:
        logger.error(f"Tip checkout creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
