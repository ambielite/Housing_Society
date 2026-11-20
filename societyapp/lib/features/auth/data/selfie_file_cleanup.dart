import 'selfie_file_cleanup_stub.dart'
    if (dart.library.io) 'selfie_file_cleanup_io.dart' as implementation;

Future<void> deleteTemporarySelfie(String path) =>
    implementation.deleteTemporarySelfie(path);
