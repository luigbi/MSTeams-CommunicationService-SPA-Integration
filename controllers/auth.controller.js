// require getUserInfo function from services/auth.services.js
const { getUserInfo } = require("./../services/auth.services");
const {
  getAccessToken: _getAccessToken,
  getAccessTokenForPSTN,
  validateApplicationToken,
  _getRestAPIEndpoint,
  LogError,
    // ApplicationLogin,
} = require("./../services/auth.services");
const { getEndpoint } = require("./../utils/helper.utils");
// const authority = `https://login.microsoftonline.com/${AAD_TENANT_ID}`;
const restAPIDomain = getEndpoint();
const {
  TEAMS_CALLING_FEATURE_ID,
} = require("./../constants/env");
const axios = require("axios");

const getAccessToken = async (req, res) => {
  try {
    // start timer and get timestamp
    const start = new Date().getTime();

    if (!req.body.token) {
      res.status(400).json({ error: "Application Token is required" });
      return;
    }

    const { token, did, cid } = req.body;

    // call Application Rest API to validate the Application auth token
    const isValid = await validateApplicationToken(token);

    if (!isValid) {
      res.status(401).json({ error: "Invalid token", eventName: "token_not_valid" });
      return;
    }
    // timestamp after Application token validation
    const afterApplication = new Date().getTime();

    const email = req.body.email; // Get email from body
    console.log("email", email);
    const accessTokenData = await _getAccessToken(did, cid, token);
    console.log({ accessTokenData });
    console.log("accessTokenData", accessTokenData);
    // timestamp after getting access token
    const afterAccessToken = new Date().getTime();

    const userInfo = await getUserInfo(email, did, cid, token);

    const end = new Date().getTime();

    // calculate time taken for each step and put it into a js object
    const timeTaken = {
      routeName: "getAccessToken",
      validateApplicationToken: afterApplication - start,
      getAccessToken: afterAccessToken - afterApplication,
      getUserInfo: end - afterAccessToken,
      totalTime: end - start,
    };
    res.json({ 
      accessTokenData, 
      userInfo,
      timeTaken
    });
  } catch (error) {
    const did = req?.body?.did;
    const cid = req?.body?.cid;
    const token = req?.body?.token;

    //LogError(error, cid, did, token);
    console.error("Error:", error);
    //res.status(500).json({ error: error.message });
    res.status(500).json({ error });
  }
};

const getPSTNToken = async (req, res) => {
  try {
    // start timer and get timestamp
    const start = new Date().getTime();

    // get Application auth token from the req body
if (!req.body.token) {
      res.status(400).json({ error: "Application Token is required" });
      return;
    }

    // const token = req.body.token;
    const { token, did, cid } = req.body;
    console.log("token", token);
    console.log("did", did);
    console.log("cid", cid);
    // call Application Rest API to validate the Application auth token
    const isValid = await validateApplicationToken(token);

    // timestamp after Application token validation
    const afterApplication = new Date().getTime();

    if (!isValid) {
      console.log(`
      validateApplicationToken: Token is NOT valid. 
      ${token}`);
      res.status(401).json({ error: "Invalid token" });
      return;
    } else {
      console.log(`
      validateApplicationToken: Token is valid. 
      ${token}`);
    }
    // Call the function to obtain the PSTN token
    const pstnToken = await getAccessTokenForPSTN(cid, did, token);

    const byDirectoryApiUrl = `${restAPIDomain}/api/FeatureProperty/GetValuesByDirectory/${TEAMS_CALLING_FEATURE_ID},${did}`;
    const { data: byDirectory } = await axios.get(byDirectoryApiUrl, {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      }
  });
  const communicationServicesPhoneNumber = byDirectory.FeaturePropertyValues.find(
    (item) => item.Name === "Communication Service Telephone Number"
  ).Value;

    // timestamp after getting PSTN token
    const end = new Date().getTime();

    // calculate time taken for each step and put it into a js object
    const timeTaken = {
      routeName: "getPSTNToken",
      validateApplicationToken: afterApplication - start,
      getAccessTokenForPSTN: end - afterApplication,
      totalTime: end - start,
    }

    // Send the PSTN token in the response
    res.json({ 
      pstnToken,
      communicationServicesPhoneNumber, 
      timeTaken 
    });
  } catch (error) {
    const did = req?.body?.did;
    const cid = req?.body?.cid;
    const token = req?.body?.token;

    // LogError(error, cid, did, token);
    console.error("Error:", error);
    //res.status(500).json({ error: error.message });
    res.status(500).json({ error });
  }
};

const getRestAPIEndpoint = async (req, res) => {
  const response = await _getRestAPIEndpoint();
  return res.json(response);
}

module.exports = {
  getAccessToken,
  getPSTNToken,
  getRestAPIEndpoint,
};
