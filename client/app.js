// Make sure to install the necessary dependencies
const { CallClient, VideoStreamRenderer, LocalVideoStream } = require('@azure/communication-calling');
const { AzureCommunicationTokenCredential } = require('@azure/communication-common');
const { AzureLogger, setLogLevel } = require("@azure/logger");

const CONSTANTS = Object.freeze({
  AppName: "Teams Video Call App",
  environments: {
    dev: "dev",
    qa: "qa",
    stage: "stage",
    prod: "prod",
  },
  remoteParticipantEvents: {

  },
  callEvents: {
    idChanged: "call:idChanged",
    stateChanged: "call:stateChanged",
    state: {
        connected: "call:state:connected",
        disconnected: "call:state:disconnected",
    },
    isLocalVideoStartedChanged: "call:isLocalVideoStartedChanged",
    localVideoStreamsUpdated: "call:localVideoStreamsUpdated",
    remoteParticipantsUpdated: "call:remoteParticipantsUpdated",
  },
});
// Set the log level and output
setLogLevel('verbose');
AzureLogger.log = (...args) => {
    console.log(...args);
};
// Calling web sdk objects
let teamsCallAgent;
let deviceManager;
let call;
let incomingCall;
let localVideoStream;
let localVideoStreamRenderer;

// UI widgets
let remoteVideoContainer = document.getElementById('remoteVideoContainer');
let localVideoContainer = document.getElementById('localVideoContainer');
/**
 * Create an instance of CallClient. Initialize a TeamsCallAgent instance with a CommunicationUserCredential via created CallClient. TeamsCallAgent enables us to make outgoing calls and receive incoming calls. 
 * You can then use the CallClient.getDeviceManager() API instance to get the DeviceManager.
 */
/**
 * Place a 1:1 outgoing video call to a user
 * Add an event listener to initiate a call when the `startCallButton` is selected.
 * Enumerate local cameras using the deviceManager `getCameraList` API.
 * In this quickstart, we're using the first camera in the collection. Once the desired camera is selected, a
 * LocalVideoStream instance will be constructed and passed within `videoOptions` as an item within the
 * localVideoStream array to the call method. When the call connects, your application will be sending a video stream to the other participant. 
 */

const eventNames = [
    'start_call',
//    'accept_call',
//    'start_video',
//    'stop_video',
    'hang_up_call',
//    'token_not_found',
//    'token_not_valid',
];

let isRemoteParticipantOnHold = false;

const adjustWidthToMatchHeight = (elementSelector, parentSelector, maxIterations = 1000) => {
    // Get the element and window heights
    var element = document.querySelector(elementSelector);
    var parent = parentSelector == "window" ? window : document.querySelector(parentSelector);

  // reset element height/width styles
  element.style.height = "auto"; 
  element.style.width = "auto"; 
  
  // get parent and element heights
    var parentHeight = parentSelector == "window" ? parent.innerHeight : parent.offsetHeight;
    var elementHeight = element.clientHeight;
  
    // Increment width until element height matches window height
    var iterations = 0;
    while (elementHeight < parentHeight && iterations < maxIterations) {
      var currentWidth = element.offsetWidth;
      element.style.width = (currentWidth + 1) + 'px';
      elementHeight = element.clientHeight;
      iterations++;
    }
  
    // Check if the loop reached the maximum iterations
    if (iterations === maxIterations) {
      console.error('Reached maximum iterations. Element height could not match window height.');
    }
  };

document.addEventListener("start_call", async (e) => {
    try {
        // timestamp before starting call
        window.start = new Date().getTime();
        console.warn('start_call: begin ', window.start - window.start);
        const start = new Date().getTime();
        const { identity, name } = e.detail;
        window.callerName = name;
        document.querySelector('.nowConnecting').innerText = `Calling ${name}`;
        // add bounce class to nowConnecting
        document.querySelector('.nowConnecting').classList.add('bounce');

        // Check if the input is a Teams user ID or a phone number
        if (identity.includes('@')) {
            // Input is a Teams user ID
            const userid = await authenticateTeams(identity);
            window.createVideoStreamStart = new Date().getTime();
            //console.warn('start_call: createVideoStreamStart: ', (new Date().getTime() - window.start) / 1000);
            if (userid?.error) {
                const { error } = userid;
                document.querySelector('.nowConnecting').innerText = `Error: ${error?.message ? error?.message : error}`;
                throw new Error(error);
            }
            const localVideoStream = await createLocalVideoStream();
            console.warn('start_call: createLocalVideoStream: ', (new Date().getTime() - window.start) / 1000);
            const videoOptions = localVideoStream ? { localVideoStreams: [localVideoStream] } : undefined;
            call = teamsCallAgent.startCall([{ microsoftTeamsUserId: userid }], { videoOptions: videoOptions });
            console.warn('start_call: teamsCallAgent: startCall: ', (new Date().getTime() - window.start) / 1000);   
        }
        else {
            const authResult = await authenticatePSTN();
            console.warn('start_call: authenticatePSTN Finish: ', (new Date().getTime() - window.start) / 1000);
            if (authResult?.error) {
                const { error } = authResult;
            
                throw new Error(error);
            }
            call = teamsCallAgent.startCall(
                [{phoneNumber: identity}],
                { 
                    alternateCallerId: {
                        phoneNumber: window.communicationServicesPhoneNumber //'+17252181402' //+18332419135
                    }
                }
            );
            console.warn('start_call: teamsCallAgent: startCall: ', (new Date().getTime() - window.start) / 1000);
        }
        // Subscribe to the call's properties and events.
        subscribeToCall(call);
        console.warn('start_call: subscribedToCall: ', (new Date().getTime() - window.start) / 1000);

    } catch (error) {
        LogError(signError(error, "start_call"));
    }
});

/**
 * Accepting an incoming call with a video
 * Add an event listener to accept a call when the `acceptCallButton` is selected.
 * You can accept incoming calls after subscribing to the `TeamsCallAgent.on('incomingCall')` event.
 * You can pass the local video stream to accept the call with the following code.
 */

document.addEventListener("accept_call", async () => {
    try {
        const localVideoStream = await createLocalVideoStream();
        const videoOptions = localVideoStream ? { localVideoStreams: [localVideoStream] } : undefined;
        call = await incomingCall.accept({ videoOptions });
        // alert('Call accepted');
        // Subscribe to the call's properties and events.
        subscribeToCall(call);
    } catch (error) {
        LogError(signError(error, "accept_call"));
    }
});

// Subscribe to a call obj.
// Listen for property changes and collection udpates.
subscribeToCall = (call) => {
    try {
        // Inspect the initial call.id value.
        console.log(`Call Id: ${call.id}`);
        //Subsribe to call's 'idChanged' event for value changes.
        call.on('idChanged', () => {
            dispatchCustomEvent(CONSTANTS.callEvents.idChanged, call.id);
            console.log(`Call ID changed: ${call.id}`);
        });
        // Inspect the initial call.state value.
        console.log(`Call state: ${call.state}`);
        // Subscribe to call's 'stateChanged' event for value changes.`
        call.on('stateChanged', async () => {
            dispatchCustomEvent(CONSTANTS.callEvents.stateChanged, call.state);
            console.warn(`Call state changed: ${call.state}`);
            if (call.state === 'Connected') {
                console.warn('Call State changed to \'Connected\'. Time from begin: ', (new Date().getTime() - window.start) / 1000);
                // call connected timestamp
                window.createVideoStreamAnswered = new Date().getTime();

                window.startCallToAnsweredTimeTaken = { 
                    name: "start video call to call connected (after authenticate teams)",    
                    totalTime: window.createVideoStreamAnswered - window.createVideoStreamStart
                };

                document.querySelector('.nowConnecting').innerText = `Now Connected with ${window.callerName}`;
                document.querySelector('.nowConnecting').classList.remove('bounce');
                document.querySelector('.nowConnecting').classList.remove('hidden'); // show the text


                const connected = CONSTANTS.callEvents.state.connected;
                dispatchCustomEvent(connected, { type: "connected", message: "", name: "" });
            } else if (call.state === 'Disconnected') {
                const disconnected = CONSTANTS.callEvents.state.disconnected;
                document.querySelector('.nowConnecting').innerText = `Call ended`;
                const { code, subCode, message } = call.callEndReason;

                // https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/communication-services/resources/troubleshooting/voice-video-calling/includes/codes/call-end.md
                if (subCode == 10004) {
                    // do things
                    dispatchCustomEvent(disconnected, { type: "notAnswered", message: "", name: "" });
                } else {
                    dispatchCustomEvent(disconnected, { type: "disconnected", message: "", name: "" });
                }               
                
                console.warn(`Call ended, call end reason={code=${JSON.stringify(call.callEndReason)}, subCode=${call.callEndReason.subCode}}`);
            } else if(call.state === 'RemoteHold' || call.state === 'LocalHold') {
                dispatchCustomEvent('Hold');
            }
        });
        call.on('isLocalVideoStartedChanged', () => {
            dispatchCustomEvent(CONSTANTS.callEvents.isLocalVideoStartedChanged, call.isLocalVideoStarted);
            console.log(`isLocalVideoStarted changed: ${call.isLocalVideoStarted}`);
        });
        console.log(`isLocalVideoStarted: ${call.isLocalVideoStarted}`);
        call.localVideoStreams.forEach(async (lvs) => {
            localVideoStream = lvs;
            await displayLocalVideoStream();
        });
        call.on('localVideoStreamsUpdated', e => {
            dispatchCustomEvent(CONSTANTS.callEvents.localVideoStreamsUpdated, e);
            e.added.forEach(async (lvs) => {
                localVideoStream = lvs;
                await displayLocalVideoStream();
            });
            e.removed.forEach(lvs => {
                removeLocalVideoStream();
            });
        });

        // Inspect the call's current remote participants and subscribe to them.
        call.remoteParticipants.forEach(remoteParticipant => {
            subscribeToRemoteParticipant(remoteParticipant);
        });
        // Subscribe to the call's 'remoteParticipantsUpdated' event to be
        // notified when new participants are added to the call or removed from the call.
        call.on('remoteParticipantsUpdated', e => {
            dispatchCustomEvent(CONSTANTS.callEvents.remoteParticipantsUpdated, e);
            // Subscribe to new remote participants that are added to the call.
            e.added.forEach(remoteParticipant => {
                subscribeToRemoteParticipant(remoteParticipant)
            });
            // Unsubscribe from participants that are removed from the call
            e.removed.forEach(remoteParticipant => {
                console.log('Remote participant removed from the call.');
            });
        });
    } catch (error) {
        LogError(signError(error, "subscribeToCall"));
    }
}
// Subscribe to a remote participant obj.
// Listen for property changes and collection udpates.
subscribeToRemoteParticipant = (remoteParticipant) => {
    try {
        // Inspect the initial remoteParticipant.state value.
        console.log(`Remote participant state: ${remoteParticipant.state}`);
        // add/remove hidden class to the participant-no-camera div if RemoteParticipant 'isSpeakingChanged' event is triggered
        remoteParticipant.on('isSpeakingChanged', () => {
            if (remoteParticipant.isSpeaking) {
                document.querySelector('.remoteVideoContainer').classList.add('is-speaking');
            } else {
                document.querySelector('.remoteVideoContainer').classList.remove('is-speaking');
            }
        });
        
        // Subscribe to remoteParticipant's 'stateChanged' event for value changes.
        remoteParticipant.on('stateChanged', () => {
            if (remoteParticipant.state === 'Hold') {
                console.warn('Remote participant on hold');
                isRemoteParticipantOnHold = true;
                // document.querySelector('.participant-no-camera').classList.add('hidden');
                document.querySelector('.hold-icon').classList.remove('hidden');
                document.querySelector('.hold-icon-span').classList.remove('hidden');
                document.querySelector('.nowConnecting').classList.add('hidden'); // hide the text
            } else if (isRemoteParticipantOnHold) {
                isRemoteParticipantOnHold = false;
                console.warn('Remote participant off hold');
                document.querySelector('.hold-icon').classList.add('hidden');
                document.querySelector('.hold-icon-span').classList.add('hidden');
            }

            if (remoteParticipant.state === 'Connected') {
                console.warn('Remote participant connected');
                const {videoStreams} = remoteParticipant
                document.querySelector('.nowConnecting').innerText = `Now Connected with ${window.callerName}`;
                document.querySelector('.nowConnecting').classList.remove('bounce');
                document.querySelector('.nowConnecting').classList.remove('hidden'); // show the text
                const filtered = videoStreams.filter(v => v._mediaStreamType === "Video").filter(v => v._isAvailable === true);
            }
            if (remoteParticipant.state === 'Disconnected') {
                console.warn('Remote participant disconnected');
                //document.querySelector('.nowConnecting').innerText = 'Call ended';  
                //remove bounce class from nowConnecting
                //document.querySelector('.nowConnecting').classList.remove('bounce');         
            }
            dispatchCustomEvent(CONSTANTS.callEvents.stateChanged, remoteParticipant.state);
            console.log(`Remote participant state changed: ${remoteParticipant.state}`);
        });
        // Inspect the remoteParticipants's current videoStreams and subscribe to them.
        remoteParticipant.videoStreams.forEach(remoteVideoStream => {
            subscribeToRemoteVideoStream(remoteVideoStream)
        });
        // Subscribe to the remoteParticipant's 'videoStreamsUpdated' event to be
        // notified when the remoteParticiapant adds new videoStreams and removes video streams.
        remoteParticipant.on('videoStreamsUpdated', e => {
            // Subscribe to newly added remote participant's video streams.
            e.added.forEach(remoteVideoStream => {
                subscribeToRemoteVideoStream(remoteVideoStream)
            });
            // Unsubscribe from newly removed remote participants' video streams.
            e.removed.forEach(remoteVideoStream => {
                console.log('Remote participant video stream was removed.');
            })
        });
    } catch (error) {
        LogError(signError(error, "subscribeToRemoteParticipant"));
    }
}
/**
 * Subscribe to a remote participant's remote video stream obj.
 * You have to subscribe to the 'isAvailableChanged' event to render the remoteVideoStream. If the 'isAvailable' property
 * changes to 'true' a remote participant is sending a stream. Whenever the availability of a remote stream changes
 * you can choose to destroy the whole 'Renderer' a specific 'RendererView' or keep them. Displaying RendererView without a video stream will result in a blank video frame. 
 */
subscribeToRemoteVideoStream = async (remoteVideoStream) => {
    // Create a video stream renderer for the remote video stream.
    let videoStreamRenderer = new VideoStreamRenderer(remoteVideoStream);
    let view; 

    const renderVideo = async () => {
        try {
            // Create a renderer view for the remote video stream.
            view = await videoStreamRenderer.createView();
            // Attach the renderer view to the UI.
            remoteVideoContainer.hidden = false;
            remoteVideoContainer.appendChild(view.target);
            adjustWidthToMatchHeight("#remoteVideoContainer > div", "window");
        } catch (e) {
            LogError(signError(e, "subscribeToRemoteVideoStream"));  
        }
    }
    remoteVideoStream.on('isAvailableChanged', async () => {
        // Participant has switched video on.
        if (remoteVideoStream.isAvailable) {

            //hide the image
            //document.querySelector('.participant-no-camera').classList.add('hidden');
            await renderVideo();
            // Participant has switched video off.
        } else {
            if (view) {
                view.dispose();
                view = undefined;
                //show the image
                document.querySelector('.nowConnecting').classList.add('hidden'); // hide the text
                //document.querySelector('.participant-no-camera').classList.remove('hidden');
            }
        }
    });
    // Participant has video on initially.
    if (remoteVideoStream.isAvailable) {
        await renderVideo();
    }
}
// Start your local video stream.
// This will send your local video stream to remote participants so they can view it.

document.addEventListener("start_video", async () => {
    try {
        const localVideoStream = await createLocalVideoStream();
        await call.startVideo(localVideoStream);
    } catch (error) {
        LogError(signError(error, "start_video"));
    }
});

// Stop your local video stream.
// This will stop your local video stream from being sent to remote participants.

document.addEventListener("stop_video", async () => {
    try {
        await call.stopVideo(localVideoStream);
    } catch (error) {
        LogError(signError(error, "stop_video"));
    }
});

/**
 * To render a LocalVideoStream, you need to create a new instance of VideoStreamRenderer, and then
 * create a new VideoStreamRendererView instance using the asynchronous createView() method.
 * You may then attach view.target to any UI element. 
 */
// Create a local video stream for your camera device
createLocalVideoStream = async () => {
    const camera = (await deviceManager.getCameras())[0];
    if (camera) {
        return new LocalVideoStream(camera);
    } else {
        LogError(signError({message: `No camera device found on the system`}, "stop_video"));
    }
}
// Display your local video stream preview in your UI
displayLocalVideoStream = async () => {
    try {

        localVideoStreamRenderer = new VideoStreamRenderer(localVideoStream);
        const view = await localVideoStreamRenderer.createView();
        localVideoContainer.hidden = false;
        localVideoContainer.appendChild(view.target);
        adjustWidthToMatchHeight("#localVideoContainer > div", "#localVideoContainer");
    } catch (error) {
        LogError(signError(error, "displayLocalVideoStream"));
    }
}
// Remove your local video stream preview from your UI
removeLocalVideoStream = async () => {
    try {
        localVideoStreamRenderer.dispose();
        localVideoContainer.hidden = true;
    } catch (error) {
        LogError(signError(error, "removeLocalVideoStream"));
    }
}

// Hang up the current call
document.addEventListener("hang_up_call", async () => {
    try {
        console.warn('hang_up_call event received');
        // end the current call
        if (call.state !== 'Disconnected') {
            await call.hangUp();
            console.warn('hang_up_call: Call hung up');
        } else {
            console.warn('hang_up_call: Call already disconnected');
        }
    } catch (error) {
        LogError(signError(error, "hang_up_call"));
    }
});

function getTokenWithRetry(retries, delay, tokenVar) {
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            const token = localStorage.getItem("token");
            if (token !== null) {
                console.log("Token retrieved from local storage");
                clearInterval(intervalId);
                tokenVar = token;
                resolve(token);
            } else if (retries <= 0) {
                clearInterval(intervalId);
                reject(new Error("Exceeded maximum number of retries"));
            } else {
                retries--;
                console.log("Retrying to get token from local storage, retries left:", retries);
            }
        }, delay);
    });
}

authenticateTeams = async (email) => {
    try {
        // get token from local storage
        let token = localStorage.getItem('token');
        const retries = 5;
        const delay = 500;       
        await getTokenWithRetry(retries, delay, token);
        if (!token) {
            throw new Error('No token found in local storage');
        }
        const startAfterGetAccessToken = new Date().getTime();
        console.warn('start_call: authenticateTeams: token retrieved from local storage', (startAfterGetAccessToken - window.start) / 1000);
        // get cid and did from local storage
        const cid = localStorage.getItem('cid');
        const did = localStorage.getItem('did');

        const response = await fetch('/get-access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, token: token, cid: cid, did: did })
        });
        if (response.ok) {
            const data = await response.json();
            // record time stamp at after response
            console.warn('start_call: authenticateTeams: /get-access-token response', (new Date().getTime() - window.start) / 1000);
            console.warn('start_call: authenticateTeams: /get-access-token breakdown: validateApplicationToken', data.timeTaken.validateApplicationToken / 1000);
            console.warn('start_call: authenticateTeams: /get-access-token breakdown: getAccessToken', data.timeTaken.getAccessToken / 1000);
            console.warn('start_call: authenticateTeams: /get-access-token breakdown: getUserInfo', data.timeTaken.getUserInfo / 1000);

            window.getAccessTokenTimeTaken = data.timeTaken;

            const userAccessToken = data.accessTokenData;
            const userID = data.userInfo;
            const callClient = new CallClient();
            tokenCredential = new AzureCommunicationTokenCredential(userAccessToken.trim());
            
            console.warn('start_call: authenticateTeams: afterTokenCredential', (new Date().getTime() - window.start) / 1000);

            // Dispose the existing call agent if it exists
            if (teamsCallAgent) {
                teamsCallAgent.dispose();
                teamsCallAgent = undefined;
            }

            teamsCallAgent = await callClient.createTeamsCallAgent(tokenCredential)
            // timestamp after creating call agent
            console.warn('start_call: authenticateTeams: afterCallAgent', (new Date().getTime() - window.start) / 1000);

            // Set up a camera device to use.
            deviceManager = await callClient.getDeviceManager();
            await deviceManager.askDevicePermission({ video: true });
            await deviceManager.askDevicePermission({ audio: true });
            // Listen for an incoming call to accept.
            teamsCallAgent.on('incomingCall', async (args) => {
                try {
                    incomingCall = args.incomingCall;
                } catch (error) {
                    // pass to higher scoped error handler
                    throw new Error(error);
                }
            });

            // timestamp after getting device manager and listenter
            const afterDeviceManager = new Date().getTime();
            console.warn('start_call: authenticateTeams: afterDeviceManager', (afterDeviceManager - window.start) / 1000);
            console.warn('start_call: authenticateTeams: end ', (new Date().getTime() - window.start) / 1000);
            return userID;
        } else {
            throw new Error('Failed to retrieve access token');
        }
    } catch (error) {
        LogError(signError(error, "authenticateTeams"));
    }
}
authenticatePSTN = async () => {
    try {
        // get token from local storage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found in local storage');
        }
        const response = await fetch('/get-pstn-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token, cid: localStorage.getItem('cid'), did: localStorage.getItem('did') })
        });

        if (response.ok) {
            const startAfterGetPstnToken = new Date().getTime();
            const data = await response.json();
            window.communicationServicesPhoneNumber = data.communicationServicesPhoneNumber;
            // console.warn('getPSTNToken TimeTaken:', data.timeTaken);
            window.getPSTNTokenTimeTaken = data.timeTaken;
            console.warn('start_call: authenticatePSTN: /get-pstn-token response', (new Date().getTime() - window.start) / 1000);
            // console.warn('authenticatePSTN: /get-pstn-token TotalTimeTaken:', data.timeTaken.totalTime / 1000);
            console.warn('start_call: authenticatePSTN: /get-pstn-token breakdown: validateApplicationToken', data.timeTaken.validateApplicationToken / 1000);
            console.warn('start_call: authenticatePSTN: /get-pstn-token breakdown: getAccessTokenForPSTN', data.timeTaken.getAccessTokenForPSTN / 1000);
            // console.warn('authenticatePSTN: /get-pstn-token TimeTaken:', data.timeTaken);

            const beforeTokenCredential = new Date().getTime();
            console.log('Communication Access Token:', data);
            const userAccessToken = data.pstnToken;
            const callClient = new CallClient();
            tokenCredential = new AzureCommunicationTokenCredential(userAccessToken.trim());
            const afterTokenCredential = new Date().getTime();
            console.warn('start_call: authenticatePSTN: AzureCommunicationTokenCredential created', (new Date().getTime() - window.start) / 1000);
            // Dispose the existing call agent if it exists
            if (teamsCallAgent) {
                teamsCallAgent.dispose();
                teamsCallAgent = undefined;
            }

            teamsCallAgent = await callClient.createCallAgent(tokenCredential)
            const afterCallAgent = new Date().getTime();
            console.warn('start_call: authenticatePSTN: CallAgentCreated', (new Date().getTime() - window.start) / 1000);
            // Set up a camera device to use.
            deviceManager = await callClient.getDeviceManager();
            console.warn('start_call: authenticatePSTN: DeviceManagerCreated', (new Date().getTime() - window.start) / 1000);
            //await deviceManager.askDevicePermission({ video: true });
            await deviceManager.askDevicePermission({ audio: true });
            console.warn('start_call: authenticatePSTN: DevicePermissionGranted', (new Date().getTime() - window.start) / 1000);
            // Listen for an incoming call to accept.
            teamsCallAgent.on('incomingCall', async (args) => {
                try {
                    incomingCall = args.incomingCall;
                } catch (error) {
                    throw new Error(error);
                    
                }
            // timestamp after getting device manager and listenter
            const afterDeviceManager = new Date().getTime();

            const secondTimeTaken = {
                routeName: "authenticatePSTN",
                getPSTNToken: afterTokenCredential - startAfterGetPstnToken,
                createTeamsCallAgent: afterCallAgent - afterTokenCredential,
                getDeviceManager: afterDeviceManager - afterCallAgent,
                totalTime: afterDeviceManager - startAfterGetAccessToken
            };
            console.warn('authenticatePSTN: TimeTaken:', secondTimeTaken);

            window.authenticatePstnTimeTaken = secondTimeTaken;

            });
        } else {
            throw new error('Failed to retrieve access token');
        }
    } catch (error) {
        LogError(signError(error, "authenticatePSTN"));
        return { error: error.message };
    }
}



fetchEndpoint = async () => {
    try {
        // get token from local storage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found in local storage');
        }
        const response = await fetch('/endpoint', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            //body: JSON.stringify({ token: token, cid: localStorage.getItem('cid'), did: localStorage.getItem('did') })
        });
        if (response.ok) {
            const data = await response.json();
            //console.warn('getPSTNToken TimeTaken:', data.timeTaken);
            window.endpoint = data;
        }
        return window.endpoint;
            
    } catch (error) {
        // avoid LogError to prevent recursive error logging
        console.error(error);
    }
}

const LogError = async (error) => {
    try {
        const endpoint = await fetchEndpoint();
        const token = localStorage.getItem('token');
        const response = token 
        ? await fetch(`${endpoint}/api/ApplicationLogs/Add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                "Message": error?.message,
                "Level": "Error",
                "Error": JSON.stringify(error),
              })
        }) 
        : null;

        // log to console
        console.error(error.message, error);

        // display generic error message to user
        document.querySelector('.nowConnecting').innerText = `An error occurred. Please hang up and try again. If the problem persists, contact support.`;
        
        // style changes
        document.querySelector('.nowConnecting').classList.remove('bounce');
        document.querySelector('.profile-pic').classList.add('hidden');
    } catch (error) {
        document.querySelector('.nowConnecting').innerText = `An error occurred. Please hang up and try again. If the problem persists, contact support.`;
        // style changes
        document.querySelector('.nowConnecting').classList.remove('bounce');
        document.querySelector('.profile-pic').classList.add('hidden');
        console.error(error);
    }
}

const signError = (error, methodName) =>{
    error.message = `${methodName} error: ${error.message}`;
    error.cid = localStorage.getItem('cid');
    error.did = localStorage.getItem('did'); 
    error.stacktrace = error.stack;
    return error;
}
const dispatchCustomEvent = (name, payload = {}) => {
    // Create a new custom event
    const customEvent = new CustomEvent(name, {
      detail: { ...payload } // Optional data to pass with the event
    });
  
    // Dispatch the custom event on a target element or the document
    document.dispatchEvent(customEvent);
  };

  // example:
  // document.dispatchEvent( new CustomEvent("start_call", { detail: {identity: "+14356321234", name: "Joe W"}}));
    // document.dispatchEvent( new CustomEvent("start_call", { detail: {identity: "435-632-1234", name: "Joe W"}}));
  // document.dispatchEvent( new CustomEvent("start_call", { detail: {identity: "joseph.wasden@yourdomain.com", name: "Joe W"}}));
   // dispatchCustomEvent('hang_up_call');


   // document.dispatchEvent( new CustomEvent("start_call", { detail: {identity: "karan@kolt.ca", name: "Karan Patel"}}));