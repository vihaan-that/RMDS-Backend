# Power Plant Monitoring System Backend

A robust Node.js backend system for real-time power plant monitoring, featuring sensor data collection, incident management, and user authentication.

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Data Models](#data-models)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Data Streaming](#real-time-data-streaming)

## Features

### Core Features
- Real-time sensor data monitoring
- Statistical analysis of sensor data
- Incident tracking and management
- Asset management and monitoring
- Role-based access control
- Real-time data streaming using Server-Sent Events (SSE)

### Technical Features
- MongoDB for data storage
- JWT-based authentication
- Role-based authorization
- Input validation using Joi
- Real-time updates using MongoDB Change Streams
- Error handling middleware
- Request validation middleware

## System Architecture

### Directory Structure
```
powerplant-backend/
├── models/
│   ├── asset.js
│   ├── incident.js
│   ├── role.js
│   ├── sensor.js
│   ├── sensorValues.js
│   └── user.js
├── controllers/
│   ├── assetController.js
│   ├── authController.js
│   ├── incidentController.js
│   ├── liveDataController.js
│   ├── roleController.js
│   ├── sensorController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── validateRequest.js
│   └── validationSchemas.js
├── routes/
│   ├── api.js
│   └── auth.js
├── utils/
│   └── SensorEventManager.js
└── scripts/
    └── createAdmin.js
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone [repository-url]
cd powerplant-backend
```

3. Install dependencies:
```
npm install
```

3. Set up environment variables in \`.env\`:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecureAdminPassword123
```

4. Create admin user:
```
node scripts/createAdmin.js
```

## API Documentation

### Authentication Endpoints

#### POST /auth/login
Login with email and password
```
{
    "email": "user@example.com",
    "password": "password123"
}
```

#### GET /auth/profile
Get current user profile (requires authentication)

### Sensor Data Endpoints

#### GET /api/sensor-values
Get sensor values within a timeframe
- Query Parameters:
  - sensorId: string
  - startTime: ISO date
  - endTime: ISO date

#### GET /api/sensor-stats
Get statistical analysis of sensor data
- Query Parameters:
  - sensorId: string
  - startTime: ISO date
  - endTime: ISO date
- Returns:
  - average
  - median
  - mode
  - standard deviation
  - max/min values

### Live Data Endpoints

#### GET /api/live/sensor/:sensorId
Stream real-time data for a specific sensor (SSE)

#### GET /api/live/asset/:assetId
Stream real-time data for all sensors in an asset (SSE)

### Incident Management

#### GET /api/incidents
Get incidents within a timeframe
- Query Parameters:
  - startTime: ISO date
  - endTime: ISO date

### User Management (Admin Only)

#### POST /auth/users
Create new user
```
{
    "username": "user1",
    "email": "user1@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": "role_id"
}
```

#### GET /auth/users
List all users

#### PATCH /auth/users/:userId
Update user

#### DELETE /auth/users/:userId
Delete user

### Role Management (Admin Only)

#### POST /auth/roles
Create new role
```
{
    "name": "operator",
    "description": "Plant operator role",
    "permissions": [
        {
            "resource": "sensors",
            "actions": ["read"]
        },
        {
            "resource": "incidents",
            "actions": ["create", "read", "update"]
        }
    ]
}
```

## Data Models

### Sensor
- tagName (string, unique)
- tagDescription (string)
- unit (string)

### SensorValue
- sensor (reference to Sensor)
- value (number)
- timestamp (date)

### Asset
- projectName (string)
- assetName (string)
- sensors (array of Sensor references)

### Incident
- KpiId (string)
- Kpi (string)
- startDate (date)
- endDate (date)
- VariableName (string)
- Equipment (string)
- System (string)
- Priority (enum: P1, P2, P3)
- Severity (enum: S1, S2, S3)
- Owner (string)

### User
- username (string, unique)
- email (string, unique)
- password (string, hashed)
- firstName (string)
- lastName (string)
- role (reference to Role)
- isActive (boolean)
- lastLogin (date)

### Role
- name (string, unique)
- permissions (array of Permission objects)
- description (string)

## Authentication & Authorization

### JWT Authentication
- Token-based authentication using JWT
- Tokens expire after 24 hours
- Secure password hashing using bcrypt

### Role-based Authorization
- Resource-based permissions
- Granular action control (create, read, update, delete)
- Admin role with full access
- Custom role creation

## Real-time Data Streaming

### Server-Sent Events (SSE)
- Real-time sensor data streaming
- Efficient connection management
- Support for multiple clients
- Automatic reconnection
- Data filtering based on subscriptions

### MongoDB Change Streams
- Real-time database monitoring
- Efficient data propagation
- Automatic event handling

## Error Handling

### Validation
- Input validation using Joi
- Custom validation messages
- Request body sanitization

### Error Responses
- Consistent error format
- Detailed error messages
- Appropriate HTTP status codes

## Security Features
- Password hashing
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- Secure password requirements
- Session management


