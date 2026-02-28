'use client';
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import GlobeGL from 'react-globe.gl';
import { useEventStore } from '@/store/eventStore';
import { getCategoryColor } from '@/types/event';
import type { WorldEvent } from '@/types/event';
// @ts-expect-error - three.js postprocessing modules lack proper type declarations
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
// @ts-expect-error - three.js postprocessing modules lack proper type declarations
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// @ts-expect-error - three.js postprocessing modules lack proper type declarations
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import * as THREE from 'three';

export default function GlobeScene() {
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const composerRef = useRef<any>(null);
  const frameIdRef = useRef<number>(0);

  const filteredEvents = useEventStore((s) => s.filteredEvents);
  const flyToTarget = useEventStore((s) => s.flyToTarget);
  const setSelectedEvent = useEventStore((s) => s.setSelectedEvent);
  const clearFlyTarget = useEventStore((s) => s.clearFlyTarget);

  // Track window dimensions
  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rings data: only high-severity events
  const ringsData = useMemo(
    () => filteredEvents.filter((e) => e.severity >= 4),
    [filteredEvents]
  );

  // Handle point click
  const handlePointClick = useCallback(
    (point: object) => {
      const event = point as WorldEvent;
      setSelectedEvent(event);
    },
    [setSelectedEvent]
  );

  // Fly to target when it changes
  useEffect(() => {
    if (flyToTarget && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: flyToTarget.lat, lng: flyToTarget.lng, altitude: flyToTarget.altitude },
        1000
      );
      clearFlyTarget();
    }
  }, [flyToTarget, clearFlyTarget]);

  // Set up bloom post-processing once after globe mounts
  useEffect(() => {
    if (!globeRef.current) return;

    // Small delay to let the globe initialize its renderer
    const timer = setTimeout(() => {
      try {
        const globe = globeRef.current;
        if (!globe) return;

        const renderer = globe.renderer();
        const scene = globe.scene();
        const camera = globe.camera();

        if (!renderer || !scene || !camera) return;

        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          1.5,  // strength
          0.4,  // radius
          0.1   // threshold
        );
        composer.addPass(bloomPass);

        composerRef.current = composer;

        // Override the animation loop
        const animate = () => {
          frameIdRef.current = requestAnimationFrame(animate);
          composer.render();
        };

        // Stop the default animation loop and start ours
        renderer.setAnimationLoop(null);
        animate();
      } catch {
        // Bloom setup failed - globe works fine without it
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      composerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update bloom composer size on resize
  useEffect(() => {
    if (composerRef.current && dimensions.width > 0 && dimensions.height > 0) {
      composerRef.current.setSize(dimensions.width, dimensions.height);
    }
  }, [dimensions.width, dimensions.height]);

  return (
    <div className="w-full h-full absolute inset-0">
      <GlobeGL
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#4a90d9"
        atmosphereAltitude={0.25}
        // Points layer - event markers
        pointsData={filteredEvents}
        pointLat={(d: object) => (d as WorldEvent).latitude}
        pointLng={(d: object) => (d as WorldEvent).longitude}
        pointColor={(d: object) => getCategoryColor((d as WorldEvent).category)}
        pointAltitude={(d: object) => 0.01 + (d as WorldEvent).severity * 0.005}
        pointRadius={(d: object) => 0.15 + (d as WorldEvent).severity * 0.08}
        pointLabel={(d: object) => (d as WorldEvent).title}
        onPointClick={handlePointClick}
        // Rings layer - pulse animations for high-severity events
        ringsData={ringsData}
        ringLat={(d: object) => (d as WorldEvent).latitude}
        ringLng={(d: object) => (d as WorldEvent).longitude}
        ringColor={(d: object) => {
          const color = getCategoryColor((d as WorldEvent).category);
          return (t: number) => `${color}${Math.round((1 - t) * 255).toString(16).padStart(2, '0')}`;
        }}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={2000}
      />
    </div>
  );
}
