// ZegoCloud credentials
const appID = 1166166195;
const serverSecret = "d54a389f25728a8180aeaea4f883046d";

/**
 * Service to handle ZegoCloud operations
 */
export const zegoCloudService = {
  /**
   * Get token for ZegoCloud room
   * @param {string} userID - Unique identifier for the user
   * @param {string} roomID - ID of the room to join
   * @returns {Promise<string>} Token for ZegoCloud authentication
   */
  getToken: async (userID: string, roomID: string): Promise<string> => {
    try {
      // For development, we'll use a simple token generation
      // In production, this should call your backend API
      const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration
      
      // Simple token payload for development
      const payload = {
        app_id: appID,
        user_id: userID,
        room_id: roomID,
        timestamp: timestamp,
        nonce: Math.floor(Math.random() * 1000000)
      };
      
      // Encode as base64 for development (not secure for production)
      return btoa(JSON.stringify(payload));
    } catch (error) {
      console.error('Error generating ZegoCloud token:', error);
      throw error;
    }
  },

  /**
   * Generate a simple token for testing
   * @param {string} userID - User identifier
   * @param {string} roomID - Room identifier
   * @returns {string} Simple token
   */
  generateSimpleToken: (userID: string, roomID: string): string => {
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      app_id: appID,
      user_id: userID,
      room_id: roomID,
      timestamp: timestamp,
      nonce: Math.floor(Math.random() * 1000000)
    };
    
    return btoa(JSON.stringify(payload));
  }
};
