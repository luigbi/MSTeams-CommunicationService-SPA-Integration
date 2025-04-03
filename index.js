require("dotenv").config({ path: __dirname + "/.env" });
// const { CommunicationIdentityClient } = require("@azure/communication-identity");
// const { PublicClientApplication ,ConfidentialClientApplication } = require('@azure/msal-node');
// const axios = require('axios'); // Import axios for making HTTP requests

const express = require("express");
const path = require("path");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const bodyParser = require("body-parser");

const compiler = webpack(webpackConfig);
const app = express();
const PORT = process.env.PORT || 3000;

const homepage = require("./routes/client.route");
const getAccessToken = require("./routes/getAccessToken.route");
const getPSTNToken = require("./routes/getPSTNToken.route");
const endpoint = require("./routes/getRestAPIEndpoint.route");

// Middleware
app.use(
  require("webpack-dev-middleware")(compiler, {
    publicPath: webpackConfig.output.publicPath,
  })
);
app.use(require("webpack-hot-middleware")(compiler));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

//Routes
app.get("/", homepage);
app.get("/endpoint", endpoint);

app.post("/get-access-token", getAccessToken);
// Define the API endpoint for obtaining a PSTN token
app.post("/get-pstn-token", getPSTNToken);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// const getAccessToken = async () => {
//     try {
//         console.log("\n== Get Access Token for Teams User sample ==\n");

//         const client = new CommunicationIdentityClient(COMMUNICATION_SERVICES_CONNECTION_STRING);

//         // Get an AAD token and object ID of a Teams user
//         console.log("Getting an AAD token and an object ID of a Teams user");

//         // Use MSAL to get the AAD token and object ID of a Teams user
//         // Create configuration object for PublicClientApplication
//         const msalConfig = {
//           auth: {
//             clientId: AAD_CLIENT_ID,
//             authority: authority,
//           },
//         };

//         // Create an instance of PublicClientApplication
//         const msalInstance = new PublicClientApplication(msalConfig);
//         const scopes = [
//           "https://auth.msft.communication.azure.com/Teams.ManageCalls",
//           "https://auth.msft.communication.azure.com/Teams.ManageChats",
//         ];
//         // Create request parameters object for acquiring the AAD token and object ID of a Teams user
//         const usernamePasswordRequest = {
//           scopes: scopes,
//           username: MSAP_USERNAME,
//           password: MSAL_PASSWORD,
//         };
//         console.log("msalInstance",msalInstance);
//         // Retrieve the AAD token and object ID of a Teams user
//         const response = await msalInstance.acquireTokenByUsernamePassword(usernamePasswordRequest);
//         let teamsToken = response.accessToken;
//         console.log(`Retrieved a token with the expiration: ${response.extExpiresOn}`);

//         // Retrieve the user object ID
//         let userObjectId = response.uniqueId;

//         console.log("Exchanging the AAD access token for a Communication access token");

//         // Exchange the AAD access token of a Teams user for a new Communication Identity access token
//         const communicationAccessToken = await client.getTokenForTeamsUser({
//           teamsUserAadToken: teamsToken,
//           clientId: AAD_CLIENT_ID,
//           userObjectId: userObjectId,
//         });

//         console.log(`Exchanged Communication access token: ${communicationAccessToken.token}`);
//         return  communicationAccessToken.token;

//     } catch (error) {
//         throw error;
//     }
// };

// const getUserInfo = async (email) => {
//     try {
//         const msalConfiguration = {
//             auth: {
//                 clientId: AAD_CLIENT_ID,
//                 authority: `https://login.microsoftonline.com/${AAD_TENANT_ID}`,
//                 clientSecret: AAD_CLIENT_SECRET
//             }
//         };

//         const cca = new ConfidentialClientApplication(msalConfiguration);

//         const authResult = await cca.acquireTokenByClientCredential({
//             scopes: ['https://graph.microsoft.com/.default']
//         });

//         const accessToken = authResult.accessToken;
//         const graphApiUrl = `https://graph.microsoft.com/v1.0/users/${email}`;
//         const graphResponse = await axios.get(graphApiUrl, {
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`
//             }
//         });

//         console.log("Applications:", graphResponse.data.id);
//         return graphResponse.data.id;
//     } catch (error) {
//         throw error;
//     }
// };

// // Function to obtain the PSTN token
// const getAccessTokenForPSTN = async () => {
//   try {
//     console.log("\n== Get Access Token for Teams User sample ==\n");

//     const client = new CommunicationIdentityClient(COMMUNICATION_SERVICES_CONNECTION_STRING);

//     // Get an AAD token and object ID of a Teams user
//     console.log("Getting an AAD token and an object ID of a Teams user");

//     // Exchange the AAD access token of a Teams user for a new Communication Identity access token
//     const communicationAccessToken = await client.createUserAndToken(["voip"]);

//     console.log(`Exchanged Communication access token: ${communicationAccessToken.token}`);
//     return  communicationAccessToken.token;
//   } catch (error) {
//       console.error("Error obtaining PSTN token:", error);
//       throw error;
//   }
// };
