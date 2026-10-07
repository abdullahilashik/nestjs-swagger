To fulfill Meta's App Review requirement for **Advanced Access**, every permission you request must have **at least 1 successful API test call** recorded in the last 30 days.

You can complete all 12 of these test calls directly using the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).

---

### Step 1: Set Up Credentials and Generate Token

1. Open the **[Graph API Explorer](https://developers.facebook.com/tools/explorer/)**.
2. Top-right drop-downs:
* **Meta App:** Select your application.
* **User or Page:** Select **User Token**.


3. Under **Permissions**, click **Add a Permission** and add all 12 requested scopes to the list:
* `public_profile`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `instagram_basic`, `instagram_business_basic`, `instagram_manage_comments`, `instagram_content_publish`, `instagram_messaging`, `instagram_business_manage_messages`


4. Click **Generate Access Token**. Log into Facebook / Instagram with an account that has a **Developer, Admin, or Tester role** on your app.
5. Click **Submit** on the permission consent pop-up.

---

### Step 2: Execute Test Calls (Endpoint Checklist)

Use the URL bar in the Graph API Explorer to make a call for each item. Once an API call returns a `200 OK` or valid JSON response, Meta logs the test as complete.

#### 1. `public_profile`

* **Method:** `GET`
* **Endpoint:** `/me?fields=id,name`
* **Action:** Click **Submit**.

#### 2. `business_management`

* **Method:** `GET`
* **Endpoint:** `/me/businesses`
* **Action:** Click **Submit** (returns a list of Meta Business accounts linked to your user).

#### 3. `pages_show_list`

* **Method:** `GET`
* **Endpoint:** `/me/accounts`
* **Action:** Click **Submit** (returns Facebook Pages you manage). *Save one of your `PAGE_ID`s and its `access_token` from the JSON output for the next steps.*

#### 4. `pages_read_engagement`

* **Method:** `GET`
* **Endpoint:** `/{PAGE_ID}?fields=id,name,fan_count,engagement`
* **Action:** Replace `{PAGE_ID}` with your Page ID and click **Submit**.

#### 5. `pages_manage_metadata`

* **Method:** `GET`
* **Endpoint:** `/{PAGE_ID}/subscribed_apps`
* **Action:** Click **Submit** to list webhooks/apps attached to your page.

#### 6. `pages_messaging`

* **Method:** `GET`
* **Endpoint:** `/{PAGE_ID}/conversations`
* **Action:** Click **Submit** (reads Messenger conversations for your Page).

#### 7. `instagram_basic` & `instagram_business_basic`

* **Method:** `GET`
* **Endpoint:** `/{PAGE_ID}?fields=instagram_business_account{id,username,profile_picture_url}`
* **Action:** Click **Submit** (fetches connected Instagram Business/Creator account IDs). *Save the returned `INSTAGRAM_BUSINESS_ACCOUNT_ID`.*

#### 8. `instagram_manage_comments`

* **Method:** `GET`
* **Endpoint:** `/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?fields=id,comments_count,comments{id,text}`
* **Action:** Click **Submit** (fetches comments on your IG posts).

#### 9. `instagram_content_publish`

* **Method:** `GET`
* **Endpoint:** `/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/content_publishing_limit`
* **Action:** Click **Submit** (checks your publishing quote without creating a draft or live post).

#### 10. `instagram_messaging` & `instagram_business_manage_messages`

* **Method:** `GET`
* **Endpoint:** `/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/conversations?platform=instagram`
* **Action:** Click **Submit** (fetches direct message threads for your Instagram account).

---

### Step 3: Verification & Sync

1. Return to **Meta for Developers $\rightarrow$ App Review $\rightarrow$ Permissions and Features**.
2. Refresh the page to verify that the required counts (e.g., `1 of 1 API call(s) required`) begin updating.
3. **Note on Dashboard Lag:** The counter updates asynchronously and can take anywhere from a few minutes up to **24 hours** to reflect completed calls. As long as your calls in the Graph API Explorer returned valid `200` JSON results, Meta's system has logged the execution.



# Credentials

- Instagram Business id: 17841407285951329
- Page ID: 106002158127643



# Page Level API Tests

To convert a User Access Token into a Page Access Token using the [Graph API Explorer](https://developers.facebook.com/tools/explorer/), follow these steps:

### Method 1: Using the API Endpoint (Recommended)

1. Open the **Graph API Explorer** and select your app.
2. Ensure your **User Access Token** is selected in the **Access Token** field and has the `pages_show_list` permission (plus `pages_read_engagement` or `pages_manage_metadata` depending on what you want to do).
3. In the query bar, enter the following endpoint:
```http
GET /me/accounts

```


4. Click **Submit**.
5. Look at the JSON response. Each Page listed will have its own dedicated `access_token` field:
```json
{
  "data": [
    {
      "name": "Your Page Name",
      "id": "123456789012345",
      "access_token": "EAAG..."  <--- THIS IS YOUR PAGE ACCESS TOKEN
    }
  ]
}

```


6. Copy that `access_token` value and paste it into the **Access Token** field at the top of the Graph API Explorer to run Page-level queries.

---

### Method 2: Using the UI Dropdown Shortcut

1. Generate a **User Access Token** with `pages_show_list` permission.
2. Click on the **User or Page** dropdown menu in the top-right settings panel (right above the *Permissions* section).
3. Under the **Page Access Tokens** section, click on the specific Page you want to manage.
4. The Explorer will automatically convert and replace the access token string in the token field with that Page's specific Access Token.