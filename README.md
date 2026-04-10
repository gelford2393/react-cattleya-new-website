# Cattleya Website

A modern, responsive website for Cattleya pools and wellness services. Built with React + TypeScript + Vite, featuring a public-facing website and a secure admin dashboard for content management.

## 🌐 Project Overview

**Cattleya** is a full-featured website platform with:

- **Public Website**: Browse pools, view details, and contact information
- **Admin Dashboard**: Manage pools, reservations, rates, content, and website settings
- **Authentication**: Secure admin login via Supabase
- **Content Management**: Edit text, images, and website configuration from the dashboard
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## ✨ Key Features

### Public Website (No Login Required)

- **Home Page**: Hero section, pool carousel, featured pools, testimonials
- **Pool Details**: Individual pool pages with images, descriptions, amenities, and pricing
- **Contact Section**: Display contact information and location map
- **Responsive Layout**: Optimized for all screen sizes

### Admin Dashboard (Login Required)

- **Dashboard**: Overview and quick stats
- **Pool Management**: Create, edit, and delete pools with images and descriptions
- **Rate Management**: Set and update pool pricing and seasonal rates
- **Reservation Management**: View and manage guest reservations
- **Location Settings**: Configure map location and contact details
- **Contact Content**: Edit contact page text and information
- **Note Management**: Internal notes and documentation
- **Website Settings**: Customize website branding and global settings

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (authentication & storage)
- TinyMCE API key (for rich text editing)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/gelford2393/react-cattleya-new-website.git
   cd react-cattleya-new-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_POOL_IMAGES_BUCKET=pool-images
   VITE_SUPABASE_CMS_IMAGES_BUCKET=content-images
   VITE_TINYMCE_API_KEY=your_tinymce_api_key
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

5. **Access admin panel**
   - Navigate to `http://localhost:5173/admin/login`
   - Sign in with your admin credentials
   - You'll be redirected to the dashboard

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── admin/          # Admin-specific components (pools, reservations, settings)
│   ├── public/         # Public website components (home, pool details)
│   └── ui/             # Shared UI components (buttons, inputs, modals)
├── hooks/              # Custom React hooks
├── layouts/            # Layout components for page structure
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   └── public/         # Public pages
├── services/           # API & external service integrations
├── store/              # State management (TanStack Query)
├── lib/                # Utility functions and libraries
├── App.tsx             # Main app routing
└── main.tsx            # Application entry point
```

## 🔐 Authentication & Admin Access

### For Admins

1. **Log in**: Visit `/admin/login` and enter your credentials
2. **Session**: Your login session is managed securely via Supabase
3. **Permissions**: Only authenticated admins can access `/admin/*` routes
4. **Logout**: Click the logout button in the admin sidebar to sign out

### Public Users

- No login required to browse the website
- Can view all pools, details, and contact information
- Can submit reservations (if enabled)

## 🛠️ Tech Stack

| Layer                  | Technology                            |
| ---------------------- | ------------------------------------- |
| **Framework**          | React 19 + TypeScript                 |
| **Build Tool**         | Vite 6                                |
| **Routing**            | React Router v7                       |
| **State Management**   | TanStack React Query                  |
| **Authentication**     | Supabase Auth (email/password)        |
| **Database & Storage** | Supabase (PostgreSQL + Cloud Storage) |
| **Styling**            | Tailwind CSS v4 + custom theme        |
| **UI Components**      | shadcn/ui                             |
| **Rich Text Editor**   | TinyMCE                               |
| **HTTP Client**        | Supabase JS SDK                       |

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Add Environment Variables**
   In Vercel project settings → Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_POOL_IMAGES_BUCKET`
   - `VITE_SUPABASE_CMS_IMAGES_BUCKET`
   - `VITE_TINYMCE_API_KEY`

   Set these for **Production**, **Preview**, and **Development** environments.

4. **Deploy**
   ```bash
   npx vercel --prod
   ```
   Or push a new commit to GitHub to trigger automatic deployment.

## 📋 Admin Dashboard Guide

### Pools Management

- **View Pools**: See all pools in a data table
- **Add Pool**: Click "New Pool" to create with images, description, amenities
- **Edit Pool**: Click a pool row to modify details
- **Delete Pool**: Remove pools (data is deleted from database)

### Rates Management

- **Set Pricing**: Define base rates and seasonal adjustments
- **Seasonal Rates**: Add special rates for different seasons
- **Apply to Pools**: Link rates to specific pools

### Reservations

- **View Bookings**: See guest reservations and booking details
- **Manage Status**: Update reservation status (pending, confirmed, cancelled)
- **Track Guests**: View guest information and contact details

### Content Management

- **Location Map**: Update address, phone, and map location
- **Contact Page**: Edit contact information and messaging
- **Notes**: Store internal documentation and reminders

### Website Settings

- **Site Information**: Update business name, description, and branding
- **Colors & Theme**: Customize primary colors and styling
- **Global Settings**: Configure site-wide behavior and defaults

## 🎨 Design System

The website uses a cohesive design system with custom theme colors:

- **Surface**: `#383838` (dark charcoal background)
- **Paper**: `#f8efe8` (cream/off-white card background)
- **Accent**: `#a4d473` (green accent/highlights)

All components follow responsive mobile-first design principles.

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📝 Environment Variables Reference

| Variable                           | Description                           | Example                       |
| ---------------------------------- | ------------------------------------- | ----------------------------- |
| `VITE_SUPABASE_URL`                | Your Supabase project URL             | `https://project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`           | Supabase anonymous (public) key       | `sb_publishable_...`          |
| `VITE_SUPABASE_POOL_IMAGES_BUCKET` | S3 bucket name for pool images        | `pool-images`                 |
| `VITE_SUPABASE_CMS_IMAGES_BUCKET`  | S3 bucket name for CMS content images | `content-images`              |
| `VITE_TINYMCE_API_KEY`             | TinyMCE editor API key for rich text  | `get from tinymce.com`        |

## 🐛 Troubleshooting

### Admin Login Not Working

- Verify Supabase credentials in `.env`
- Check that user exists in Supabase Auth
- Clear browser cache and try again

### Images Not Loading

- Confirm Supabase storage buckets exist and are public
- Check bucket names match environment variables
- Verify image URLs in browser DevTools Network tab

### Build Fails

- Run `npm install` to ensure all dependencies installed
- Check Node.js version is 18+
- Look for TypeScript errors: `npm run type-check`

### Deploy Issues

- Verify all environment variables set in Vercel
- Check Vercel build logs for errors
- Ensure GitHub repository is public (or Vercel has access)

## 📞 Support & Administration

For questions or issues:

1. Check this documentation first
2. Review admin dashboard help tooltips
3. Verify environment variables and API keys
4. Check Supabase dashboard for database/auth issues

## 📄 License

This project is proprietary and confidential.
