# GradeBook - Progressive Web App

A comprehensive Progressive Web App (PWA) for managing student grades and notifications across multiple platforms.

## Features

- **Multi-user system**: Admins, Teachers, and Students
- **Grade management**: Track and view student progress
- **Push notifications**: Send targeted notifications to users
- **Category-based organization**: Filter by subjects, direction, school
- **Responsive design**: Optimized for desktop, Android and iOS
- **Dark mode**: User interface preference
- **Offline capabilities**: Core functionality works without internet

## Technology Stack

- **Frontend**: React.js, PWA capabilities
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Notifications**: Web Push API

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd frontend
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=mailto:your_email@example.com
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Deployment

This application is configured for deployment on render.com.

## License

MIT
