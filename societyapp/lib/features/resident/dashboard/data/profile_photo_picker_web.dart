import 'dart:async';
import 'dart:convert';
import 'dart:html' as html;
import 'dart:typed_data';

import 'picked_profile_photo.dart';

Future<PickedProfilePhoto?> pickProfilePhoto({required bool useCamera}) async {
  if (useCamera) return _captureFromCamera();

  final input = html.FileUploadInputElement()
    ..accept = 'image/jpeg,image/png,image/webp'
    ..multiple = false;

  // Trigger the browser picker while still inside the user's tap gesture.
  input.click();
  await input.onChange.first;
  final files = input.files;
  final file = files == null || files.isEmpty ? null : files.first;
  if (file == null) return null;

  final reader = html.FileReader();
  final loaded = reader.onLoad.first.then<void>((_) {});
  final failed = reader.onError.first.then<void>((_) {
    throw StateError('The browser could not read the selected image.');
  });
  reader.readAsArrayBuffer(file);
  await Future.any<void>([loaded, failed]);
  final result = reader.result;
  if (result is! ByteBuffer) {
    throw StateError('The browser could not read the selected image.');
  }
  return PickedProfilePhoto(
    bytes: result.asUint8List(),
    name: file.name,
  );
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
