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
  return PickedProfilePhoto(bytes: await image.readAsBytes(), name: image.name);
}
