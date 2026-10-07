# Meta App Review: permissions and screencasts

This guide covers each Facebook/Instagram permission DealerCore requests:

- why the app needs it
- where it is used in the code and the UI
- how to record its screencast for Meta App Review

The scope list is in [config/services.php](../config/services.php) under `services.facebook.scopes`.

Facebook and Instagram use **one Facebook Login**. The Facebook Page card and the Instagram card on the Connect page both open the same login dialog with the same permissions. An Instagram account is reached through the Facebook Page it is linked to.

---

## 1. Before you record

Do all of these on staging, or on any server with a public HTTPS URL. Meta cannot reach `localhost`.

| # | Setup | Where |
|---|-------|-------|
| 1 | Set `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` and `FACEBOOK_REDIRECT_URI` (`{APP_URL}/facebook/auth/callback`). Use the **same app** you submit for review, or Meta rejects the submission. | `.env` |
| 2 | Add the Facebook Login redirect URI `{APP_URL}/facebook/auth/callback`. | App Dashboard → Facebook Login → Settings |
| 3 | Webhooks, **Page** object: callback `{APP_URL}/webhook/facebook`, verify token `FACEBOOK_WEBHOOK_TOKEN`, fields `feed` and `messages`. | App Dashboard → Webhooks |
| 4 | Webhooks, **Instagram** object: callback `{APP_URL}/webhook/instagram`, same verify token, fields `comments` and `messages`. | App Dashboard → Webhooks |
| 5 | Data deletion callback URL: `{APP_URL}/webhook/facebook/data-deletion`. | App Dashboard → App settings → Basic |
| 6 | Privacy policy URL and app icon set. | App Dashboard → App settings → Basic |
| 7 | Test accounts. In Development mode only people with a role on the app trigger webhooks. Use a business account (admin of the Page and the Instagram Business account) and a **second "customer" account** that has a role on the app (tester). | App Dashboard → App roles |
| 8 | The Instagram account is a **Business** account, linked to the Facebook Page, with **Allow access to messages** turned on. | Instagram app → Settings → Messages and story replies → Connected tools |
| 9 | Queue workers running: default queue (webhook jobs) and `--queue=advertise` (posting). | Server |
| 10 | Media storage (S3) is publicly reachable. Instagram downloads images from our URLs. | `.env` / S3 |
| 11 | The test dealer has the `FACEBOOK_INTEGRATION`, `INSTAGRAM_INTEGRATION` and `LEAD_COUNT` subscriptions. Without `LEAD_COUNT`, inbound messages and comments are dropped. | Admin / subscription |
| 12 | A vehicle in stock that is **not sold**, with 2 or more JPG/PNG photos (each under 8 MB). Its advertising templates for Facebook Page and Instagram are enabled. | Inventory |
| 13 | Every permission in §3 is added to the app's use cases (table below, and the "Use case" column in §3). A permission the app doesn't have shows as "Invalid Scopes" in the login dialog. | App Dashboard → Use cases → Customize |
| 14 | Dealers connected before a permission was added must **reconnect** Facebook to grant it. Until then the calls that need it fail. | Connect page |

**Use cases for the permissions.** The app must be a **Business** app connected to the business portfolio.

| Use case | Permissions |
|---|---|
| Manage everything on your Page | `pages_show_list`, `business_management`, `pages_manage_metadata`, `pages_manage_posts`, `pages_read_engagement`, `pages_manage_engagement`, `pages_read_user_content` |
| Engage with customers on Messenger from Meta | `pages_messaging` |
| Manage messaging & content on Instagram → **API setup with Facebook login** (not Instagram login) | `instagram_basic`, `instagram_content_publish`, `instagram_manage_contents`, `instagram_manage_comments`, `instagram_manage_messages` |
| Create & manage ads with Marketing API | `ads_read`, `ads_management` |

**Every recording should:**

- have the app UI in English
- start logged out of DealerCore, or at least show the Connect step (Meta wants the login and permission grant in each video)
- use captions or on-screen notes to say which permission is being shown
- show the result on Facebook or Instagram itself, not only inside DealerCore
- avoid showing personal data or passwords; blur them if needed

---

## 2. Shared clip: login and permission grant

Every screencast starts with this clip. Record it once and reuse it at the start of each video.

1. Log in to DealerCore.
2. Profile menu → **Connect** (`/admin/social`).
3. On the **Facebook Page** card click **Connect**. The Facebook Login dialog opens.
4. Continue as the business account. Select the **Page** and the **Instagram account**, keep all permissions turned on, and click **Save** / **Done**.
5. You return to DealerCore on the **Manage** page. Point out the connected profile name and picture, and the Page listed.
6. Assign the Page to a branch and click **Save**.
7. Back on Connect, open **Manage** on the **Instagram** card. Assign the Instagram account to a branch and click **Save**.

Caption suggestion: *"The dealership admin connects their Facebook Page and linked Instagram Business account with Facebook Login and grants the requested permissions."*

Behind the scenes (`AuthController::facebookLoginCallback`), DealerCore:

- exchanges the code
- reads `/me`
- lists `/me/accounts` with each Page's token and linked Instagram account
- saves them
- subscribes each Page to webhooks with `POST /{page-id}/subscribed_apps`

---

## 3. Permissions

### Summary

| Permission | Use case (App Dashboard) | Submit for review? | Feature | Screencast |
|---|---|---|---|---|
| `public_profile` | Added by default with any use case | Default (auto-granted) | Show who connected | Clip in §2 |
| `pages_show_list` | Manage everything on your Page | Yes | List the dealer's Pages at connect | Video A |
| `business_management` | Manage everything on your Page | Yes | List Pages owned through a Business Portfolio | Video A |
| `pages_manage_metadata` | Manage everything on your Page | Yes | Subscribe Pages to webhooks | Video A |
| `pages_read_engagement` | Manage everything on your Page | Yes | Read Page posts, Page tokens, linked Instagram account | Video A + B |
| `pages_manage_posts` | Manage everything on your Page | Yes | Publish, update and delete vehicle posts on the Page | Video B |
| `pages_manage_engagement` | Manage everything on your Page | Yes | Reply to comments on vehicle posts | Video C |
| `pages_read_user_content` | Manage everything on your Page | Yes | Customer comments on vehicle posts; required by Meta for `pages_manage_engagement` and `instagram_basic` | Video C |
| `pages_messaging` | Engage with customers on Messenger from Meta | Yes | Messenger inbox: receive and reply | Video D |
| `instagram_basic` | Manage messaging & content on Instagram (API setup with Facebook login) | Yes | Read the Instagram account profile | Video A + E |
| `instagram_content_publish` | Manage messaging & content on Instagram (API setup with Facebook login) | Yes | Publish vehicle posts to Instagram | Video E |
| `instagram_manage_contents` | Manage messaging & content on Instagram (API setup with Facebook login) | Yes | Delete outdated and sold vehicle posts on Instagram | Video E |
| `instagram_manage_comments` | Manage messaging & content on Instagram (API setup with Facebook login) | Yes | Receive and reply to Instagram comments | Video F |
| `instagram_manage_messages` | Manage messaging & content on Instagram (API setup with Facebook login) | Yes | Instagram DM inbox: receive and reply | Video G |
| `ads_read` | Create & manage ads with Marketing API | Yes | Instagram publishing and private replies when the Page role comes from Business Manager | Video E + F |
| `ads_management` | Create & manage ads with Marketing API | Yes | Required together with `ads_read` for that Business Manager case | Video E + F |

`pages_messaging_subscriptions` is no longer requested. Meta deprecated it in 2019 and it caused an "Invalid Scopes" warning.

Only permissions DealerCore actually calls an API for are requested. Not requested:

- `email`: DealerCore never used the connecting user's email. `public_profile` (name and picture) is granted by default.

You can record one video per permission, or one longer video covering several permissions, uploaded under each. Meta accepts both, as long as each permission has a clear moment in the video.

---

### `public_profile`

- **Why:** shows which Facebook user connected the dealership.
- **Where:** `GET /me?fields=id,name,picture` in `FacebookService::profile()`, saved on the `socials` record. The name and picture show on the Connect / Manage page.
- **Screencast:** the clip in §2, step 5.
- **Usage description:** *"We use the connected user's name and profile picture to show the dealership which Facebook account is connected on the Connect page."*

### `pages_show_list`

- **Why:** lists the Pages the user manages so they can pick which Pages DealerCore posts to and receives messages for.
- **Where:** `GET /me/accounts` in `FacebookService::pages()`. Pages are listed on **Connect → Facebook Page → Manage**, where they are assigned to branches.
- **Screencast (Video A):** the clip in §2. Pause on the Manage page and caption the Page list.
- **Usage description:** *"After Facebook Login we list the Pages the user manages so the dealership can choose which Pages to connect and assign them to its branches."*

### `business_management`

- **Why:** most dealerships manage their Page through a Business Portfolio. `/me/accounts` does not return Pages the user can only reach through a business without this permission. Without it, the Page and its linked Instagram account do not appear after connecting.
- **Where:** the same `/me/accounts` call at connect.
- **Screencast (Video A):** in the login dialog, show the business assets step where the Page and Instagram account are chosen, then the Page appearing in Manage. If possible, record with a user whose Page access comes from a Business Portfolio.
- **Usage description:** *"Dealerships manage their Pages and Instagram accounts in a Business Portfolio. We need this permission to list those business-owned Pages and Instagram accounts when the dealer connects."*

### `pages_manage_metadata`

- **Why:** subscribes each connected Page to the app's webhooks. Without it, DealerCore never receives Messenger messages or comments.
- **Where:** `FacebookService::subscribePage()`: `POST /{page-id}/subscribed_apps` with `feed,messages`, called for each Page in the connect callback. On disconnect, `FacebookService::unsubscribePage()` calls `DELETE /{page-id}/subscribed_apps`.
- **Screencast (Video A):** after connecting, caption that the Page is now subscribed. Then show it working: send a Messenger message from the customer account and show it arriving in **Leads** (the start of Video D). Optionally show the Page's subscribed app in Graph API Explorer (`GET /{page-id}/subscribed_apps`).
- **Usage description:** *"When a dealership connects a Page we subscribe it to our webhooks so new Messenger messages and comments arrive in the dealership's DealerCore inbox."*

### `pages_read_engagement`

- **Why:**
  - reads the Page access token and linked Instagram account at connect
  - reads a Page post's existing attachments when a vehicle post is updated
  - required alongside `pages_manage_posts` and the Instagram permissions
- **Where:**
  - `/me/accounts` fields `access_token,instagram_business_account`
  - `GET /{post-id}?fields=attachments` in `FacebookService::updateFacebookPagePost()`
- **Screencast (Videos A and B):** the connect clip, and the "update post" part of Video B.
- **Usage description:** *"We read the Page's details, linked Instagram account and the attachments of posts our app created, so we can update a vehicle's post when its details change."*

### `pages_manage_posts`

- **Why:** publishes a dealer's vehicles to their Facebook Page and keeps those posts current:
  - a new post when the vehicle is advertised or reposted
  - the post is edited when the vehicle changes or is sold
  - the old post is deleted when it cannot be edited
- **Where:**
  - `VehicleAdvertiseListener::toFacebookPage()`
  - `FacebookService::postToFacebookPage()` (`/{page}/photos`, `/{page}/feed`)
  - `FacebookService::postVideoToFacebookPage()` (`/{page}/videos`)
  - `FacebookService::updateFacebookPagePost()` and `FacebookService::deleteFacebookPagePost()`
- **UI path:** Inventory → open a vehicle → **Advertising** step → enable the Facebook Page template → **Repost**. Alternatively: vehicle edit → **Publish to Marketplaces & Social Media** → Facebook Page.
- **Screencast (Video B):**
  1. Clip from §2 (shortened).
  2. Open a vehicle → Advertising → click **Repost** for Facebook.
  3. Switch to the Facebook Page and show the new post with photos and text.
  4. Back in DealerCore, change the price (or mark the vehicle sold). Show the Page post updated.
- **Usage description:** *"Dealerships publish their vehicles to their Facebook Page from DealerCore. We create the post with the vehicle's photos and details, and update it when the price changes or the vehicle is sold."*

### `pages_read_user_content`

- **Why:** comments on a dealer's vehicle posts are written by customers (user-generated content). Meta lists this permission as a dependency of `pages_manage_engagement` and `instagram_basic`, and the login dialog adds it automatically. Without it in the app, login fails with "Invalid Scopes".
- **Where:** inbound `feed` webhook → `FacebookPagePostCommentJob` (comment text, commenter name and ID), and the comment replies under `pages_manage_engagement`.
- **Screencast (Video C):** steps 1 and 2 of Video C: the customer's comment arriving in **Leads**.
- **Usage description:** *"Customers comment on a dealership's vehicle posts. We read those comments so they appear as leads in the dealership's DealerCore inbox, where staff reply to them."*

### `pages_manage_engagement`

- **Why:** lets the dealer reply to comments on their vehicle posts from the DealerCore inbox.
- **Where:** `FacebookService::sendCommentReplyToFacebook()`: `POST /{comment-id}/comments` (text, optionally one photo), from `LeadService::sendFacebookCommentReply()`.
- **UI path:** **Leads** (`/admin/leads`) → open the conversation → **Reply** on the comment → channel **Facebook Comment** → Send.
- **Screencast (Video C):**
  1. With the customer account, comment on the vehicle post from Video B. Only comments on posts DealerCore published become leads.
  2. In DealerCore, show the comment arriving in **Leads** as "Facebook Comment".
  3. Reply with channel **Facebook Comment**.
  4. Show the reply under the comment on Facebook.
- **Usage description:** *"Comments on a dealership's vehicle posts arrive in the DealerCore inbox, where staff reply to them; the reply is posted under the comment on the Page."*

### `pages_messaging`

- **Why:** Messenger inbox. Customer messages to the dealer's Page become leads, and staff reply from DealerCore.
- **Where:**
  - inbound: webhook `POST /webhook/facebook` → `FacebookPageMessageJob` (sender via `GET /{psid}`)
  - outbound: `FacebookService::sendPrivateMessageToFacebook()` (`POST /{page}/messages`, `messaging_type=RESPONSE`). Text first, quoting the message replied to (`reply_to`), then each attachment
  - private reply to a comment: `sendCommentPrivateReplyToFacebook()`. One text message per comment, as Meta allows; the conversation continues once the customer replies
- **UI path:** **Leads** → conversation → composer → channel **Facebook Message** → Send.
- **Screencast (Video D):**
  1. With the customer account, open the Page in Messenger and send "Is the 2020 Corolla still available?".
  2. Show it arriving in DealerCore **Leads** with the sender's name and picture.
  3. Reply with text, and optionally a photo.
  4. Show the reply in the customer's Messenger.
  5. Optional: on the comment from Video C, reply with channel **Facebook Message** to show a private reply.
- **Usage description:** *"Customers message the dealership's Page about vehicles. Their messages appear as leads in DealerCore and staff reply from there within Messenger's 24-hour window."*

### `instagram_basic`

- **Why:** reads the connected Instagram account's username, name and picture to list it on the Instagram card. Required by the other Instagram permissions.
- **Where:** `FacebookService::instagram()`: `GET /{ig-user-id}?fields=id,name,username,profile_picture_url`.
- **UI path:** **Connect → Instagram → Manage**.
- **Screencast (Videos A / E):** show the Instagram account listed with its username and picture, then assign it to a branch.
- **Usage description:** *"We read the connected Instagram Business account's username and profile picture to show it on the Connect page, where the dealership assigns it to a branch."*

### `instagram_content_publish`

- **Why:** publishes the dealer's vehicles to their Instagram Business account.
- **Where:**
  - `VehicleAdvertiseListener::toInstagram()`
  - `FacebookService::postToInstagramAccount()`: `POST /{ig}/media` (single image, carousel items or reel), then polls the container status, then `POST /{ig}/media_publish`
  - up to 10 media items; carousel when there is more than one
- **UI path:** Inventory → vehicle → **Advertising** → Instagram template → **Repost**, or **Publish to Marketplaces & Social Media** → Instagram.
- **Screencast (Video E):**
  1. Clip from §2 (shortened), showing the Instagram account.
  2. Open a vehicle → Advertising → click **Repost** for Instagram.
  3. Wait for it to finish (cut the wait if needed).
  4. Open the Instagram profile and show the new carousel post with the caption.
- **Notes:** Instagram can't edit a caption, so an update or repost creates a new post and then deletes the older one (see `instagram_manage_contents`). Sold vehicles are not posted.
- **Usage description:** *"Dealerships publish their vehicles to their Instagram Business account from DealerCore. We create a photo or carousel post with the vehicle's photos and details."*

### `instagram_manage_contents`

- **Why:** an Instagram caption can't be edited through the API, so an old vehicle post keeps showing an outdated price, or keeps advertising a vehicle that has sold. DealerCore deletes those posts.
- **Where:**
  - `FacebookService::deleteInstagramMedia()`: `DELETE /{ig-media-id}`
  - `VehicleAdvertiseListener::toInstagram()`: after a new post publishes, the vehicle's older posts on that account are deleted. Deletion happens only after the new post is live, so the vehicle is never missing from the feed.
  - when a vehicle is sold, its Instagram posts are deleted (`removeInstagramPosts()`)
  - if a delete fails (e.g. the dealer hasn't reconnected to grant this permission), the post stays `archived` and comments on it still arrive as leads
- **Screencast (Video E):**
  1. After the first Instagram post in Video E, change the vehicle's price and click **Repost** for Instagram.
  2. Show the new post on the Instagram profile, and that the old post is gone.
  3. Mark the vehicle **sold** and show its post removed from the profile.
- **Notes:** Meta supports deleting feed posts, reels and whole carousels, but not posts used in ads or single carousel items. DealerCore only deletes posts it created.
- **Usage description:** *"Instagram captions can't be edited, so when a dealership updates a vehicle we publish a fresh post and delete the outdated one, and when the vehicle sells we delete its post. We only delete posts our app created."*

### `ads_read` and `ads_management`

- **Why:** Meta's Instagram publishing and private-reply docs say that when the user's role on the Page was granted through Business Manager, the app also needs `ads_management` **and** `ads_read`. That is the usual setup for dealerships. DealerCore does not read ad data or manage ads.
- **Where:** no separate API call. They are required by the Instagram publishing and private-reply calls.
- **Screencast (Videos E and F):** the same videos as `instagram_content_publish` and `instagram_manage_comments`, recorded with a user whose Page access comes from Business Manager. Caption that publishing and replies work for business-managed Pages.
- **Usage description:** *"Our dealership users manage their Pages through Business Manager. Meta requires ads_read and ads_management for Instagram content publishing and private replies in that setup. We do not read, create or manage ads."*

### `instagram_manage_comments`

- **Why:** comments on the dealer's Instagram vehicle posts become leads, and staff reply from DealerCore.
- **Where:**
  - inbound: webhook `POST /webhook/instagram` (field `comments`) → `InstagramPostCommentJob`
  - reply: `FacebookService::sendCommentReplyToInstagram()`: `POST /{ig-comment-id}/replies`
  - private DM reply to a comment: `sendCommentPrivateReplyToInstagram()`. One text message per comment, as Meta allows
- **UI path:** **Leads** → conversation → **Reply** on the comment → channel **Instagram Comment** → Send.
- **Screencast (Video F):**
  1. With the customer Instagram account, comment on the post from Video E.
  2. Show it arriving in DealerCore **Leads** as "Instagram Comment".
  3. Reply with channel **Instagram Comment**.
  4. Show the reply under the comment on Instagram.
- **Notes:** only comments on posts DealerCore published are captured. DealerCore does **not** hide or delete comments, so do not claim it in the description.
- **Usage description:** *"Comments on a dealership's Instagram vehicle posts arrive in the DealerCore inbox, where staff reply to them; the reply is posted under the comment on Instagram."*

### `instagram_manage_messages`

- **Why:** Instagram DM inbox. Customer DMs become leads, and staff reply from DealerCore.
- **Where:**
  - inbound: webhook `POST /webhook/instagram` (field `messages`) → `InstagramMessageJob` (sender via `GET /{igsid}?fields=name,username,profile_pic`)
  - outbound: `FacebookService::sendPrivateMessageToFacebook()` through the linked Page (`POST /{page}/messages`)
- **UI path:** **Leads** → conversation → channel **Instagram Message** → Send.
- **Screencast (Video G):** Meta's checklist for this permission asks to show starting a conversation, sending and replying.
  1. With the customer Instagram account, send a DM to the business account.
  2. Show it arriving in DealerCore **Leads** with the sender's username and picture.
  3. Reply with text, and optionally a photo. Show it in the customer's Instagram DMs.
  4. Optional: on the comment from Video F, reply with channel **Instagram Message** to show a private reply.
  5. Optional: Meta also asks about **unsent messages**. If the customer unsends a message, DealerCore ignores the deletion event. Caption that rather than showing a UI change.
- **Notes:** Instagram DM attachments follow Meta's limits: images (png, jpeg, gif), video (mp4, ogg, avi, mov, webm), audio (aac, m4a, wav) and PDF.
- **Usage description:** *"Customers send Instagram DMs to the dealership. Messages appear as leads in DealerCore and staff reply from there within the 24-hour messaging window."*

### `pages_messaging_subscriptions`

Removed from the scope list. Meta deprecated it in 2019, and DealerCore never used it. Do not submit it.

---

## 4. Recording order

Recording in this order lets each video reuse what the previous one created:

| Video | Covers | Depends on |
|---|---|---|
| A: Connect | `public_profile`, `pages_show_list`, `business_management`, `pages_manage_metadata`, `pages_read_engagement`, `instagram_basic` | – |
| B: Facebook post | `pages_manage_posts`, `pages_read_engagement` | A |
| C: Facebook comment reply | `pages_read_user_content`, `pages_manage_engagement` | B (comment on that post) |
| D: Messenger | `pages_messaging` | A |
| E: Instagram post | `instagram_content_publish`, `instagram_manage_contents`, `ads_read`, `ads_management` | A |
| F: Instagram comment reply | `instagram_manage_comments`, `ads_read`, `ads_management` | E (comment on that post) |
| G: Instagram DM | `instagram_manage_messages` | A |

Keep each video short (2–4 minutes). Cut waiting time. Add a title card or caption naming the permission(s) at the start.

---

## 5. Common rejection reasons

- **The recording is not of the submitted app.** The app ID in `.env` must match the app under review.
- **The login and permission grant are not shown.** Include the §2 clip in every video.
- **The result is not shown on Facebook or Instagram.** Always cut to the Page, Messenger or Instagram to show the post, reply or message.
- **The description claims features that don't exist.** For example, comment hide/delete or message tags. DealerCore only replies, and only inside the 24-hour window (`messaging_type=RESPONSE`). The only Instagram content it deletes is its own outdated or sold vehicle posts.
- **Webhooks don't fire during recording.** Check setup steps 3, 4, 7, 8, 9 and 11. In Development mode, the customer account must have a role on the app.
- **Reviewer test access.** Give Meta the DealerCore reviewer account (below) in the submission notes. Reviewers connect their own Facebook test Page with Facebook Login. Never provide personal Facebook/Instagram passwords.

### Reviewer account

| | |
|---|---|
| Login URL | `{APP_URL}/login` |
| Email | `meta.reviewer@dealercore.com.au` |
| Verification code | the value of `REVIEWER_OTP` |

DealerCore login is passwordless: it sends a code by email or SMS. Reviewers can't receive that code, so the emails in `REVIEWER_EMAILS` accept the fixed `REVIEWER_OTP` code instead, and nothing is sent to them. Everyone else still gets a random code.

**Setup on the server under review:**

1. `.env`:
   ```
   REVIEWER_EMAILS=waldertully.385920@gmail.com,meta.reviewer@dealercore.com.au
   REVIEWER_OTP=<pick a 4-digit code>
   ```
   Then run `php artisan config:clear`.
2. Create the account: click **Seed Reviewers** on the test page (`/test`), type `/seed reviewers` in its terminal, or run `php artisan db:seed --class=ReviewerSeeder`. This adds only the Google and Meta reviewer dealerships (Developer package, one branch) and skips any that already exist.
3. After approval, clear `REVIEWER_OTP` to turn the fixed code off.

Suggested submission note: *"Log in at {APP_URL}/login with meta.reviewer@dealercore.com.au and verification code XXXX. Go to profile menu → Connect → Facebook Page → Connect, and log in with your Facebook test user that manages a Page and a linked Instagram Business account. Add a vehicle under Inventory to test publishing."*

---

## 6. Related endpoints

| Purpose | Route |
|---|---|
| Connect (opens Facebook Login) | `GET /admin/social/{facebook_page\|instagram}/connect` |
| Login callback | `GET /facebook/auth/callback` |
| Page webhooks | `GET/POST /webhook/facebook` |
| Instagram webhooks | `GET/POST /webhook/instagram` |
| Data deletion callback | `POST /webhook/facebook/data-deletion` |
| Data deletion status | `GET /webhook/facebook/data-deletion/{code}` |
| Inbox (send reply) | `POST /api/admin/inbox/messages/{inboxId}` |

Graph API version: `FACEBOOK_GRAPH_VERSION` (default `v26.0`).
