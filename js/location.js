class LocationService {
  static getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Unable to retrieve location.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user.";
              break;

            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;

            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
          }

          reject(message);
        },
        {
enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 300000,
        }
      );
    });
  }
}

window.LocationService = LocationService;
