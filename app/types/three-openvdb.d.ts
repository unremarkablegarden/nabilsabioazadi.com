// The parts of three-openvdb's WebGLRenderer entry that the clouds use (clouds.ts). The package
// ships no types.
declare module "three-openvdb/webgl" {
	import type * as THREE from "three";

	export interface FrameVolumeProps {
		dimensions?: [number, number, number];
		bbox?: THREE.Box3;
		// Optical depth of the box's longest side at the mean density.
		extinction?: number;
		densityScale?: number;
		normalizeDensity?: boolean;
		densityCutoff?: number;
		baseColor?: THREE.ColorRepresentation;
		scatterColor?: THREE.ColorRepresentation;
		absorbance?: number;
		opacity?: number;
		mipmaps?: boolean;
		phase?: string;
		phaseG?: number;
	}

	export class FrameVolume extends THREE.Group {
		constructor(source: Uint8Array | FrameVolume, props?: FrameVolumeProps);
		readonly isFrameVolume: true;
		// The fullscreen quad whose draw composites every volume of the frame; the first one drawn does the work.
		proxy: THREE.Mesh;
		extinction: number;
		densityScale: number;
		densityCutoff: number;
		absorbance: number;
		opacity: number;
		baseColor: THREE.Color;
		scatterColor: THREE.Color;
		createInstance(props?: FrameVolumeProps): FrameVolume;
		dispose(): void;
	}

	export interface FrameRendererSettings {
		width: number;
		height: number;
		pixelsPerFroxel: number;
		depth: number;
		subSteps: number;
		near: number;
		far: number;
		fadeRadius: number;
		jitter: boolean;
		temporal: boolean;
		temporalBlend: number;
		lighting: "frame" | "volume";
		shadowResolution: number;
		shadowCascades: number;
		shadowDistance: number;
		phase: string;
		phaseG: number;
		phaseBackG: number;
		phaseBackWeight: number;
		phaseGExponent: number;
		environmentLighting: "outward" | "directional" | "spherical-harmonics";
		environmentSamples: number;
		multipleScattering: boolean | "two-sided" | "octaves" | "neural";
		spectral: boolean;
		srgbBlending: boolean;
		castShadows: boolean;
	}

	export const frameRenderer: {
		settings: FrameRendererSettings;
		depthTarget: THREE.WebGLRenderTarget | null;
		renderDepth(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void;
		dispose?(): void;
	};
}
