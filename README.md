# Teams-Auth-SPA-PSTN

## Overview

The **Teams-Auth-SPA-PSTN** project is a Single Page Application (SPA) designed to integrate with Microsoft Teams and Azure Communication Services (ACS). It enables users to make and receive video calls, authenticate using Azure Active Directory (AAD), and interact with Public Switched Telephone Network (PSTN) services. This project demonstrates how to leverage Azure Communication Services and Microsoft Teams APIs to build a seamless communication experience.

## Features

- **Video Calling**: Supports 1:1 video calls using Azure Communication Services.
- **PSTN Integration**: Allows users to make calls to phone numbers via PSTN.
- **Authentication**: Uses Azure Active Directory (AAD) for secure user authentication.
- **Dynamic Configuration**: Fetches environment-specific configurations dynamically.
- **Error Logging**: Logs errors to a centralized endpoint for debugging and monitoring.

## Project Structure

The project is organized into the following directories and files:

```
.
├── client/
│   ├── app.js               # Frontend logic for video calling and UI interactions
│   ├── index.html           # Main HTML file for the SPA
├── constants/
│   ├── env.js               # Environment variables loaded from .env
│   ├── index.js             # Application-wide constants
├── controllers/
│   ├── auth.controller.js   # Handles authentication-related API logic
│   ├── client.controller.js # Serves the SPA homepage
├── public/
│   ├── assets/              # Static assets (e.g., images)
├── routes/
│   ├── client.route.js      # Route for serving the SPA
│   ├── getAccessToken.route.js # Route for fetching access tokens
│   ├── getPSTNToken.route.js   # Route for fetching PSTN tokens
│   ├── getRestAPIEndpoint.route.js # Route for fetching REST API endpoint
├── services/
│   ├── auth.services.js     # Core logic for interacting with Azure services
├── utils/
│   ├── helper.utils.js      # Utility functions for environment and endpoint management
├── .env                     # Environment variables
├── index.js                 # Main server entry point
├── webpack.config.js        # Webpack configuration for bundling
├── package.json             # Project dependencies and scripts
```

## Key Components

### 1. **Frontend (client/app.js)**

The frontend is built using vanilla JavaScript and integrates with Azure Communication Services SDK. It handles:

- Initializing the Teams Call Agent.
- Managing video streams (local and remote).
- Handling UI events such as starting or ending calls.

### 2. **Backend (index.js)**

The backend is built using Node.js and Express. It provides APIs for:

- Fetching access tokens for Teams and PSTN.
- Validating Application tokens.
- Serving the SPA and static assets.

### 3. **Authentication**

The project uses Azure AD for authentication. The `auth.services.js` file contains logic for:

- Fetching access tokens for Teams users.
- Validating Application tokens via REST API.
- Fetching PSTN tokens for phone calls.

### 4. **Dynamic Configuration**

The `utils/helper.utils.js` file dynamically determines the environment (e.g., dev, qa, prod) and fetches the appropriate REST API endpoint.

### 5. **Error Logging**

Errors are logged to a centralized endpoint using the `LogError` function in `client/app.js`. This ensures that issues can be monitored and resolved efficiently.

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- Azure Communication Services resource
- Azure Active Directory (AAD) app registration

### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Teams-Auth-SPA-PSTN
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   SERVER_PORT=3000
   NODE_ENV=dev
   COMMUNICATION_SERVICES_CONNECTION_STRING=<your-acs-connection-string>
   AAD_CLIENT_ID=<your-aad-client-id>
   AAD_TENANT_ID=<your-aad-tenant-id>
   AAD_CLIENT_SECRET=<your-aad-client-secret>
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open the application in your browser:
   ```
   http://localhost:3000
   ```

## API Endpoints

### 1. `/get-access-token` (POST)
Fetches an access token for Teams users.

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "token": "application-token",
    "did": "directory-id",
    "cid": "client-id"
  }
  ```

- **Response**:
  ```json
  {
    "accessTokenData": "<access-token>",
    "userInfo": "<user-info>",
    "timeTaken": {
      "validateApplicationToken": 100,
      "getAccessToken": 200,
      "getUserInfo": 300,
      "totalTime": 600
    }
  }
  ```

### 2. `/get-pstn-token` (POST)
Fetches a PSTN token for phone calls.

- **Request Body**:
  ```json
  {
    "token": "application-token",
    "did": "directory-id",
    "cid": "client-id"
  }
  ```

- **Response**:
  ```json
  {
    "pstnToken": "<pstn-token>",
    "communicationServicesPhoneNumber": "+1234567890",
    "timeTaken": {
      "validateApplicationToken": 100,
      "getAccessTokenForPSTN": 200,
      "totalTime": 300
    }
  }
  ```

### 3. `/endpoint` (GET)
Fetches the REST API endpoint for the current environment.

- **Response**:
  ```json
  {
    "endpoint": "https://avm-restapi-dev.azurewebsites.net"
  }
  ```

## Technologies Used

- **Frontend**: Vanilla JavaScript, Azure Communication Services SDK
- **Backend**: Node.js, Express
- **Authentication**: Azure Active Directory (AAD)
- **Build Tool**: Webpack
- **HTTP Client**: Axios

## Future Enhancements

- Add unit tests for backend and frontend components.
- Implement a CI/CD pipeline for automated deployments.
- Enhance error handling and logging mechanisms.
- Add support for group calls and chat features.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

## References

- [Azure Communication Services Documentation](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Azure Active Directory Documentation](https://learn.microsoft.com/en-us/azure/active-directory/)
- [Webpack Documentation](https://webpack.js.org/)