# 🚀 ZeroTake

**ZeroTake** is a self-hosted, flat-fee digital storefront designed for creators who want to keep 100% of their revenue. Instead of charging a hefty 5% to 10% transaction fee like traditional platforms (Gumroad, Lemon Squeezy), ZeroTake operates on a flat monthly subscription model, routing payments directly to the creator's bank account.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started)

---

## ✨ Features

- **0% Transaction Fees:** Connect your own Stripe account via Stripe Connect Standard. Every dollar a buyer spends goes straight to you.
- **Secure Digital Delivery:** Assets (PDFs, ZIPs, Videos) are securely stored in private AWS S3 buckets. The app generates short-lived, single-use presigned download URLs for verified buyers to prevent link sharing and piracy.
- **Dynamic Storefronts:** Fast, SEO-optimized public product pages generated dynamically (`/[storeName]/[productSlug]`) using Next.js.
- **Creator Dashboard:** Track sales, monitor product analytics, upload assets, and manage your platform subscription in a clean, unified panel.
- **Automated Webhooks:** Robust webhook infrastructure handling asynchronous payment verification and automated email receipt generation.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Node.js, TypeScript, Express
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Payments & Billing:** Stripe Connect (Standard Accounts) & Stripe Billing
- **Storage:** AWS S3

## 📐 Architecture

ZeroTake decouples the platform's operating costs from the creator's sales revenue:

1. **The Purchase Flow:** When a buyer checks out, the money goes directly from the buyer to the creator's connected Stripe account. ZeroTake never handles the transaction capital.
2. **The Platform Flow:** Creators are billed a flat subscription fee through the core platform's Stripe Billing integration to maintain their store status.

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database instance
- Stripe CLI and developer account
- AWS Account with an S3 Bucket configured with private access blocks

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/zerotake.git](https://github.com/yourusername/zerotake.git)
   cd zerotake
