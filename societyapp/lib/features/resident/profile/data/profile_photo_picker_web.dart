import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;
import 'dart:typed_data';

import 'picked_profile_photo.dart';

Future<PickedProfilePhoto?> pickProfilePhoto({required bool useCamera}) async {
  if (useCamera) return _captureFromCamera();

  final input = html.FileUploadInputElement()
    // Let the browser expose every image format available on the device. The
    // selected image is decoded and normalized to JPEG below before upload.
    ..accept = 'image/*'
    ..multiple = false;

  // Trigger the browser picker while still inside the user's tap gesture.
  input.click();
  await input.onChange.first;
  final files = input.files;
  final file = files == null || files.isEmpty ? null : files.first;
  if (file == null) return null;

  final objectUrl = html.Url.createObjectUrl(file);
  final image = html.ImageElement(src: objectUrl);
  try {
    await Future.any<void>([
      image.onLoad.first,
      image.onError.first.then<void>((_) {
        throw StateError(
          'This browser cannot open this image format. Choose another photo or convert it to JPG or PNG.',
        );
      }),
    ]);
    final sourceWidth = image.naturalWidth;
    final sourceHeight = image.naturalHeight;
    if (sourceWidth == 0 || sourceHeight == 0) {
      throw StateError('The selected file is not a readable image.');
    }

    // Canvas re-encoding handles formats the browser can decode (including
    // formats the API does not store) and always sends a valid JPEG payload.
    const maxDimension = 1600;
    final scale = (sourceWidth > maxDimension || sourceHeight > maxDimension)
        ? maxDimension / (sourceWidth > sourceHeight ? sourceWidth : sourceHeight)
        : 1.0;
    final canvas = html.CanvasElement(
      width: (sourceWidth * scale).round(),
      height: (sourceHeight * scale).round(),
    );
    canvas.context2D.drawImageScaled(
      image,
      0,
      0,
      canvas.width!,
      canvas.height!,
    );
    final dataUrl = canvas.toDataUrl('image/jpeg', .88);
    final encodedImage = dataUrl.split(',');
    if (encodedImage.length != 2) {
      throw StateError('The browser could not convert the selected image.');
    }
    return PickedProfilePhoto(
      bytes: base64Decode(encodedImage.last),
      name: 'profile.jpg',
    );
  } finally {
    html.Url.revokeObjectUrl(objectUrl);
  }
}

Future<PickedProfilePhoto?> _captureFromCamera() async {
  final mediaDevices = html.window.navigator.mediaDevices;
  if (mediaDevices == null) {
    throw StateError('This browser does not provide camera access.');
  }
  final stream = await mediaDevices.getUserMedia({
    'audio': false,
    'video': {'facingMode': 'user'},
  });
  final overlay = html.DivElement()
    ..style.cssText =
        'position:fixed;inset:0;z-index:2147483647;background:#071426;'
        'display:flex;flex-direction:column;align-items:center;'
        'justify-content:center;padding:20px;box-sizing:border-box;'
        'font-family:Arial,sans-serif;color:white;';
  final video = html.VideoElement()
    ..autoplay = true
    ..muted = true
    ..setAttribute('playsinline', 'true')
    ..srcObject = stream
    ..style.cssText =
        'width:min(100%,560px);max-height:72vh;object-fit:cover;'
        'border-radius:20px;background:#000;';
  final controls = html.DivElement()
    ..style.cssText =
        'display:flex;gap:16px;align-items:center;justify-content:center;'
        'padding:22px;';
  final captureButton = html.ButtonElement()
    ..text = 'Take photo'
    ..style.cssText =
        'border:0;border-radius:24px;padding:14px 28px;background:#ffd000;'
        'color:#152b46;font-size:16px;font-weight:700;cursor:pointer;';
  final cancelButton = html.ButtonElement()
    ..text = 'Cancel'
    ..style.cssText =
        'border:1px solid #fff;border-radius:24px;padding:13px 24px;'
        'background:transparent;color:#fff;font-size:16px;cursor:pointer;';
  controls.children.addAll([cancelButton, captureButton]);
  overlay.children.addAll([video, controls]);
  html.document.body?.append(overlay);

  final result = Completer<PickedProfilePhoto?>();
  cancelButton.onClick.listen((_) {
    if (!result.isCompleted) result.complete(null);
  });
  captureButton.onClick.listen((_) async {
    try {
      final canvas = html.CanvasElement(
        width: video.videoWidth,
        height: video.videoHeight,
      );
      canvas.context2D.drawImage(video, 0, 0);
      final dataUrl = canvas.toDataUrl('image/jpeg', .9);
      final encodedImage = dataUrl.split(',');
      if (encodedImage.length != 2) {
        throw StateError('The browser could not read the captured photo.');
      }
      final bytes = base64Decode(encodedImage.last);
      if (!result.isCompleted) {
        result.complete(
          PickedProfilePhoto(bytes: bytes, name: 'profile.jpg'),
        );
      }
    } catch (error) {
      if (!result.isCompleted) result.completeError(error);
    }
  });

  try {
    await video.onLoadedMetadata.first;
    await video.play();
    return await result.future;
  } finally {
    for (final track in stream.getTracks()) {
      track.stop();
    }
    overlay.remove();
  }
}
