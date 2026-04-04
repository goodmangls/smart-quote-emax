/**
 * Type declarations for the Google Maps 3D (alpha) API.
 *
 * The official @types/google.maps do not yet cover `maps3d`, so we provide
 * surface area for our RouteMap3D component.
 */

declare namespace google.maps.maps3d {
  interface Map3DElementOptions {
    center?: { lat: number; lng: number; altitude: number };
    range?: number;
    tilt?: number;
    heading?: number;
    mode?: 'SATELLITE' | 'HYBRID';
    defaultUIHidden?: boolean;
    defaultLabelsDisabled?: boolean;
  }

  interface FlyCameraToOptions {
    endCamera: {
      center: { lat: number; lng: number; altitude: number };
      range?: number;
      tilt?: number;
      heading?: number;
    };
    durationMillis?: number;
  }

  interface FlyCameraAroundOptions {
    camera: {
      center: { lat: number; lng: number; altitude: number };
      range?: number;
      tilt?: number;
      heading?: number;
    };
    durationMillis?: number;
    rounds?: number;
  }

  class Map3DElement extends HTMLElement {
    constructor(options?: Map3DElementOptions);
    center: { lat: number; lng: number; altitude: number };
    range: number;
    tilt: number;
    heading: number;
    mode: string;
    defaultUIHidden: boolean;
    defaultLabelsDisabled: boolean;
    flyCameraTo(options: FlyCameraToOptions): void;
    flyCameraAround(options: FlyCameraAroundOptions): void;
    stopCameraAnimation(): void;
  }

  interface Marker3DElementOptions {
    position?: { lat: number; lng: number; altitude?: number };
    label?: string;
    altitudeMode?: string;
    extruded?: boolean;
    collisionBehavior?: string;
  }

  class Marker3DElement extends HTMLElement {
    constructor(options?: Marker3DElementOptions);
    position: { lat: number; lng: number; altitude?: number };
    label?: string;
    altitudeMode?: string;
    extruded?: boolean;
    collisionBehavior?: string;
  }

  interface Polyline3DElementOptions {
    altitudeMode?: string;
    strokeColor?: string;
    strokeWidth?: number;
    drawsOccludedSegments?: boolean;
  }

  class Polyline3DElement extends HTMLElement {
    constructor(options?: Polyline3DElementOptions);
    altitudeMode?: string;
    strokeColor?: string;
    strokeWidth?: number;
    drawsOccludedSegments?: boolean;
    /** Array of coordinate points defining the polyline path */
    path: { lat: number; lng: number; altitude?: number }[];
  }

  class Polyline3DInteractiveElement extends Polyline3DElement {}

  class AltitudeMode {
    static readonly ABSOLUTE: string;
    static readonly CLAMP_TO_GROUND: string;
    static readonly RELATIVE_TO_GROUND: string;
    static readonly RELATIVE_TO_MESH: string;
  }
}

declare namespace google.maps {
  function importLibrary(library: string): Promise<unknown>;
}
