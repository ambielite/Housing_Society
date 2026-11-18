import 'dart:io';

Future<void> deleteTemporarySelfie(String path) async {
  final file = File(path);
  if (await file.exists()) await file.delete();
}
