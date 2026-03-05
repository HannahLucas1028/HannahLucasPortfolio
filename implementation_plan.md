# Hannah Lucas Portfolio - CMS Integration Plan

## Goal Description
The user needs the ability to dynamically update the portfolio's content, media, and styles via a private "backdoor" (Admin Panel) accessed exclusively through their Gmail account. We need to convert the static website into a dynamic full-stack application, preserving all frontend animations and "glam" aesthetics. 

**Note on MacOS Compatibility:** 
The current website code *already* fully supports and works flawlessly on MacOS Safari and Chrome. The previous mention of "Linux only" was strictly regarding *my own* internal automated testing tool, not your code! Your website works perfectly on Mac.

## User Review Required
> [!IMPORTANT]
> **Google OAuth Credentials Needed**
> To allow you to log in securely with your Gmail, we need to connect the app to Google. You will need to create a project in the [Google Cloud Console](https://console.cloud.google.com/), enable the **Google+ API / Google Docs API (or just Google OAuth)**, and generate an OAuth Client ID and Secret. 
> 
> *Once I start building, I will provide you with step-by-step instructions on how to get these keys.* For now, please confirm this path sounds good!

> [!WARNING]
> **Dynamic Frontend Changes**
> Because you want to add pages, change fonts, and rewrite content dynamically, the current `index.html` will be retrofitted. It will load, fetch your custom settings from the database, and inject the content into the existing beautiful animation structure.

## Proposed Changes

### Serverless Infrastructure (Firebase)
Instead of a bulky Node.js local server (which requires installing developer tools on your Mac), we'll use **Firebase** by Google. This is a much better fit for a portfolio because it means your site can be hosted anywhere for free, and the CMS "backdoor" will work perfectly without managing a server.
- **Firebase Authentication**: Handles your strict Gmail login requirement out-of-the-box.
- **Firestore Database**: A real-time cloud database to store your text, colors, settings, and receipts.
- **Firebase Storage**: To handle uploads of your new pictures, voice memos, and videos.

### Admin Panel ("The Backdoor")
- **File**: `admin.html` (A hidden backdoor page).
- **Security**: Upon visiting `admin.html`, you will be prompted to log in with Google. If the email doesn't match your approved Gmail, it rejects them.
- A clean, user-friendly dashboard where you can:
  - Update HEX color codes / font links.
  - Upload images, voice memos (`.mp3`/`.wav`), or videos directly to Firebase Storage.
  - Paste YouTube/Vimeo embed links.
  - Edit the text for the Home, Journey, and Impact sections.
  - Add new "Receipt" cards.

### Frontend API Integration
- Modify `index.html` and `app.js` to initialize Firebase.
- On page load, fetch the `themeSettings` and `pageContent` from Firestore.
- Dynamically apply CSS variables to the `:root` pseudo-class for color/font overrides.
- Dynamically render the DOM elements for chapters and receipts based on the cloud database, preserving all your beautiful Scrollytelling animations.

## Verification Plan
### Local Testing
- Test Google Auth login on the `/admin.html` page.
- Upload an image in the admin panel to Firebase Storage and verify it reflects on the frontend.
- Edit a color hex code in the admin dashboard and verify the glowing accents update instantly on the main site.
