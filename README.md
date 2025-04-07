# VirtualFront: Seamless Communication with Microsoft Teams via Azure Communication Services (ACS)

VirtualFront is a production-grade Single Page Application (SPA) that integrates Microsoft Teams and Azure Communication Services (ACS) to enable video calling, PSTN integration, and secure authentication via Azure Active Directory (AAD). This repository contains the source code and setup instructions to get started.

---

## 🚀 Features

- One-click video calls to Microsoft Teams users.
- Token exchange using Azure AD and ACS.
- PSTN calling support (dialing out to phone numbers).
- Scalable backend built with Node.js and Express.
- Frontend powered by Vanilla JavaScript and ACS SDK.

---

## 📂 Project Structure

```plaintext
.
├── client/                      # Frontend SPA (HTML, JS, CSS)
│   ├── assets/                  # Static assets (images, styles)
│   ├── app.js                   # Main application logic
│   └── call.js                  # ACS call logic
│
├── constants/                   # Common constants (enums, labels)
│   └── roles.js
│
├── controllers/                 # Express route controllers
│   ├── token.controller.js      # Token management (ACS, AAD)
│   ├── user.controller.js       # Teams users & endpoint APIs
│   └── pstn.controller.js       # PSTN token and phone services
│
├── public/                      # Static public directory
│   └── index.html
│
├── routes/                      # API route definitions
│   ├── token.routes.js
│   ├── user.routes.js
│   └── pstn.routes.js
│
├── services/                    # Service layer for Azure SDK calls
│   ├── acs.service.js
│   ├── auth.service.js
│   └── teams.service.js
│
├── utils/                       # Utility helpers
│   ├── logger.js
│   └── environment.js
│
├── .env                         # Environment variables
├── index.js                     # Express server entry
├── package.json                 # Node dependencies
├── webpack.config.js            # Frontend bundling
└── README.md                    # Project documentation
```

---

## 🛠️ Setup Instructions

Follow these steps to set up and run the project locally.

### 1. Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Azure Subscription** with:
  - Azure Communication Services (ACS) resource.
  - Azure Active Directory (AAD) App Registration.
- **Microsoft Teams** account.

---

### 2. Clone the Repository

```bash
git clone https://github.com/luigbi/MSTeams-CommunicationService-SPA-Integration.git
cd VirtualFront
```

---

### 3. Install Dependencies

Run the following command to install the required Node.js dependencies:

```bash
npm install
```

---

### 4. Configure Environment Variables

Create a .env file in the root directory and add the following variables:

```ini
# Azure Communication Services
ACS_CONNECTION_STRING=endpoint=https://<your-acs-resource>.communication.azure.com/;accesskey=<your-access-key>

# Azure Active Directory
AAD_CLIENT_ID=<your-client-id>
AAD_TENANT_ID=<your-tenant-id>
AAD_SECRET=<your-client-secret>

# Microsoft Teams User
TEAMS_USER_ID=<your-teams-user-id>
```

---

### 5. Run the Application

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

---

### 6. Build for Production

To build the frontend for production, run:

```bash
npm run build
```

The bundled files will be available in the `dist/` directory.

---

## 🔧 Deployment

### Deploy to Azure App Service

1. Create an **Azure App Service** instance.
2. Push the code to the App Service using Git or Azure CLI.
3. Set the environment variables in the App Service configuration.

### Deploy Static Frontend to Azure Blob Storage

1. Build the frontend using `npm run build`.
2. Upload the contents of the `dist/` directory to an Azure Blob Storage container with static website hosting enabled.

---

## 🔖 API Endpoints

### `POST /get-access-token`
Fetches an ACS token for Teams users.

### `POST /get-pstn-token`
Fetches a PSTN token for phone calls.

### `GET /endpoint`
Fetches the REST API endpoint for the current environment.

---

## 📚 References

- [Azure Communication Services Documentation](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Microsoft Teams Developer Platform](https://learn.microsoft.com/en-us/microsoftteams/platform/)
- [Azure Active Directory App Integration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 🗓️ Future Enhancements

- Add support for group calls and chat features.
- Implement a CI/CD pipeline for automated deployments.
- Enhance error handling and logging mechanisms.
- Add an admin panel for managing Teams users.
