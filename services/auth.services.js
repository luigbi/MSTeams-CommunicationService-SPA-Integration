const {
  CommunicationIdentityClient,
} = require("@azure/communication-identity");
const {
  PublicClientApplication,
  ConfidentialClientApplication,
} = require("@azure/msal-node");
const axios = require("axios"); // Import axios for making HTTP requests

const {
  AAD_CLIENT_ID,
  // AAD_TENANT_ID,
  AAD_CLIENT_SECRET,
  // COMMUNICATION_SERVICES_CONNECTION_STRING,
  // MSAL_USERNAME,
  // MSAL_PASSWORD,
  TEAMS_CALLING_FEATURE_ID,
} = require("./../constants/env");

const { getEndpoint } = require("./../utils/helper.utils");
// const authority = `https://login.microsoftonline.com/${AAD_TENANT_ID}`;
const restAPIDomain = getEndpoint();

// const axios = require('axios')
const https = require('https')

const instance = axios.create({
  // ... other options ...
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const getAccessToken = async (did, cid, token) => {
  try {
    // GetValuesByClient
    //const accessToken = authResult.accessToken;
    const byClientApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByClient/${TEAMS_CALLING_FEATURE_ID},${cid}`;
    const byDirectoryApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByDirectory/${TEAMS_CALLING_FEATURE_ID},${did}`;
    
    // timestamp before byClient
    const beforeByClient = new Date().getTime();
    const { data: byClient } = await axios.get(byClientApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      }
    });
    // timestamp after byClient
    const afterByClient = new Date().getTime();

    // timestamp before byDirectory
    const beforeByDirectory = new Date().getTime();
    const { data: byDirectory } = await axios.get(byDirectoryApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      }
  });
    // timestamp after byDirectory
    const afterByDirectory = new Date().getTime();
    console.log("byClient", byClient);
    console.log("byDirectory", byDirectory);
    // GetValuesByDirectory
    const COMMUNICATION_SERVICES_CONNECTION_STRING = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "COMMUNICATION_SERVICES_CONNECTION_STRING"
    ).Value;
    const AAD_TENANT_ID = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_TENANT_ID"
    ).Value;
    const AAD_CLIENT_ID = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_CLIENT_ID"
    ).Value;
    const MSAL_USERNAME = byDirectory.FeaturePropertyValues.find(
      (item) => item.Name === "MSAL_USERNAME"
    ).Value;
    const MSAL_PASSWORD = byDirectory.FeaturePropertyValues.find(
      (item) => item.Name === "MSAL_PASSWORD"
    ).Value;
    const AAD_CLIENT_SECRET = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_CLIENT_SECRET"
    ).Value;
    
    console.log("\n== Get Access Token for Teams User sample ==\n");

    const client = new CommunicationIdentityClient(
      COMMUNICATION_SERVICES_CONNECTION_STRING
    );

    // Get an AAD token and object ID of a Teams user
    console.log("Getting an AAD token and an object ID of a Teams user");

    // Use MSAL to get the AAD token and object ID of a Teams user
    // Create configuration object for PublicClientApplication
    const msalConfig = {
      auth: {
        clientId: AAD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${AAD_TENANT_ID}`,// authority,
        clientSecret: AAD_CLIENT_SECRET,
      },
    };
    console.log("msalConfig", msalConfig);
    // Create an instance of PublicClientApplication
    const msalInstance = new ConfidentialClientApplication(msalConfig);
    const scopes = [
      "https://auth.msft.communication.azure.com/Teams.ManageCalls",
      "https://auth.msft.communication.azure.com/Teams.ManageChats",
    ];
    // Create request parameters object for acquiring the AAD token and object ID of a Teams user
    const usernamePasswordRequest = {
      scopes: scopes,
      username: MSAL_USERNAME,
      password: MSAL_PASSWORD,
      //client_secret: AAD_CLIENT_SECRET,
    };
    // console.log("msalInstance", msalInstance);
    console.log("usernamePasswordRequest", usernamePasswordRequest);
    // Retrieve the AAD token and object ID of a Teams user
    const response = await msalInstance.acquireTokenByUsernamePassword(
      usernamePasswordRequest
    );

    console.log ("response.accessToken", response.accessToken);
    const teamsToken = response.accessToken;
    // const teamsToken = `eyJ0eXAiOiJKV1QiLCJub25jZSI6IjQtcjBLZHBFTDBPVVUtRnRjX0NuZXdzdWh3SnlKQTdmVGJjcnJTUlg4LTQiLCJhbGciOiJSUzI1NiIsIng1dCI6IjNQYUs0RWZ5Qk5RdTNDdGpZc2EzWW1oUTVFMCIsImtpZCI6IjNQYUs0RWZ5Qk5RdTNDdGpZc2EzWW1oUTVFMCJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kY2M2ZWQ0Mi1jODQzLTQ4MGQtOWQ0OC1iYTMzYzAwMTEwMzIvIiwiaWF0IjoxNzI5MTE4OTQyLCJuYmYiOjE3MjkxMTg5NDIsImV4cCI6MTcyOTEyNDAxNiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhZQUFBQXV4VUdIMHZvNjZ5VGk1b241SEU3THJzMk9OU3c3ZmdrYW9zcW9QanVPR0laandPbStFbWlvTUdOQmdXY0J2cmRyY1FROHJDOXkvQWRoTTYvbTMzZzdqTGo3amczUHJEWmhLbFplTHB5dzI0PSIsImFtciI6WyJwd2QiLCJtZmEiXSwiYXBwX2Rpc3BsYXluYW1lIjoiTWljcm9zb2Z0IEF6dXJlIENMSSIsImFwcGlkIjoiMDRiMDc3OTUtOGRkYi00NjFhLWJiZWUtMDJmOWUxYmY3YjQ2IiwiYXBwaWRhY3IiOiIwIiwiZGV2aWNlaWQiOiJjNWZhOGQ0Yi1kZDliLTRmZTgtYjExOC1kOWNjNGE3ZjZmNDEiLCJmYW1pbHlfbmFtZSI6IlRlYW1zIEludGVncmF0aW9uIFRlc3QiLCJnaXZlbl9uYW1lIjoiQWxpY2UiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNC4yMzQuMTk3LjE1OCIsIm5hbWUiOiJBbGljZSBUZWFtcyBJbnRlZ3JhdGlvbiBUZXN0Iiwib2lkIjoiYzQ5ODM5NzYtOGMzZC00M2JiLWFmYTItM2RhZDQ2Y2FjNWViIiwicGxhdGYiOiIzIiwicHVpZCI6IjEwMDMyMDAzNTQxNDI3RTEiLCJyaCI6IjAuQVJzQVF1M0czRVBJRFVpZFNMb3p3QUVRTWdNQUFBQUFBQUFBd0FBQUFBQUFBQURZQUVzLiIsInNjcCI6IkF1ZGl0TG9nLlJlYWQuQWxsIERpcmVjdG9yeS5BY2Nlc3NBc1VzZXIuQWxsIGVtYWlsIEdyb3VwLlJlYWRXcml0ZS5BbGwgb3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkV3JpdGUuQWxsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoiZENQd3FJY1NzalplTVByYW9MNWd4TGx6ZEJCeUtnTy1EYm84QTEySC1JdyIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJOQSIsInRpZCI6ImRjYzZlZDQyLWM4NDMtNDgwZC05ZDQ4LWJhMzNjMDAxMTAzMiIsInVuaXF1ZV9uYW1lIjoiYWxpY2V0ZWFtc0BhbGljZXJlY2VwdGlvbmlzdC5jb20iLCJ1cG4iOiJhbGljZXRlYW1zQGFsaWNlcmVjZXB0aW9uaXN0LmNvbSIsInV0aSI6InFLcGl5UGJXNUU2Q1B6UnBFVjBBQUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbImI3OWZiZjRkLTNlZjktNDY4OS04MTQzLTc2YjE5NGU4NTUwOSJdLCJ4bXNfaWRyZWwiOiIxIDYiLCJ4bXNfc3QiOnsic3ViIjoiQjZhRFpYWGFfb0pjblpreVZxNDNHWkktbXpRN25VSlpkVkpFaUJ1YTRYRSJ9LCJ4bXNfdGNkdCI6MTQ3MzY4MzI2OH0.fMsi1XJjG5RRKtWK1seLR9nFhm4IycDeNILrwGqbZOzDa6ZyLCVD9V6AcdcN6-6HsDv1rtbHMkTqIpTNiU3ZZZ8XHkEfEOKL1g3cajCTAwlMO1c_KYdBJZXQgupA5xbRkjVm-CuLWarSOr9C1QGqx18IgDbVoeSefXR9vMHNFkkOROPjXGlcTElnMDAaoAKgw5DDQzCEP2ofIj83bHOZr6vdytVPL3qu_zs3jil3D9RLrdFiN8xKPk1lR-GuTyN5GieKJZb5xKVZyBYWK-03OwyP1TMuG3UlwSdzWyd3TWi_ogEX9gKF89SGIS-9ty1MJRqvg-O-pgKSUKBIPucGgA`;
    
    console.log(
      `Retrieved a token with the expiration: ${response.extExpiresOn}`
    );

    // Retrieve the user object ID
    const userObjectId = response.uniqueId;
    // const userObjectId = "c4983976-8c3d-43bb-afa2-3dad46cac5eb";

    console.log(
      "Exchanging the AAD access token for a Communication access token"
    );

    // Exchange the AAD access token of a Teams user for a new Communication Identity access token
    const communicationAccessToken = await client.getTokenForTeamsUser({
      teamsUserAadToken: teamsToken, // AAD token of a Teams user
      clientId: AAD_CLIENT_ID, // '04b07795-8ddb-461a-bbee-02f9e1bf7b46', //AAD_CLIENT_ID, // client id of an Azure AD application to be verified against the appId claim in the teamsUserAadToken
      userObjectId: userObjectId, // object ID of a Teams user
    });

    console.log(
      `Exchanged Communication access token: ${communicationAccessToken.token}`
    );
    return communicationAccessToken.token;
  } catch (error) {
    throw error;
  }
};

const getUserInfo = async (email, did, cid, token) => {
  try {
    const byClientApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByClient/${TEAMS_CALLING_FEATURE_ID},${cid}`;
    const byDirectoryApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByDirectory/${TEAMS_CALLING_FEATURE_ID},${did}`;
    const { data: byClient } = await axios.get(byClientApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      }
    });
    const { data: byDirectory } = await axios.get(byDirectoryApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      }
    });
    console.log("byClient", byClient);
    console.log("byDirectory", byDirectory);
    // GetValuesByDirectory
    const AAD_TENANT_ID = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_TENANT_ID"
    ).Value;
    const AAD_CLIENT_ID = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_CLIENT_ID"
    ).Value;
    const AAD_CLIENT_SECRET = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "AAD_CLIENT_SECRET"
    ).Value;

    const msalConfiguration = {
      auth: {
        clientId: AAD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${AAD_TENANT_ID}`,
        clientSecret: AAD_CLIENT_SECRET,
      },
    };

    const cca = new ConfidentialClientApplication(msalConfiguration);

    const authResult = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    const accessToken = authResult.accessToken;
    const graphApiUrl = `https://graph.microsoft.com/v1.0/users/${email}`;
    const graphResponse = await axios.get(graphApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Applications:", graphResponse.data.id);
    return graphResponse.data.id;
  } catch (error) {
    throw error;
  }
};

// Function to obtain the PSTN token
const getAccessTokenForPSTN = async (cid, did, token) => {
  try {

    const byClientApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByClient/${TEAMS_CALLING_FEATURE_ID},${cid}`;
    const byDirectoryApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByDirectory/${TEAMS_CALLING_FEATURE_ID},${did}`;
    const { data: byClient } = await axios.get(byClientApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      }
    });
    const { data: byDirectory } = await axios.get(byDirectoryApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
    }});
    console.log("byClient", byClient);
    console.log("byDirectory", byDirectory);
    // GetValuesByDirectory
    const COMMUNICATION_SERVICES_CONNECTION_STRING = byClient.FeaturePropertyValues.find(
      (item) => item.Name === "COMMUNICATION_SERVICES_CONNECTION_STRING"
    ).Value;


    console.log("\n== getAccessTokenForPSTN() ==\n");
    console.log("\n== Get Access Token for Teams User sample ==\n");

    const client = new CommunicationIdentityClient(
      COMMUNICATION_SERVICES_CONNECTION_STRING
    );

    // Get an AAD token and object ID of a Teams user
    console.log("Getting an AAD token and an object ID of a Teams user");

    // Exchange the AAD access token of a Teams user for a new Communication Identity access token
    const communicationAccessToken = await client.createUserAndToken(["voip"]);

    console.log(
      `Exchanged Communication access token: ${communicationAccessToken.token}`
    );
    return communicationAccessToken.token;
  } catch (error) {
    console.error("Error obtaining PSTN token:", error);
    throw error;
  }
};

const validateApplicationToken = async (token) => {
  try {
    console.log("\n== AuthenticateApplicationToken() ==\n");

    if (!token) {
      console.error("No token provided");
      return false;
    }
    console.log("\n== token value ==\n", token);
    const restAPIDomain = getEndpoint();
    console.log("restAPIDomain", restAPIDomain);
    const response = await instance({
      method: "post",
      url: `${restAPIDomain}/api/auth/ValidateToken`,
      data: {
        // Username: API_USERNAME,
        // Password: API_PASSWORD,
      },
      headers: {
        Authorization: "bearer " + token,
      },
    });
    if (response.status === 200) {
      console.log("ValidateApplicationToken: Token is valid", response);
      return true;
    } else {
      //console.log("ValidateApplicationToken: Token is NOT valid", response);
      return false;
    }
  
  }
  catch (error) {
    console.error("Error:", error);
    console.log("ValidateApplicationToken: Token is NOT valid");
    return false;
  }
}

const getRestAPIEndpoint = () => {
  console.log("\n== getRestAPIEndpoint() ==\n");
  const { getEndpoint } = require("./../utils/helper.utils");
  console.log("getEndpoint", getEndpoint());
  return getEndpoint();
};

// const LogError = async (error = {message: ""}, cid = 0, did = 0, token) => {
//   const endpoint = getEndpoint();
//   error.did = did;
//   error.cid = cid;
//   // add logger here, add dynamic endpoint
// axios.post(`${endpoint}/api/ApplicationLogs/Add`, {
//   "Message": error?.message,
//   "Level": "Error",
//   "Error": JSON.stringify(error),
// }, {
//   headers: {
//     'Content-Type': 'application/json',
//     'Bearer': token
//   }
// })
// }

// const applicationLogin = async () => {
//     try {
//         console.log("\n== ApplicationLogin() ==\n");
//         const restAPIDomain = getEndpoint();

//         const response = await axios({
//                 method: "post",
//                 url: authUrl,
//                 data: {
//                   Username: API_USERNAME,
//                   Password: API_PASSWORD,
//                 },
//               });

//         if (response.status === 200){
//             return true;
//         } else {
//             return false;
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         throw error;
//     }
//     }

module.exports = {
  getAccessToken,
  getUserInfo,
  getAccessTokenForPSTN,
  validateApplicationToken,
  _getRestAPIEndpoint: getRestAPIEndpoint,
  //LogError,
};
