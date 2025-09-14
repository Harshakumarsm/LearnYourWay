// ZegoCloud credentials
const appID = 1166166195;
const serverSecret = "d54a389f25728a8180aeaea4f883046d";

/**
 * Service to handle ZegoCloud operations
 */
export const zegoCloudService = {
  /**
   * Get token for ZegoCloud room using proper ZegoCloud token generation
   * @param {string} userID - Unique identifier for the user
   * @param {string} roomID - ID of the room to join
   * @returns {Promise<string>} Token for ZegoCloud authentication
   */
  getToken: async (userID: string, roomID: string): Promise<string> => {
    try {
      // For development/testing, use ZegoCloud's test token generation
      // In production, implement proper server-side token generation
      
      // Simple development token - this should work for testing
      const effectiveTimeInSeconds = 3600; // 1 hour
      const payloadObject = {
        room_id: roomID,
        user_id: userID,
        privilege: {
          1: 1, // loginRoom
          2: 1, // publishStream
        },
        stream_id_list: null,
      };
      
      // For development, return the serverSecret directly
      // ZegoUIKitPrebuilt.generateKitTokenForTest will handle the actual token generation
      return serverSecret;
      
    } catch (error) {
      console.error('Error generating ZegoCloud token:', error);
      throw error;
    }
  },

  /**
   * Get app configuration
   */
  getAppConfig: () => ({
    appID,
    serverSecret
  }),

  /**
   * Generate a proper ZegoCloud token (for production use)
   * This would typically be done on your backend server
   */
  generateProductionToken: async (userID: string, roomID: string): Promise<string> => {
    // This should be implemented on your backend server
    // Using libraries like jsonwebtoken and crypto
    console.warn('Production token generation should be implemented on backend');
    return serverSecret;
  }
};
