/** Thin wrappers over the Expo pickers that return normalised SelectedFile[]. */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import type { SelectedFile } from '../types';

function fromImageAsset(asset: ImagePicker.ImagePickerAsset): SelectedFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    isPdf: false,
  };
}

/** Capture a photo with the camera. Returns [] if cancelled or denied. */
export async function takePhoto(): Promise<SelectedFile[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Camera access needed',
      'Please allow camera access to take a photo of your document.',
    );
    return [];
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  return result.canceled ? [] : result.assets.map(fromImageAsset);
}

/** Pick one or more photos from the library. */
export async function pickPhotos(): Promise<SelectedFile[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Photo access needed',
      'Please allow photo access to choose a document image.',
    );
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });
  return result.canceled ? [] : result.assets.map(fromImageAsset);
}

/** Pick one or more PDF files. */
export async function pickPdf(): Promise<SelectedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.name ?? `document-${Date.now()}.pdf`,
    mimeType: asset.mimeType ?? 'application/pdf',
    isPdf: true,
  }));
}
