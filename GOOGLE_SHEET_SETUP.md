# Store signup emails in a Google Sheet

The site sends emails to a Vercel API route (`/api/subscribe`), which forwards them to a **Google Apps Script** web app that appends rows to a Google Sheet.

## 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new sheet (e.g. "RunMachine signups").
2. In the first row, add headers, e.g. **Email** (A1) and **Date** (B1).

## 2. Add the Apps Script

1. In the sheet: **Extensions → Apps Script**.
2. Replace the default code with:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const body = e.postData ? JSON.parse(e.postData.contents) : {};
    const email = (body.email || '').trim();
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'No email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheet.appendRow([email, new Date()]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err.message) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Save** the project (e.g. name it "Signup to Sheet").

## 3. Deploy as web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** e.g. "Signup endpoint"
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Authorize the app when prompted (your Google account).
5. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`).

## 4. Configure Vercel

1. In the [Vercel dashboard](https://vercel.com), open your project.
2. Go to **Settings → Environment Variables**.
3. Add:
   - **Name:** `GOOGLE_SCRIPT_URL`
   - **Value:** the Web app URL you copied (e.g. `https://script.google.com/macros/s/.../exec`)
4. Redeploy the project so the new variable is used.

After that, submissions from the hero email field will be sent to your API and appended to the Google Sheet with email and timestamp.

**Custom domain:** If your site uses a different domain, add it to the `ALLOWED_ORIGINS` array in `api/subscribe.js` so the browser can call the API from your domain.
