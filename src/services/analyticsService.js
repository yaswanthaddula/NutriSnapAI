import api from './api';
import { Platform } from 'react-native';

export const analyticsService = {
  logActivity: async (actionType, description) => {
    try {
      const platform = Platform.OS === 'web' ? 'web' : 'app';
      
      // We don't await this so it doesn't block the UI
      api.post('/analytics/log', {
        action_type: actionType,
        description: description,
        platform: platform
      }).catch(e => {
        // Silently fail, it's just analytics
        console.log("Analytics error:", e.message);
      });
    } catch (e) {
      console.log("Analytics setup error:", e.message);
    }
  }
};

export default analyticsService;
