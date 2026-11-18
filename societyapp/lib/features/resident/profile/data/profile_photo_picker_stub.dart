import 'dart:ui' as ui;

import 'package:image_picker/image_picker.dart';

import 'picked_profile_photo.dart';

Future<PickedProfilePhoto?> pickProfilePhoto({required bool useCamera}) async {
  final image = await ImagePicker().pickImage(
    source: useCamera ? ImageSource.camera : ImageSource.gallery,
    imageQuality: 85,
    maxWidth: 1200,
    requestFullMetadata: false,
  );
  if (image == null) return null;
  final bytes = await image.readAsBytes();
  final extension = image.name.split('.').last.toLowerCase();
  if (const {'jpg', 'jpeg', 'png', 'webp'}.contains(extension)) {
    return PickedProfilePhoto(bytes: bytes, name: image.name);
  }

  // Convert formats that the platform picker can return but the server does
  // not store directly (for example HEIC, GIF, or BMP) to a supported PNG.
  final codec = await ui.instantiateImageCodec(bytes);
  try {
    final frame = await codec.getNextFrame();
    try {
      final png = await frame.image.toByteData(format: ui.ImageByteFormat.png);
      if (png == null) {
        throw StateError('This image format could not be converted.');
      }
      return PickedProfilePhoto(
        bytes: png.buffer.asUint8List(),
        name: 'profile.png',
      );
    } finally {
      frame.image.dispose();
    }
  } finally {
    codec.dispose();
  }
}
