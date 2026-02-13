package com.horu.flow;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "MusicScanner",
    permissions = {
        @Permission(
            alias = "audio",
            strings = {
                Manifest.permission.READ_MEDIA_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
        )
    }
)
public class MusicScannerPlugin extends Plugin {

    @PluginMethod
    public void scanMusic(PluginCall call) {
        try {
            JSArray tracks = new JSArray();
            JSArray albums = new JSArray();
            JSArray artists = new JSArray();

            ContentResolver resolver = getContext().getContentResolver();

            // === Scan Tracks ===
            Uri audioUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] trackProjection = {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.ARTIST_ID,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.TRACK,
                MediaStore.Audio.Media.YEAR
            };

            String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";
            String sortOrder = MediaStore.Audio.Media.TITLE + " ASC";

            Cursor cursor = resolver.query(audioUri, trackProjection, selection, null, sortOrder);

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject track = new JSObject();
                    long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID));
                    long albumId = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID));
                    long artistId = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST_ID));
                    long duration = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION));
                    String title = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE));
                    String artist = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST));
                    String album = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM));
                    String data = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA));

                    // Build content URI for the track
                    Uri contentUri = Uri.withAppendedPath(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));

                    // Build album art URI
                    Uri albumArtUri = Uri.parse("content://media/external/audio/albumart/" + albumId);

                    track.put("id", "t_" + id);
                    track.put("title", title != null ? title : "Unknown");
                    track.put("artist", artist != null && !artist.equals("<unknown>") ? artist : "Unknown Artist");
                    track.put("album", album != null && !album.equals("<unknown>") ? album : "Unknown Album");
                    track.put("albumId", "a_" + albumId);
                    track.put("artistId", "ar_" + artistId);
                    track.put("duration", duration / 1000); // Convert ms to seconds
                    track.put("src", data); // File path
                    track.put("contentUri", contentUri.toString());
                    track.put("cover", albumArtUri.toString());

                    tracks.put(track);
                }
                cursor.close();
            }

            // === Scan Albums ===
            Uri albumUri = MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI;
            String[] albumProjection = {
                MediaStore.Audio.Albums._ID,
                MediaStore.Audio.Albums.ALBUM,
                MediaStore.Audio.Albums.ARTIST,
                MediaStore.Audio.Albums.NUMBER_OF_SONGS,
                MediaStore.Audio.Albums.FIRST_YEAR
            };

            Cursor albumCursor = resolver.query(albumUri, albumProjection, null, null,
                MediaStore.Audio.Albums.ALBUM + " ASC");

            if (albumCursor != null) {
                while (albumCursor.moveToNext()) {
                    JSObject albumObj = new JSObject();
                    long aId = albumCursor.getLong(albumCursor.getColumnIndexOrThrow(MediaStore.Audio.Albums._ID));
                    String aTitle = albumCursor.getString(albumCursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.ALBUM));
                    String aArtist = albumCursor.getString(albumCursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.ARTIST));
                    int numSongs = albumCursor.getInt(albumCursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.NUMBER_OF_SONGS));

                    int year = 0;
                    try {
                        year = albumCursor.getInt(albumCursor.getColumnIndexOrThrow(MediaStore.Audio.Albums.FIRST_YEAR));
                    } catch (Exception ignored) {}

                    Uri albumArtUri = Uri.parse("content://media/external/audio/albumart/" + aId);

                    albumObj.put("id", "a_" + aId);
                    albumObj.put("title", aTitle != null ? aTitle : "Unknown Album");
                    albumObj.put("artist", aArtist != null ? aArtist : "Unknown Artist");
                    albumObj.put("cover", albumArtUri.toString());
                    albumObj.put("year", year);
                    albumObj.put("numSongs", numSongs);

                    albums.put(albumObj);
                }
                albumCursor.close();
            }

            // === Scan Artists ===
            Uri artistUri = MediaStore.Audio.Artists.EXTERNAL_CONTENT_URI;
            String[] artistProjection = {
                MediaStore.Audio.Artists._ID,
                MediaStore.Audio.Artists.ARTIST,
                MediaStore.Audio.Artists.NUMBER_OF_TRACKS,
                MediaStore.Audio.Artists.NUMBER_OF_ALBUMS
            };

            Cursor artistCursor = resolver.query(artistUri, artistProjection, null, null,
                MediaStore.Audio.Artists.ARTIST + " ASC");

            if (artistCursor != null) {
                while (artistCursor.moveToNext()) {
                    JSObject artistObj = new JSObject();
                    long arId = artistCursor.getLong(artistCursor.getColumnIndexOrThrow(MediaStore.Audio.Artists._ID));
                    String arName = artistCursor.getString(artistCursor.getColumnIndexOrThrow(MediaStore.Audio.Artists.ARTIST));
                    int numTracks = artistCursor.getInt(artistCursor.getColumnIndexOrThrow(MediaStore.Audio.Artists.NUMBER_OF_TRACKS));
                    int numAlbums = artistCursor.getInt(artistCursor.getColumnIndexOrThrow(MediaStore.Audio.Artists.NUMBER_OF_ALBUMS));

                    artistObj.put("id", "ar_" + arId);
                    artistObj.put("name", arName != null && !arName.equals("<unknown>") ? arName : "Unknown Artist");
                    artistObj.put("numTracks", numTracks);
                    artistObj.put("numAlbums", numAlbums);
                    artistObj.put("image", ""); // No standard artist image in MediaStore

                    artists.put(artistObj);
                }
                artistCursor.close();
            }

            // Build response
            JSObject result = new JSObject();
            result.put("tracks", tracks);
            result.put("albums", albums);
            result.put("artists", artists);

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to scan music: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void chooseFolder(PluginCall call) {
        saveCall(call);
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "chooseFolderResult");
    }

    @ActivityCallback
    private void chooseFolderResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null) {
                Uri uri = data.getData();
                final int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                getContext().getContentResolver().takePersistableUriPermission(uri, takeFlags);
                
                JSObject response = new JSObject();
                response.put("folderUri", uri.toString());
                response.put("folderPath", uri.getPath());
                call.resolve(response);
            } else {
                call.reject("No folder selected");
            }
        } else {
            call.reject("User cancelled folder selection");
        }
    }

    @PluginMethod
    public void scanFolder(PluginCall call) {
        String folderUriStr = call.getString("folderUri");
        if (folderUriStr == null) {
            call.reject("Folder URI is required");
            return;
        }

        Uri folderUri = Uri.parse(folderUriStr);
        // On modern Android, scanning by folder URI directly via MediaStore is possible if we extract the path
        // or we can use the DATA filter if we are lucky.
        // A better way is to filter by RELATIVE_PATH.
        
        // Extract a readable path hint if possible
        String pathIdentifier = folderUri.getLastPathSegment(); // e.g., "primary:Music/MyTracks"
        if (pathIdentifier != null && pathIdentifier.contains(":")) {
            pathIdentifier = pathIdentifier.split(":")[1];
        }

        try {
            JSArray tracks = new JSArray();
            JSArray albums = new JSArray();
            JSArray artists = new JSArray();
            ContentResolver resolver = getContext().getContentResolver();

            Uri audioUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] trackProjection = {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.ARTIST_ID,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.RELATIVE_PATH
            };

            // Filter tracks that are in the chosen path or subpaths
            String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0 AND (" + 
                             MediaStore.Audio.Media.DATA + " LIKE ? OR " + 
                             MediaStore.Audio.Media.RELATIVE_PATH + " LIKE ?)";
            
            String pattern = "%" + pathIdentifier + "%";
            String[] selectionArgs = new String[]{pattern, pattern};

            Cursor cursor = resolver.query(audioUri, trackProjection, selection, selectionArgs, MediaStore.Audio.Media.TITLE + " ASC");

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject track = new JSObject();
                    long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID));
                    long albumId = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID));
                    long artistId = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST_ID));
                    long duration = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION));
                    String title = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE));
                    String artist = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST));
                    String album = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM));
                    String data = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA));

                    Uri contentUri = Uri.withAppendedPath(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));
                    Uri albumArtUri = Uri.parse("content://media/external/audio/albumart/" + albumId);

                    track.put("id", "t_" + id);
                    track.put("title", title != null ? title : "Unknown");
                    track.put("artist", artist != null && !artist.equals("<unknown>") ? artist : "Unknown Artist");
                    track.put("album", album != null && !album.equals("<unknown>") ? album : "Unknown Album");
                    track.put("albumId", "a_" + albumId);
                    track.put("artistId", "ar_" + artistId);
                    track.put("duration", duration / 1000);
                    track.put("src", data);
                    track.put("contentUri", contentUri.toString());
                    track.put("cover", albumArtUri.toString());

                    tracks.put(track);
                    
                    // Add album/artist if not already in list (simple unique check)
                    // ... (for now, we'll just send tracks and let the JS library process them if needed, 
                    // but scanMusic handled albums separately to be efficient)
                }
                cursor.close();
            }

            // For simplicity and speed, we resolve with the found tracks. 
            // The existing scanMusic logic is more comprehensive for albums/artists across device.
            // When scanning a folder, we'll return the tracks and let JS reconstruct the album list for that folder.
            
            JSObject result = new JSObject();
            result.put("tracks", tracks);
            result.put("folder", pathIdentifier);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Folder scan failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        super.requestPermissions(call);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        super.checkPermissions(call);
    }
}
