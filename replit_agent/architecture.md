# BeeTagged Architecture Overview

## 1. Overview

BeeTagged is a contact management application that allows users to organize, tag, and search their contacts. The application integrates with social media platforms like Facebook and LinkedIn to import contacts and provides a tagging system for better organization.

The application follows a client-server architecture with a React frontend and Express.js backend. The data is stored in MongoDB, with authentication handled via JWT.

## 2. System Architecture

BeeTagged follows a modern web application architecture with these key layers:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client Layer   │────►│   Server Layer  │────►│   Data Layer    │
│  (React SPA)    │     │   (Express.js)  │     │   (MongoDB)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Authentication │     │   External API  │     │  Configuration  │
│  (JWT)          │     │   Integrations  │     │  (.env)         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Client Layer
- Single Page Application built with React
- React Router for client-side routing
- React Context API for state management
- Custom components for UI elements

### Server Layer
- Express.js for RESTful API endpoints
- JWT for authentication
- Middleware for request handling and validation

### Data Layer
- MongoDB Atlas for data storage
- Mongoose ODM for schema definition and data validation

## 3. Key Components

### 3.1. Frontend Components

#### UI Components
- **Tag Components**: `TagBadge`, `TagEditor`, `TagList`, `TagManager` for managing contact tags
- **Social Components**: `FacebookLoginButton`, `LinkedInLoginButton` for social media authentication
- **Authentication Components**: `LoginPage`, `ResetPasswordForm`, `ForgotPasswordForm`
- **Contact Management**: `ContactCard`, `ContactsOverlay` for displaying and managing contacts

#### State Management
- React Context API with providers:
  - `AuthContext`: Manages user authentication state
  - `ContactContext`: Manages contacts and related operations

#### Routing
- React Router with protected routes requiring authentication

### 3.2. Backend Components

#### API Endpoints
- Authentication routes (`/api/auth/*`)
- Contact management routes (`/contacts/*`)
- Tag management routes (`/tags/*`)
- Social media integration routes (`/api/auth/facebook/*`, `/api/auth/linkedin/*`)

#### Middleware
- Authentication middleware using JWT
- CORS configuration
- Request validation

#### Services
- Contact service for managing contacts
- Tag service for managing tags
- Group service for managing contact groups
- Authentication service for user management

### 3.3. Data Models

#### User Model
- Authentication information
- Profile information
- Social connections

#### Contact Model
- Personal information (name, email, etc.)
- Professional information (headline, industry, etc.)
- Social IDs (Facebook, LinkedIn)
- Tags and grouping information

#### Tag Model
- Name, color, description
- Count (number of contacts with this tag)
- System flags (isSystem, isFilter)

#### Group Model
- Name, description, color, icon
- Members (array of contact IDs)
- Tags (array of tag IDs that define the group)

## 4. Data Flow

### 4.1. Authentication Flow

1. User logs in through the UI using email/password or social login (Facebook/LinkedIn)
2. Server validates credentials and issues a JWT token
3. Client stores the JWT token in localStorage
4. Authenticated requests include the JWT token in the Authorization header
5. Protected routes/resources check for valid JWT before processing requests

### 4.2. Contact Management Flow

1. User navigates to Contacts page
2. UI fetches contacts from the API
3. User can filter/search contacts by name or tags
4. User can add/edit/delete contacts
5. User can tag contacts with existing or new tags

### 4.3. Social Integration Flow

1. User initiates social login (Facebook/LinkedIn)
2. Application redirects to social platform for authentication
3. User authorizes the application
4. Social platform redirects back with authorization code
5. Server exchanges code for access token
6. Server fetches user profile and contacts from social platform API
7. Data is processed and stored in the application database

## 5. External Dependencies

### 5.1. Social Media APIs
- **Facebook Graph API**: Used for authentication and importing contacts
- **LinkedIn API**: Used for authentication and importing contacts

### 5.2. External Services
- **MongoDB Atlas**: Cloud-hosted MongoDB database
- **SendGrid**: For sending emails (password reset, notifications)

### 5.3. Frontend Libraries
- React & React DOM: UI framework
- React Router: Client-side routing
- Axios: HTTP client
- React Query: Data fetching and caching

### 5.4. Backend Libraries
- Express: Web server framework
- Mongoose: MongoDB object modeling
- JWT: Authentication tokens
- bcrypt: Password hashing

## 6. Deployment Strategy

The application is deployed on Replit, a cloud development environment and hosting platform.

### 6.1. Configuration

- Environment variables stored in `.env` file and Replit secrets
- MongoDB Atlas connection configured with appropriate IP whitelisting
- Port configuration managed by Replit environment

### 6.2. Build Process

1. Frontend assets are bundled using Webpack
2. Server is started using Node.js

### 6.3. Execution Flow

1. Replit's workflow setup runs concurrent tasks:
   - `BuildClient`: Builds React frontend with Webpack
   - `ExpressServer`: Starts Express server

2. The application is exposed through Replit's domain with two configured ports:
   - Port 3000: For client-side development
   - Port 5000: For the main application

### 6.4. Scaling Considerations

- Current deployment is suitable for development and testing
- For production, consider:
  - Moving to containerized deployment (Docker)
  - Implementing a CDN for static assets
  - Adding a load balancer for horizontal scaling
  - Setting up database replication for improved reliability

## 7. Security Considerations

- JWT for secure authentication
- Password hashing with bcrypt
- HTTPS for secure data transmission
- Environment variables for sensitive configuration
- CORS configuration to control access to API endpoints
- OAuth flow for secure social media integration