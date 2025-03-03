// Fixed wrapper for the tractive package
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

// Constants from the original package
const TractiveClient = "625e533dc3c3b41c28a669f0";

// Account details storage
const accountDetails = {
  email: "",
  password: "",
  token: null,
  uid: null
};

// Default request options
let gloOpts = {
  method: "GET",
  hostname: "graph.tractive.com",
  path: ``,
  headers: {
    "X-Tractive-Client": TractiveClient,
    "Authorization": `Bearer ${accountDetails.token}`,
    "content-type": "application/json"
  }
};

/**
 * Check if authenticated with Tractive
 */
function isAuthenticated() {
  if (accountDetails?.token) return true;
  return false;
}

/**
 * Authenticate with Tractive
 */
async function authenticate() {
  return new Promise(function(resolve, reject) {
    const options = {
      "method": "POST",
      "hostname": "graph.tractive.com",
      "path": `/4/auth/token?grant_type=tractive&platform_email=${encodeURIComponent(accountDetails.email)}&platform_token=${encodeURIComponent(accountDetails.password)}`,
      "headers": {
        'X-Tractive-Client': TractiveClient,
        'Content-Type': "application/json"
      }
    };
    
    const req = https.request(options, function (res) {
      let data = '';
      
      res.on('data', function(chunk) {
        data += chunk;
      });
      
      res.on('end', function() {
        try {
          const response = JSON.parse(data);
          accountDetails.token = response.access_token;
          accountDetails.uid = response.user_id;
          
          // Update global options with new token
          gloOpts = {
            method: "GET",
            hostname: "graph.tractive.com",
            path: ``,
            headers: {
              "X-Tractive-Client": TractiveClient,
              "Authorization": `Bearer ${accountDetails.token}`,
              "content-type": "application/json"
            }
          };
          
          resolve(true);
        } catch (e) {
          console.error('Authentication error:', e);
          resolve(false);
        }
      });
      
      res.on('error', function(err) {
        console.error('Authentication request error:', err);
        resolve(false);
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Connect to Tractive with email and password
 */
async function connect(email, password) {
  accountDetails.email = email;
  accountDetails.password = password;
  await authenticate();
  return isAuthenticated();
}

/**
 * Make a request to the Tractive API
 */
async function makeRequest(path, method = 'GET') {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated with Tractive');
  }
  
  return new Promise((resolve, reject) => {
    const options = { ...gloOpts, path, method };
    
    const req = https.request(options, (res) => {
      let rawData = '';
      
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (rawData) {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing response: ${e.message}`);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
}

/**
 * Get account information
 */
async function getAccountInfo() {
  return makeRequest(`/4/user/${accountDetails.uid}`);
}

/**
 * Get all pets associated with the account
 */
async function getPets() {
  return makeRequest(`/4/user/${accountDetails.uid}/trackable_objects`);
}

/**
 * Get a specific pet by ID
 */
async function getPet(petId) {
  const data = await makeRequest(`/4/trackable_object/${petId}`);
  
  // Add picture links if available
  if (data && data.details) {
    if (data.details.profile_picture_id) {
      data.details.profile_picture_link = `https://graph.tractive.com/4/media/resource/${data.details.profile_picture_id}.jpg`;
    }
    
    if (data.details.cover_picture_id) {
      data.details.cover_picture_link = `https://graph.tractive.com/4/media/resource/${data.details.cover_picture_id}.jpg`;
    }
  }
  
  return data;
}

/**
 * Get all trackers on the account
 * This is FIXED from the original which didn't return data
 */
async function getAllTrackers() {
  return makeRequest(`/4/user/${accountDetails.uid}/trackers`);
}

/**
 * Get a specific tracker by ID
 */
async function getTracker(trackerId) {
  return makeRequest(`/4/tracker/${trackerId}`);
}

/**
 * Get the latest position report for a tracker
 */
async function getTrackerLocation(trackerId) {
  const data = await makeRequest(`/4/device_pos_report/${trackerId}`);
  
  // Add address information if available
  if (data && data.latlong) {
    try {
      const addressData = await makeRequest(
        `/4/platform/geo/address/location?latitude=${encodeURIComponent(data.latlong[0])}&longitude=${encodeURIComponent(data.latlong[1])}`
      );
      
      data.address = addressData;
    } catch (e) {
      console.error('Error fetching address:', e);
    }
  }
  
  return data;
}

/**
 * Get tracker history between two times
 */
async function getTrackerHistory(trackerId, from, to) {
  const calcFrom = typeof from === "object" ? Math.floor(from.getTime() / 1000) : from;
  const calcTo = typeof to === "object" ? Math.floor(to.getTime() / 1000) : to;
  
  const path = `/4/tracker/${encodeURIComponent(trackerId)}/positions?time_from=${encodeURIComponent(calcFrom)}&time_to=${encodeURIComponent(calcTo)}&format=json_segments`;
  console.log(path);
  
  const data = await makeRequest(path);
  return data.length > 0 ? data[0] : { positions: [] };
}

/**
 * Get activity data for a tracker
 */
async function getTrackerActivity(trackerId, from, to) {
  const calcFrom = typeof from === "object" ? Math.floor(from.getTime() / 1000) : from;
  const calcTo = typeof to === "object" ? Math.floor(to.getTime() / 1000) : to;
  
  // Try multiple possible endpoints for activity data
  const possiblePaths = [
    `/4/tracker/${encodeURIComponent(trackerId)}/activity?time_from=${encodeURIComponent(calcFrom)}&time_to=${encodeURIComponent(calcTo)}`,
    `/4/device_activity_report/${encodeURIComponent(trackerId)}?time_from=${encodeURIComponent(calcFrom)}&time_to=${encodeURIComponent(calcTo)}`,
    `/4/tracker/${encodeURIComponent(trackerId)}/wellness?time_from=${encodeURIComponent(calcFrom)}&time_to=${encodeURIComponent(calcTo)}`,
    `/4/device_pos_report/${encodeURIComponent(trackerId)}/activity`,
    `/4/tracker/${encodeURIComponent(trackerId)}/wellness_report`
  ];
  
  let lastError = null;
  for (const path of possiblePaths) {
    console.log('Attempting to fetch activity data from:', path);
    try {
      const data = await makeRequest(path);
      if (data && (data.activities || data.summary || data.activity || data.wellness || data.status)) {
        console.log('Found activity data at endpoint:', path);
        return data;
      }
      console.log('Endpoint returned data but no activity info:', path);
    } catch (error) {
      console.error(`Error fetching activity data from ${path}:`, error.message);
      lastError = error;
    }
  }
  
  // As a fallback, check if we can find activity data in the position history
  console.log('Trying to extract activity from position history...');
  try {
    const path = `/4/tracker/${encodeURIComponent(trackerId)}/positions?time_from=${encodeURIComponent(calcFrom)}&time_to=${encodeURIComponent(calcTo)}&format=json_segments`;
    const data = await makeRequest(path);
    
    if (data && data.length > 0) {
      // Check if the position data contains activity information
      if (data[0].activity) {
        console.log('Found activity data in position history');
        return { activities: data[0].activity };
      }
      
      // Check if any position has activity metadata
      if (data[0].positions && data[0].positions.length > 0) {
        const hasActivityData = data[0].positions.some(pos => pos.activity || pos.status);
        if (hasActivityData) {
          console.log('Found activity metadata in positions');
          return {
            activities: data[0].positions.map(pos => ({
              type: pos.activity || pos.status || 'unknown',
              start_time: pos.time - 300, // Approximate 5 minutes before
              end_time: pos.time,
              latlong: pos.latlong
            }))
          };
        }
      }
    }
  } catch (posError) {
    console.error('Error extracting activity from positions:', posError.message);
  }
  
  // Try one more approach - directly query pet's daily summary
  if (accountDetails.uid) {
    try {
      console.log('Trying to get daily summary data...');
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const summaryPath = `/4/user/${accountDetails.uid}/pet_daily_summary/${trackerId}/${dateStr}`;
      const summaryData = await makeRequest(summaryPath);
      
      if (summaryData) {
        console.log('Found daily summary data');
        return { summary: summaryData };
      }
    } catch (summaryError) {
      console.error('Error fetching daily summary:', summaryError.message);
    }
  }
  
  console.log('No activity data found in any endpoint');
  return null;
}

/**
 * Get the latest hardware report for a tracker
 */
async function getTrackerHardware(trackerId) {
  return makeRequest(`/4/device_hw_report/${trackerId}`);
}

/**
 * Get the current live status of a tracker/pet
 * This is a best effort to find the current status (active/rest/sleep)
 */
async function getLiveTrackerStatus(trackerId) {
  // Try multiple approaches to get real-time status
  
  // First try the live status endpoint (if it exists)
  try {
    console.log('Attempting to get live status...');
    const liveData = await makeRequest(`/4/tracker/${trackerId}/live_tracking`);
    
    if (liveData && (liveData.status || liveData.state)) {
      console.log('Found live status data');
      return liveData;
    }
  } catch (liveError) {
    console.error('Error fetching live status:', liveError.message);
  }
  
  // Try to get the device state
  try {
    console.log('Attempting to get device state...');
    const stateData = await makeRequest(`/4/device_state/${trackerId}`);
    
    if (stateData) {
      console.log('Found device state data');
      return stateData;
    }
  } catch (stateError) {
    console.error('Error fetching device state:', stateError.message);
  }
  
  // Try the beacon status
  try {
    console.log('Attempting to get beacon status...');
    const beaconData = await makeRequest(`/4/device_pos_report/${trackerId}/beacon_status`);
    
    if (beaconData) {
      console.log('Found beacon status data');
      return beaconData;
    }
  } catch (beaconError) {
    console.error('Error fetching beacon status:', beaconError.message);
  }
  
  return null;
}

/**
 * Get shared accounts
 */
async function getAccountShares() {
  return makeRequest(`/4/user/${accountDetails.uid}/shares`);
}

/**
 * Debug function to check for trackers via direct API access
 * This makes direct requests to check what other endpoints might return
 */
async function checkForTrackers() {
  // First try direct API query for trackers
  const trackers = await getAllTrackers();
  
  // Then try to get user friends/shares
  const shares = await getAccountShares();
  
  // Try to get device list directly
  try {
    const devices = await makeRequest('/4/user/devices');
    console.log(devices, shares, trackers);
    return {
      trackers,
      shares,
      devices
    };
  } catch (e) {
    return {
      trackers,
      shares,
      error: e.message
    };
  }
}

export default {
  connect,
  isAuthenticated,
  getAccountInfo,
  getPets,
  getPet,
  getAllTrackers,
  getTracker,
  getTrackerLocation,
  getTrackerHistory,
  getTrackerActivity,
  getTrackerHardware,
  getLiveTrackerStatus,
  getAccountShares,
  checkForTrackers
}; 