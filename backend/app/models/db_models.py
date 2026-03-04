from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    CLIENT = "client"
    STYLIST = "stylist"
    ADMIN = "admin"
    PARTNER = "partner"

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketCategory(str, enum.Enum):
    PAYMENT_DISPUTE = "payment_dispute"
    COMPLAINT = "complaint"
    SERVICE_ISSUE = "service_issue"
    ACCOUNT_ISSUE = "account_issue"
    GENERAL = "general"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class CredentialStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class ServiceCategory(str, enum.Enum):
    HAIRCUT = "haircut"
    COLORING = "coloring"
    STYLING = "styling"
    FACIAL = "facial"
    NAILS = "nails"
    THREADING = "threading"
    WAXING = "waxing"
    COSMETIC_TATTOO = "cosmetic_tattoo"
    MASSAGE = "massage"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default=UserRole.CLIENT.value)
    profile_image = Column(String(500), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stylist_profile = relationship("Stylist", back_populates="user", uselist=False)
    bookings_as_client = relationship("Booking", back_populates="client", foreign_keys="Booking.client_id")
    favorites = relationship("Favorite", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Stylist(Base):
    __tablename__ = "stylists"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stylist_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    years_experience = Column(Integer, nullable=True)
    skills = Column(JSON, default=list)
    service_latitude = Column(Float, nullable=True)
    service_longitude = Column(Float, nullable=True)
    service_address = Column(String(500), nullable=True)
    service_radius_miles = Column(Float, default=10.0)
    portfolio_images = Column(JSON, default=list)
    social_links = Column(JSON, default=dict)
    is_verified = Column(Boolean, default=False)
    approval_status = Column(String(20), default=ApprovalStatus.PENDING.value)
    approval_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(36), nullable=True)
    average_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    total_bookings = Column(Integer, default=0)
    availability_slots = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="stylist_profile")
    pricing = relationship("StylistPricing", back_populates="stylist", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="stylist")
    blocked_times = relationship("BlockedTime", back_populates="stylist", cascade="all, delete-orphan")
    credentials = relationship("StylistCredential", back_populates="stylist", cascade="all, delete-orphan")
    photos = relationship("PortfolioPhoto", back_populates="stylist", cascade="all, delete-orphan")

class StylistPricing(Base):
    __tablename__ = "stylist_pricing"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    service = Column(String(50), nullable=False)
    price_min = Column(Float, nullable=False)
    price_max = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    stylist = relationship("Stylist", back_populates="pricing")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    client_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    services = Column(JSON, nullable=False)
    scheduled_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    client_latitude = Column(Float, nullable=True)
    client_longitude = Column(Float, nullable=True)
    client_address = Column(String(500), nullable=True)
    stylist_latitude = Column(Float, nullable=True)
    stylist_longitude = Column(Float, nullable=True)
    distance_miles = Column(Float, nullable=True)
    service_price = Column(Float, nullable=False)
    travel_cost = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    platform_fee_percent = Column(Float, default=15.0)
    stylist_earnings = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=False)
    extension_minutes = Column(Integer, default=0)
    status = Column(String(20), nullable=False, default=BookingStatus.PENDING.value)
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(String(36), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    payment_status = Column(String(20), default="pending")
    payment_intent_id = Column(String(255), nullable=True)
    travel_mode = Column(String(30), default="stylist_travels")
    meeting_location_address = Column(String(500), nullable=True)
    meeting_location_lat = Column(Float, nullable=True)
    meeting_location_lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("User", back_populates="bookings_as_client", foreign_keys=[client_id])
    stylist = relationship("Stylist", back_populates="bookings")
    rating = relationship("Rating", back_populates="booking", uselist=False)
    
    __table_args__ = (
        Index('idx_booking_stylist_datetime', 'stylist_id', 'scheduled_datetime', 'end_datetime'),
    )

class BlockedTime(Base):
    __tablename__ = "blocked_times"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stylist = relationship("Stylist", back_populates="blocked_times")
    
    __table_args__ = (
        Index('idx_blocked_stylist_datetime', 'stylist_id', 'start_datetime', 'end_datetime'),
    )

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="favorites")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'stylist_id', name='unique_favorite'),
    )

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    rating_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id"), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    booking = relationship("Booking", back_populates="rating")
    user = relationship("User", back_populates="ratings")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="notifications")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    sender_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_message_conversation', 'sender_id', 'receiver_id', 'created_at'),
    )

class Withdrawal(Base):
    __tablename__ = "withdrawals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    withdrawal_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(36), nullable=True)
    
    stylist = relationship("Stylist")

class TaxInfo(Base):
    __tablename__ = "tax_info"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), unique=True, nullable=False)
    tax_id = Column(String(50), nullable=True)
    business_name = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    stylist = relationship("Stylist")


class CancellationPolicy(Base):
    __tablename__ = "cancellation_policies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), unique=True, nullable=False)
    free_cancellation_hours = Column(Integer, default=24)
    late_cancellation_fee_percent = Column(Float, default=50.0)
    no_show_fee_percent = Column(Float, default=100.0)
    policy_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stylist = relationship("Stylist")


class ReviewPhoto(Base):
    __tablename__ = "review_photos"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    photo_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    rating_id = Column(String(36), ForeignKey("ratings.rating_id"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    photo_type = Column(String(20), default="after")
    is_moderated = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    moderated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LoyaltyPoints(Base):
    __tablename__ = "loyalty_points"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), unique=True, nullable=False)
    total_points = Column(Integer, default=0)
    lifetime_points = Column(Integer, default=0)
    tier = Column(String(20), default="bronze")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User")
    transactions = relationship("LoyaltyTransaction", back_populates="loyalty_account")


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    loyalty_id = Column(Integer, ForeignKey("loyalty_points.id"), nullable=False)
    points = Column(Integer, nullable=False)
    transaction_type = Column(String(30), nullable=False)
    description = Column(String(255), nullable=True)
    reference_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    loyalty_account = relationship("LoyaltyPoints", back_populates="transactions")


class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    referral_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    referrer_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    referred_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    referral_code = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")
    points_awarded = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('referrer_id', 'referred_id', name='unique_referral'),
    )


class BookingReminder(Base):
    __tablename__ = "booking_reminders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    reminder_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id"), nullable=False)
    reminder_type = Column(String(30), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_reminder_scheduled', 'scheduled_at', 'is_sent'),
    )


class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StylistPayoutSettings(Base):
    __tablename__ = "stylist_payout_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), unique=True, nullable=False)
    payout_frequency = Column(String(20), default="weekly")
    bank_account_last4 = Column(String(4), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bsb = Column(String(10), nullable=True)
    stripe_connect_id = Column(String(100), nullable=True)
    stripe_connect_status = Column(String(30), default="pending")
    is_verified = Column(Boolean, default=False)
    total_earnings = Column(Float, default=0.0)
    pending_balance = Column(Float, default=0.0)
    last_payout_at = Column(DateTime(timezone=True), nullable=True)
    next_payout_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PayoutTransaction(Base):
    __tablename__ = "payout_transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    status = Column(String(30), default="pending")
    stripe_transfer_id = Column(String(100), nullable=True)
    payout_method = Column(String(30), default="bank_transfer")
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_payout_stylist', 'stylist_id', 'status'),
    )


class BookingFeedback(Base):
    __tablename__ = "booking_feedback"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    feedback_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id"), unique=True, nullable=False)
    client_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    
    overall_rating = Column(Integer, nullable=True)
    service_quality = Column(Integer, nullable=True)
    punctuality = Column(Integer, nullable=True)
    communication = Column(Integer, nullable=True)
    would_recommend = Column(Boolean, nullable=True)
    
    feedback_text = Column(Text, nullable=True)
    what_they_loved = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    
    before_photo_url = Column(String(500), nullable=True)
    after_photo_url = Column(String(500), nullable=True)
    photo_consent = Column(Boolean, default=False)
    
    before_after_rating = Column(Integer, nullable=True)
    stylist_behavior_rating = Column(Integer, nullable=True)
    would_book_again = Column(Boolean, nullable=True)
    why_chose_onda = Column(Text, nullable=True)
    will_post_social = Column(Boolean, nullable=True)
    social_share_completed = Column(Boolean, default=False)
    social_platform = Column(String(50), nullable=True)
    coupon_code_generated = Column(String(36), nullable=True)

    survey_completed = Column(Boolean, default=False)
    survey_declined = Column(Boolean, default=False)
    survey_prompted_at = Column(DateTime(timezone=True), nullable=True)
    survey_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    booking = relationship("Booking", backref="feedback")
    client = relationship("User", foreign_keys=[client_id])
    stylist = relationship("Stylist", foreign_keys=[stylist_id])
    
    __table_args__ = (
        Index('idx_feedback_booking', 'booking_id'),
        Index('idx_feedback_stylist', 'stylist_id'),
    )


class CouponCode(Base):
    __tablename__ = "coupon_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    coupon_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False)
    discount_percent = Column(Float, default=15.0)
    
    generated_from_feedback_id = Column(String(36), nullable=True)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=True)
    generated_for_user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    
    before_photo_url = Column(String(500), nullable=True)
    after_photo_url = Column(String(500), nullable=True)
    stylist_name = Column(String(255), nullable=True)
    service_description = Column(String(500), nullable=True)
    
    is_used = Column(Boolean, default=False)
    used_by_user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    used_on_booking_id = Column(String(36), nullable=True)
    
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stylist = relationship("Stylist", foreign_keys=[stylist_id])
    generated_for = relationship("User", foreign_keys=[generated_for_user_id])
    used_by = relationship("User", foreign_keys=[used_by_user_id])
    
    __table_args__ = (
        Index('idx_coupon_code', 'code'),
        Index('idx_coupon_stylist', 'stylist_id'),
    )


class BookingCompletion(Base):
    __tablename__ = "booking_completions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    completion_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id"), unique=True, nullable=False)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    completion_notes = Column(Text, nullable=True)
    
    before_photo_url = Column(String(500), nullable=True)
    after_photo_url = Column(String(500), nullable=True)
    
    client_notified = Column(Boolean, default=False)
    feedback_requested = Column(Boolean, default=False)
    
    booking = relationship("Booking", backref="completion")
    
    __table_args__ = (
        Index('idx_completion_booking', 'booking_id'),
    )

class StylistCredential(Base):
    __tablename__ = "stylist_credentials"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    credential_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    
    credential_type = Column(String(100), nullable=False)
    credential_name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=True)
    issue_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    credential_number = Column(String(100), nullable=True)
    
    document_url = Column(String(500), nullable=False)
    
    verification_status = Column(String(20), default=CredentialStatus.PENDING.value)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stylist = relationship("Stylist", back_populates="credentials")
    
    __table_args__ = (
        Index('idx_credential_stylist', 'stylist_id'),
        Index('idx_credential_status', 'verification_status'),
    )

class PortfolioPhoto(Base):
    __tablename__ = "portfolio_photos"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    photo_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    stylist_id = Column(String(36), ForeignKey("stylists.stylist_id"), nullable=False)
    
    photo_url = Column(String(500), nullable=False)
    photo_type = Column(String(50), nullable=False)
    caption = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    
    moderation_status = Column(String(20), default="pending")
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    moderated_by = Column(String(36), nullable=True)
    moderation_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stylist = relationship("Stylist", back_populates="photos")
    
    __table_args__ = (
        Index('idx_photo_stylist', 'stylist_id'),
        Index('idx_photo_moderation', 'moderation_status'),
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(36), unique=True, nullable=False, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    booking_id = Column(String(36), ForeignKey("bookings.booking_id"), nullable=True)
    category = Column(String(30), nullable=False, default=TicketCategory.GENERAL.value)
    status = Column(String(20), nullable=False, default=TicketStatus.OPEN.value)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    admin_notes = Column(Text, nullable=True)
    assigned_admin_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", foreign_keys=[user_id], backref="support_tickets")
    booking = relationship("Booking", backref="support_tickets")
    
    __table_args__ = (
        Index('idx_ticket_user', 'user_id'),
        Index('idx_ticket_status', 'status'),
        Index('idx_ticket_category', 'category'),
    )
