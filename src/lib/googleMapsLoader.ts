/**
 * Google Maps 3D API loader (alpha version).
 * Loads the script and imports the maps3d library, returning constructors.
 */

export interface Maps3DLib {
  Map3DElement: typeof google.maps.maps3d.Map3DElement;
  Marker3DElement: typeof google.maps.maps3d.Marker3DElement;
  Polyline3DElement: typeof google.maps.maps3d.Polyline3DElement;
}

let loadPromise: Promise<Maps3DLib> | null = null;

export function loadGoogleMaps3D(): Promise<Maps3DLib> {
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  loadPromise = new Promise<Maps3DLib>((resolve, reject) => {
    // Load the script first
    const loadScript = (): Promise<void> => {
      if (typeof google !== 'undefined' && google.maps) {
        return Promise.resolve();
      }
      return new Promise((res, rej) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=maps3d,marker`;
        script.async = true;
        script.defer = true;
        script.onload = () => res();
        script.onerror = () => rej(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(() => google.maps.importLibrary('maps3d'))
      .then((lib) => {
        const maps3d = lib as unknown as Maps3DLib;
        resolve({
          Map3DElement: maps3d.Map3DElement,
          Marker3DElement: maps3d.Marker3DElement,
          Polyline3DElement: maps3d.Polyline3DElement,
        });
      })
      .catch((err) => {
        loadPromise = null;
        reject(err);
      });
  });

  return loadPromise;
}
