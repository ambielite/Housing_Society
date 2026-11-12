{{flutter_js}}
{{flutter_build_config}}

// Use CanvasKit's CPU path to avoid WebGL shader compilation failures on
// browsers or devices with incompatible graphics drivers.
_flutter.loader.load({
  config: {
    renderer: 'canvaskit',
    canvasKitForceCpuOnly: true,
  },
});
