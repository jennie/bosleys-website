import { defineEventHandler, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import tractiveWrapper from '../utils/tractiveWrapper'

// Simple cache implementation
const cache = {
  data: null as any,
  timestamp: 0,
  expiryTime: 10 * 60 * 1000, // 10 minutes in milliseconds

  // Get data from cache if fresh, or return null if expired
  getData() {
    if (Date.now() - this.timestamp < this.expiryTime) {
      return this.data;
    }
    return null;
  },

  // Store data in cache with current timestamp
  setData(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  }
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Check cache first to avoid rate limits
  const cachedData = cache.getData();
  if (cachedData) {
    console.log('Using cached Tractive data (expires in',
      Math.round((cache.expiryTime - (Date.now() - cache.timestamp)) / 1000 / 60),
      'minutes)');
    return cachedData;
  }

  try {
    // Connect to Tractive with provided credentials
    console.log('Connecting to Tractive API...');
    const authenticated = await tractiveWrapper.connect(config.tractiveEmail, config.tractivePassword);

    if (!authenticated || !tractiveWrapper.isAuthenticated()) {
      throw createError({
        statusCode: 401,
        message: 'Failed to authenticate with Tractive'
      });
    }

    // Try to get all pets on the account (minimal API calls)
    console.log('Getting pets...');
    const pets = await tractiveWrapper.getPets();

    let hasPets = pets && Array.isArray(pets) && pets.length > 0;

    // If we found actual pets, use them
    if (hasPets) {
      console.log('Found pets:', pets.length);
      const pet = pets[0];
      const petId = pet._id;

      // Get detailed pet information
      console.log('Getting pet details for', petId);
      const petDetails = await tractiveWrapper.getPet(petId);

      // Use device_id instead of tracker_id
      const trackerId = petDetails?.device_id;
      console.log('Found tracker ID:', trackerId);

      if (trackerId) {
        // Process data with the tracker ID
        const result = await processTrackerData(petDetails, trackerId);

        // Cache the successful result
        cache.setData(result);
        return result;
      }
    }

    // As a fallback, try getting trackers directly
    console.log('No pets with trackers found, trying to get trackers directly...');
    const trackers = await tractiveWrapper.getAllTrackers();
    const hasTrackers = trackers && Array.isArray(trackers) && trackers.length > 0;

    if (hasTrackers) {
      console.log('Found trackers:', trackers.length);
      const trackerId = trackers[0]._id;

      // Process data with the tracker ID
      const result = await processTrackerData(null, trackerId);

      // Cache the successful result
      cache.setData(result);
      return result;
    }

    // If we reach here, there were no pets or trackers found
    console.log('No pets or trackers found, using simulated data');
    const simulatedData = generateSimulatedData('No pets or trackers found in the Tractive account');
    return simulatedData;

  } catch (error: any) {
    console.error('Tractive API error:', error?.message || error);

    // Special handling for rate limit errors
    if (error?.code === 4006 || (error?.message && error.message.includes('Rate limit'))) {
      console.log('Rate limit exceeded, using cached data if available or simulated data');

      // Try to use previously cached data even if technically expired
      if (cache.data) {
        console.log('Using previously cached data despite expiration');
        return {
          ...cache.data,
          apiStatus: {
            ...cache.data.apiStatus,
            message: 'Using cached data (rate limit exceeded)'
          }
        };
      }
    }

    // Return fallback simulated data
    return generateSimulatedData(error instanceof Error ? error.message : 'Unknown error');
  }
});

// Helper function to process tracker data and return formatted response
async function processTrackerData(petDetails: any, trackerId: string) {
  try {
    // Get tracker information
    console.log('Getting tracker info...');
    const tracker = await tractiveWrapper.getTracker(trackerId);

    // Get current hardware status for battery level
    console.log('Getting hardware info...');
    const hardwareInfo = await tractiveWrapper.getTrackerHardware(trackerId);

    // Get current location data
    console.log('Getting location info...');
    const locationInfo = await tractiveWrapper.getTrackerLocation(trackerId);

    // Only get history if we haven't hit rate limits so far
    let walkingDistance = 0;
    let historyPositionsCount = 0;
    let activityMinutes = 0;
    let restMinutes = 0;
    let sleepMinutes = 0;
    let spotsVisitedToday = 0;
    let currentStatus = 'unknown'; // Default status

    if (!locationInfo?.code) {
      try {
        // Calculate today's start and end timestamps
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Get history data for today to calculate distance walked
        console.log('Getting tracker history...');
        console.log('Time range:', new Date(startOfDay).toISOString(), 'to', new Date(endOfDay).toISOString());

        const historyData = await tractiveWrapper.getTrackerHistory(
          trackerId,
          Math.floor(startOfDay.getTime() / 1000),
          Math.floor(endOfDay.getTime() / 1000)
        );

        // Try to get activity data
        console.log('Getting activity data...');
        const activityData = await tractiveWrapper.getTrackerActivity(
          trackerId,
          Math.floor(startOfDay.getTime() / 1000),
          Math.floor(endOfDay.getTime() / 1000)
        );

        // Also try to get current status directly
        console.log('Getting current live status...');
        const liveStatus = await tractiveWrapper.getLiveTrackerStatus(trackerId);

        // Log status data for debugging
        console.log('Live status response:', JSON.stringify(liveStatus || {}, null, 2).substring(0, 500) + '...');

        // Check if we got live status info
        if (liveStatus) {
          if (liveStatus.status) {
            currentStatus = liveStatus.status;
            console.log('Using live status:', currentStatus);
          } else if (liveStatus.state) {
            currentStatus = liveStatus.state;
            console.log('Using live state:', currentStatus);
          } else if (liveStatus.motion_state) {
            currentStatus = liveStatus.motion_state === 'moving' ? 'active' : 'rest';
            console.log('Using motion state:', currentStatus);
          } else {
            // Try to find any field that might indicate status
            Object.entries(liveStatus).forEach(([key, value]) => {
              if (typeof value === 'string' && (
                key.includes('status') ||
                key.includes('state') ||
                key.includes('mode') ||
                key.includes('activity')
              )) {
                console.log(`Found possible status field: ${key}=${value}`);
                if (!currentStatus || currentStatus === 'unknown') {
                  currentStatus = value;
                }
              }
            });
          }
        }

        // Log activity data for debugging
        console.log('Activity data response:', JSON.stringify(activityData || {}, null, 2).substring(0, 500) + '...');

        // Process activity data if available
        if (activityData) {
          console.log('Processing activity data');

          // Try to handle different response formats
          if (Array.isArray(activityData.activities)) {
            // Format 1: activities array with type and start/end times
            console.log('Using activities array format');
            activityData.activities.forEach((activity: any) => {
              if (activity.type === 'active') {
                activityMinutes += Math.round((activity.end_time - activity.start_time) / 60);
              } else if (activity.type === 'rest') {
                restMinutes += Math.round((activity.end_time - activity.start_time) / 60);
              } else if (activity.type === 'sleep') {
                sleepMinutes += Math.round((activity.end_time - activity.start_time) / 60);
              }
            });

            // Determine current status based on most recent activity
            if (activityData.activities.length > 0) {
              // Sort by end_time to get most recent activity
              const sortedActivities = [...activityData.activities].sort((a, b) => b.end_time - a.end_time);
              const mostRecent = sortedActivities[0];
              currentStatus = mostRecent.type || 'unknown';
            }
          } else if (activityData.summary) {
            // Format 2: summary with minute totals
            console.log('Using summary format');
            activityMinutes = activityData.summary.active_minutes || activityData.summary.activity_minutes || 0;
            restMinutes = activityData.summary.rest_minutes || 0;
            sleepMinutes = activityData.summary.sleep_minutes || 0;

            // Try to determine status from summary
            const totalMins = activityMinutes + restMinutes + sleepMinutes;
            if (totalMins > 0) {
              if (activityMinutes > restMinutes && activityMinutes > sleepMinutes) {
                currentStatus = 'active';
              } else if (restMinutes > activityMinutes && restMinutes > sleepMinutes) {
                currentStatus = 'rest';
              } else {
                currentStatus = 'sleep';
              }
            }
          } else if (activityData.activity) {
            // Format 3: activity object
            console.log('Using activity object format');
            const activity = activityData.activity;

            if (typeof activity === 'object') {
              activityMinutes = activity.active_minutes || activity.activity_minutes || 0;
              restMinutes = activity.rest_minutes || 0;
              sleepMinutes = activity.sleep_minutes || 0;
              currentStatus = activity.current_status || activity.status || 'unknown';
            } else if (typeof activity === 'string') {
              // Simple activity string
              currentStatus = activity;
            }
          } else if (activityData.wellness) {
            // Format 4: wellness data
            console.log('Using wellness format');
            const wellness = activityData.wellness;

            if (typeof wellness === 'object') {
              activityMinutes = wellness.activity_duration || wellness.active_minutes || 0;
              sleepMinutes = wellness.sleep_duration || wellness.sleep_minutes || 0;
              restMinutes = wellness.rest_duration || wellness.rest_minutes || 0;
              currentStatus = wellness.current_status || wellness.status || 'unknown';
            }
          } else if (activityData.status) {
            // Format 5: just status
            console.log('Using status format');
            currentStatus = activityData.status;
          } else {
            // Try to extract any useful information from the response
            console.log('Using generic activity data extraction');

            // Search for any fields that might contain activity info
            const keys = Object.keys(activityData);
            for (const key of keys) {
              const value = activityData[key];

              if (typeof value === 'number') {
                if (key.includes('active') || key.includes('activity')) {
                  activityMinutes = value;
                } else if (key.includes('sleep')) {
                  sleepMinutes = value;
                } else if (key.includes('rest')) {
                  restMinutes = value;
                }
              } else if (typeof value === 'string') {
                if (key.includes('status') || key.includes('state')) {
                  currentStatus = value;
                }
              }
            }
          }
        }

        // If no activity data was found, try to determine activity from position data
        if (activityMinutes === 0 && restMinutes === 0 && sleepMinutes === 0) {
          console.log('No activity data found, estimating from position data');

          if (historyData && historyData.positions && historyData.positions.length > 0) {
            // Count positions within last hour to estimate current activity
            const now = Math.floor(Date.now() / 1000);
            const oneHourAgo = now - 3600;

            const recentPositions = historyData.positions.filter((pos: any) =>
              pos.time && pos.time >= oneHourAgo && pos.time <= now
            );

            console.log(`Found ${recentPositions.length} positions in the last hour`);

            if (recentPositions.length > 0) {
              // Calculate distances between consecutive points to determine activity level
              let totalDistance = 0;
              for (let i = 1; i < recentPositions.length; i++) {
                const prev = recentPositions[i - 1];
                const curr = recentPositions[i];
                if (prev.latlong && curr.latlong) {
                  totalDistance += calculateDistance(
                    prev.latlong[0], prev.latlong[1],
                    curr.latlong[0], curr.latlong[1]
                  );
                }
              }

              // Estimate activity based on distance covered in the last hour
              if (totalDistance > 0.5) { // More than 500m in an hour - active
                currentStatus = 'active';
                activityMinutes = Math.min(60, Math.round(totalDistance * 10)); // Rough estimate
              } else if (totalDistance > 0.05) { // Some movement but not much - resting
                currentStatus = 'rest';
                restMinutes = 60 - Math.round(totalDistance * 10);
                activityMinutes = Math.round(totalDistance * 10);
              } else { // Very little movement - sleeping
                currentStatus = 'sleep';
                sleepMinutes = 60;
              }
            }
          }
        }

        historyPositionsCount = historyData?.positions?.length || 0;
        console.log('History data received:', JSON.stringify(historyData || {}, null, 2).substring(0, 500) + '...');
        console.log('History data positions count:', historyPositionsCount);

        // Log more details about history data to find activity information
        console.log('History data keys:', Object.keys(historyData || {}));
        
        // Calculate spots visited today
        if (historyData && Object.keys(historyData).length > 0) {
          // Directly use the count of keys in the history data
          spotsVisitedToday = Object.keys(historyData).length;
          console.log('Spots visited today (based on history data keys count):', spotsVisitedToday);
        }
        
        if (historyData && historyData.positions && historyData.positions.length > 0) {
          // Process history data to calculate distance
          for (let i = 1; i < historyData.positions.length; i++) {
            const prev = historyData.positions[i - 1];
            const curr = historyData.positions[i];
            if (prev.latlong && curr.latlong) {
              walkingDistance += calculateDistance(
                prev.latlong[0], prev.latlong[1],
                curr.latlong[0], curr.latlong[1]
              );
            }
          }
        }
      } catch (historyError) {
        console.warn('Error getting history data:', historyError);
        // Continue without history data
      }
    }

    // For sleep hours, use real data or estimate
    const sleepHours = sleepMinutes > 0 ? Math.round(sleepMinutes / 60 * 10) / 10 : 8; // Round to one decimal place

    // Return the formatted data
    return {
      pet: petDetails ? {
        id: petDetails._id || 'unknown',
        name: petDetails.details?.name || 'Bosley',
        breed: petDetails.details?.breed || 'Dog',
        pictureUrl: petDetails.details?.profile_picture_link || null,
        coverPictureUrl: petDetails.details?.cover_picture_link || null
      } : {
        id: 'unknown',
        name: 'Bosley',
        breed: 'Dog',
        pictureUrl: null,
        coverPictureUrl: null
      },
      tracker: {
        id: trackerId,
        model: tracker?.model_number || 'Tractive GPS',
        batteryLevel: hardwareInfo?.battery_level || hardwareInfo?.battery?.level || 80,
        batteryState: hardwareInfo?.battery?.state || 'normal',
        lastUpdate: locationInfo?.time ? new Date(locationInfo.time * 1000).toISOString() : new Date().toISOString()
      },
      dailyStats: {
        spotsVisitedToday: spotsVisitedToday,
        currentLocation: locationInfo?.address || null,
        coordinates: locationInfo?.latlong || null
      },
      apiStatus: {
        authenticated: true,
        hasRealData: true,
        historyPoints: historyPositionsCount,
        message: 'Using real data from Tractive API',
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing tracker data:', error);
    throw error; // Propagate error for main handler to deal with
  }
}

// Helper function to generate realistic simulated data
function generateSimulatedData(errorMessage: string) {
  // Get the current date for last update
  const now = new Date();
  const timeString = now.toISOString();

  // Randomize battery level between 50-95% for realism
  const batteryLevel = Math.floor(Math.random() * 46) + 50;

  // Get current hour (0-23)
  const hour = now.getHours();

  // Create more realistic simulated data based on time of day

  // Activity status based on time of day (probabilistic model of a dog's day)
  let currentStatus = 'rest'; // Default to resting

  // Time-dependent probability distributions
  let sleepProb = 0;
  let activeProb = 0;
  let restProb = 0;

  // Early morning (midnight to 6am): Mostly sleeping
  if (hour >= 0 && hour < 6) {
    sleepProb = 0.85;
    activeProb = 0.05;
    restProb = 0.10;
  }
  // Morning walk (6am to 9am): Mix of active and rest, little sleep
  else if (hour >= 6 && hour < 9) {
    sleepProb = 0.10;
    activeProb = 0.60;
    restProb = 0.30;
  }
  // Morning to noon (9am to 12pm): Mostly resting, some sleep, little activity
  else if (hour >= 9 && hour < 12) {
    sleepProb = 0.30;
    activeProb = 0.15;
    restProb = 0.55;
  }
  // Afternoon (12pm to 3pm): Mostly sleeping/resting
  else if (hour >= 12 && hour < 15) {
    sleepProb = 0.60;
    activeProb = 0.05;
    restProb = 0.35;
  }
  // Late afternoon/evening walk (3pm to 7pm): More active again
  else if (hour >= 15 && hour < 19) {
    sleepProb = 0.05;
    activeProb = 0.65;
    restProb = 0.30;
  }
  // Evening (7pm to 10pm): Mostly resting, some activity
  else if (hour >= 19 && hour < 22) {
    sleepProb = 0.15;
    activeProb = 0.20;
    restProb = 0.65;
  }
  // Night (10pm to midnight): Transitioning to sleep
  else {
    sleepProb = 0.70;
    activeProb = 0.05;
    restProb = 0.25;
  }

  // Determine status probabilistically
  const rand = Math.random();
  if (rand < sleepProb) {
    currentStatus = 'sleep';
  } else if (rand < sleepProb + activeProb) {
    currentStatus = 'active';
  } else {
    currentStatus = 'rest';
  }

  // Calculate realistic minutes based on time of day and current status

  // Calculate total minutes in the day so far
  const minutesSoFar = hour * 60 + now.getMinutes();
  const totalMinutes = 24 * 60;

  // Allocate minutes based on typical distribution and time of day
  // These add up to less than 24 hours because we don't allocate future time
  const dayFraction = minutesSoFar / totalMinutes;

  // Typical daily minutes for a dog: 
  // - 12-14 hours sleep (720-840 minutes)
  // - 2-3 hours active (120-180 minutes)
  // - 7-10 hours rest (420-600 minutes)

  // Calculate estimated total minutes based on time of day
  const estimatedSleepTotal = Math.round(dayFraction * (720 + Math.random() * 120));
  const estimatedActiveTotal = Math.round(dayFraction * (120 + Math.random() * 60));
  const estimatedRestTotal = Math.round(dayFraction * (420 + Math.random() * 180));

  // Add variability based on current status
  let sleepMinutes = estimatedSleepTotal;
  let activityMinutes = estimatedActiveTotal;
  let restMinutes = estimatedRestTotal;

  // Boost the current status minutes slightly to reflect current state
  if (currentStatus === 'sleep') {
    sleepMinutes = Math.round(sleepMinutes * 1.1);
  } else if (currentStatus === 'active') {
    activityMinutes = Math.round(activityMinutes * 1.1);
  } else if (currentStatus === 'rest') {
    restMinutes = Math.round(restMinutes * 1.1);
  }

  // Calculate walking distance based on activity minutes (typical dog walks about 2-5km per hour of activity)
  // Assuming 'active' time is about 25% walking
  const walkingDistance = Math.round((activityMinutes * 0.25 * (2 + Math.random() * 3) / 60) * 10) / 10;

  // Convert sleep minutes to hours for the UI
  const sleepHours = Math.round(sleepMinutes / 60 * 10) / 10;

  return {
    pet: {
      id: 'bosley-simulated-id',
      name: 'Bosley',
      breed: 'Dog',
      pictureUrl: null,
      coverPictureUrl: null
    },
    tracker: {
      id: 'tracker-simulated-id',
      model: 'Tractive GPS',
      batteryLevel: batteryLevel,
      batteryState: batteryLevel < 70 ? 'discharging' : 'normal',
      lastUpdate: timeString
    },
    dailyStats: {
      spotsVisitedToday: Math.floor(Math.random() * 5) + 1, // Random number between 1 and 5
      currentLocation: {
        street: 'Home',
        city: 'Your Location',
        country: 'CA'
      },
      coordinates: [43.653, -79.383],
    },
    apiStatus: {
      authenticated: true,
      hasRealData: false,
      message: `Using simulated data: ${errorMessage}`,
      lastUpdated: new Date().toISOString()
    }
  };
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
} 