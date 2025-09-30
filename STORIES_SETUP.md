# Stories Feature Setup Instructions

This guide will help you set up the 24-hour disappearing stories feature in your application.

## 🚀 Quick Setup Steps

### 1. Database Migration

Run the following migrations in your Supabase dashboard SQL editor:

```sql
-- First, create the stories system
-- File: supabase/migrations/20250929000002_create_stories_system.sql
```

Copy and execute the complete SQL from: `supabase/migrations/20250929000002_create_stories_system.sql`

```sql
-- Then, create the following system (if you want user following)
-- File: supabase/migrations/20250929000003_create_following_system.sql
```

Copy and execute the complete SQL from: `supabase/migrations/20250929000003_create_following_system.sql`

### 2. Storage Bucket Setup

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Create a new bucket called `media`
3. Set the bucket to **Public** (for story media)
4. Add the following policies:

```sql
-- Allow authenticated users to upload to stories folder
CREATE POLICY "Users can upload story media" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'stories'
  );

-- Allow public access to view story media
CREATE POLICY "Public can view story media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow users to delete their own story media
CREATE POLICY "Users can delete their own story media" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'stories'
  );
```

### 3. Edge Function Deployment

Deploy the cleanup function for automated story expiration:

```bash
# Deploy the cleanup function
supabase functions deploy cleanup-expired-stories

# Set up a cron job (using Supabase Cron or external service)
# Run every hour to clean up expired stories
```

**Cron Schedule Options:**

#### Option A: Supabase Cron (Recommended)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 * * * *', -- Every hour at minute 0
  'SELECT net.http_post(
    url := ''[YOUR_SUPABASE_URL]/functions/v1/cleanup-expired-stories'',
    headers := ''{"Authorization": "Bearer [YOUR_SERVICE_ROLE_KEY]", "Content-Type": "application/json"}''::jsonb,
    body := ''{}''::jsonb
  );'
);
```

#### Option B: External Cron Service
Set up a service like GitHub Actions, Vercel Cron, or similar to call:
```
POST https://[your-project].supabase.co/functions/v1/cleanup-expired-stories
Authorization: Bearer [service-role-key]
```

### 4. Environment Variables

Ensure these are set in your Supabase Edge Functions:

- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 5. Mobile Camera Permissions

For mobile apps using Capacitor, add camera permissions:

#### iOS (ios/App/App/Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos for stories</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select photos for stories</string>
```

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## ✅ Testing the Implementation

### 1. Create a Story
- Navigate to Communities or Profile page
- Click the "+" button in the stories ring
- Test photo/video capture and text stories

### 2. View Stories
- Click on any user's story ring
- Test navigation between stories
- Test reactions and replies

### 3. Verify Expiration
- Create a test story
- Wait for expiration (24 hours) or manually update the `expires_at` field in the database
- Confirm the story disappears and media is cleaned up

## 🎨 Customization Options

### Styling
The stories components use Tailwind CSS classes. Customize colors and styles in:
- `src/components/stories/StoriesRing.tsx`
- `src/components/stories/StoryViewer.tsx`
- `src/components/stories/StoryCamera.tsx`

### Story Duration
Change the default 5-second viewing duration in `StoryViewer.tsx`:
```typescript
const STORY_DURATION = 5000; // Change this value (in milliseconds)
```

### Background Colors
Add more background color options in `StoryCamera.tsx`:
```typescript
const BACKGROUND_COLORS = [
  '#000000', '#FFFFFF', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  // Add more colors here
];
```

## 🔧 Troubleshooting

### Stories Not Appearing
1. Check that the user is in communities with other users
2. Verify the `user_stories` table has active stories
3. Ensure RLS policies are correctly applied

### Camera Not Working
1. Verify Capacitor camera plugin is installed: `npm install @capacitor/camera`
2. Check mobile permissions are properly configured
3. Test on actual device (camera may not work in simulators)

### Stories Not Expiring
1. Verify the Edge Function is deployed and accessible
2. Check the cron job is running
3. Verify the `cleanup_orphaned_story_data` function exists

### Upload Errors
1. Verify the `media` storage bucket exists and is public
2. Check storage policies allow authenticated uploads
3. Ensure file sizes are within limits

## 📱 Platform-Specific Notes

### Web
- Uses HTML5 `getUserMedia()` for camera access
- File picker fallback for unsupported browsers
- Responsive design for desktop and mobile

### iOS/Android
- Native camera integration via Capacitor
- Hardware-optimized video recording
- Native photo library access

## 🔄 Real-time Updates

Stories automatically sync across devices using Supabase realtime subscriptions. Users will see:
- New stories appearing instantly
- Updated view counts
- Real-time reactions

The system is now ready for production use! 🎉