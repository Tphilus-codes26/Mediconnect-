# MediConnect - Global Telemedicine Platform

A modern telemedicine platform built with React and Vite, powered by Supabase for backend services.

## Features

### Patient Features
- **Doctor Discovery**: Browse and filter approved doctors by specialty and rating
- **Appointment Booking**: Schedule video, voice, or chat consultations
- **Medical History**: Track appointments and consultation notes
- **Profile Management**: Manage personal and medical information

### Doctor Features
- **Availability Management**: Toggle online status for accepting appointments
- **Appointment Management**: View and manage patient appointments
- **Consultation Notes**: Document patient interactions with SOAP notes
- **Earnings Dashboard**: Track completed consultations and earnings

### Admin Features
- **Doctor Approval**: Review and approve/reject doctor registrations
- **User Management**: Monitor and manage platform users
- **Feature Flags**: Control platform features dynamically
- **Revenue Analytics**: Track platform transactions and revenue
- **Error Monitoring**: Monitor and resolve system errors

## Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Inline CSS with custom design system
- **Deployment**: Vercel

## Project Structure

```
mediconnect/
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component with routing logic
│   ├── Auth.jsx           # Authentication and shared utilities
│   ├── Patient.jsx        # Patient dashboard
│   ├── Doctor.jsx         # Doctor dashboard
│   └── Admin.jsx          # Admin dashboard
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Tphilus-codes26/Mediconnect-.git
cd mediconnect

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Environment Variables

The app uses Supabase credentials embedded in the code for demo purposes. For production:

1. Create a `.env.local` file
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key
   ```

## Database Schema

### Core Tables
- **users**: Platform users (patients, doctors, admins)
- **patients**: Patient profiles with medical information
- **doctors**: Doctor profiles with specialties and availability
- **appointments**: Appointment bookings and status tracking
- **consultation_notes**: SOAP notes from doctor-patient consultations

### Supporting Tables
- **prescriptions**: Medication prescriptions
- **medical_records**: Patient medical documents
- **reviews**: Doctor ratings and reviews
- **transactions**: Payment transactions
- **admin_actions**: Audit log of admin actions
- **feature_flags**: Dynamic feature toggles
- **error_logs**: System error tracking

## API Integration

All API calls use the Supabase REST API with JWT authentication. The `sbFetch` utility in `Auth.jsx` handles:
- Request headers with API key and authorization
- JSON serialization
- Error handling
- Response parsing

## Deployment

The app is deployed on Vercel with automatic deployments on every push to the main branch.

**Live URL**: [mediconnect-pearl.vercel.app](https://mediconnect-pearl.vercel.app)

## Authentication

- **Sign Up**: Create account as patient or doctor
- **Sign In**: Email and password authentication via Supabase
- **Session**: JWT token stored in localStorage
- **Logout**: Clear session and token

## Development

### Code Style
- Functional React components with hooks
- Inline CSS for styling
- Utility-first design approach
- Error handling with user-friendly messages

### Adding Features
1. Create new components in `src/`
2. Use `sbFetch` for API calls
3. Update relevant dashboard component
4. Test locally with `npm run dev`
5. Push to GitHub to trigger Vercel deployment

## Troubleshooting

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Vite configuration in `vite.config.js`

### API Errors
- Verify Supabase credentials in `Auth.jsx`
- Check Row Level Security (RLS) policies
- Review Supabase logs for detailed errors

### Deployment Issues
- Check Vercel build logs
- Ensure all environment variables are set
- Verify GitHub repository is up to date

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Push to GitHub
5. Vercel will automatically deploy

## License

Proprietary - All rights reserved

## Support

For issues and feature requests, please contact the development team.
