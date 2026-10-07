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
| 3 | Webhooks, **Page** object: callback `{APP_URL}/webhook/facebook`, verify token `FACEBOOK_WEBHOOK_VERIFY_TOKEN`, fields `feed` and `messages`. | App Dashboard → Webhooks |
| 4 | Webhooks, **Instagram** object: callback `{APP_URL}/webhook/instagram`, same verify token, fields `comments` and `messages`. | App Dashboard → Webhooks |
| 5 | Data deletion callback URL: `{APP_URL}/webhook/facebook/data-deletion`. | App Dashboard → App settings → Basic |
| 6 | Privacy policy URL and app icon set. | App Dashboard → App settings → Basic |
| 7 | Test accounts. In Development mode only people with a role on the app trigger webhooks. Use a business account (admin of the Page and the Instagram Business account) and a **second "customer" account** that has a role on the app (tester). | App Dashboard → App roles |
| 8 | The Instagram account is a **Business** account, linked to the Facebook Page, with **Allow access to messages** turned on. | Instagram app → Settings → Messages and story replies → Connected tools |
| 9 | Queue workers running: default queue (webhook jobs) and `--queue=advertise` (posting). | Server |
| 10 | Media storage (S3) is publicly reachable. Instagram downloads images from our URLs. | `.env` / S3 |
| 11 | The test dealer has the `FACEBOOK_INTEGRATION`, `INSTAGRAM_INTEGRATION` and `LEAD_COUNT` subscriptions. Without `LEAD_COUNT`, inbound messages and comments are dropped. | Admin / subscription |
| 12 | A vehicle in stock that is **not sold**, with 2 or more JPG/PNG photos (each under 8 MB). Its advertising templates for Facebook Page and Instagram are enabled. | Inventory |

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

| Permission | Submit for review? | Feature | Screencast |
|---|---|---|---|
| `public_profile` | Default (auto-granted) | Show who connected | Clip in §2 |
| `email` | Yes (simple) | Store the connecting user's email | Clip in §2 |
| `pages_show_list` | Yes | List the dealer's Pages at connect | Video A |
| `business_management` | Yes | List Pages owned through a Business Portfolio | Video A |
| `pages_manage_metadata` | Yes | Subscribe Pages to webhooks | Video A |
| `pages_read_engagement` | Yes | Read Page posts, Page tokens, linked Instagram account | Video A + B |
| `pages_manage_posts` | Yes | Publish, update and delete vehicle posts on the Page | Video B |
| `pages_manage_engagement` | Yes | Reply to comments on vehicle posts | Video C |
| `pages_messaging` | Yes | Messenger inbox: receive and reply | Video D |
| `instagram_basic` | Yes | Read the Instagram account profile | Video A + E |
| `instagram_content_publish` | Yes | Publish vehicle posts to Instagram | Video E |
| `instagram_manage_comments` | Yes | Receive and reply to Instagram comments | Video F |
| `instagram_manage_messages` | Yes | Instagram DM inbox: receive and reply | Video G |
| `ads_read` | Yes | Needed by Instagram publishing when the Page role comes from Business Manager | Video E |
| `pages_messaging_subscriptions` | **No, do not submit** | Deprecated by Meta, not used in code | – |

You can record one video per permission, or one longer video covering several permissions, uploaded under each. Meta accepts both, as long as each permission has a clear moment in the video.

---

### `public_profile`

- **Why:** shows which Facebook user connected the dealership.
- **Where:** `GET /me?fields=id,name,email,picture` in `FacebookService::profile()`, saved on the `socials` record. The name and picture show on the Connect / Manage page.
- **Screencast:** the clip in §2, step 5.
- **Usage description:** *"We use the connected user's name and profile picture to show the dealership which Facebook account is connected on the Connect page."*

### `email`

- **Why:** records the email of the person who connected the account, so the dealership can tell which staff member's Facebook account is linked.
- **Where:** same `/me` call, stored in `socials.email`.
- **Screencast:** the clip in §2, step 5.
- **Usage description:** *"We store the connecting user's email with the connection so dealership admins can identify which staff member connected Facebook."*

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

### `pages_manage_engagement`

- **Why:** lets the dealer reply to comments on their vehicle posts from the DealerCore inbox.
- **Where:** `FacebookService::sendCommentReplyToFacebook()`: `POST /{comment-id}/comments`, from `LeadService::sendFacebookCommentReply()`.
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
  - outbound: `FacebookService::sendPrivateMessageToFacebook()` (`POST /{page}/messages`, `messaging_type=RESPONSE`, text and attachments)
  - private reply to a comment: `sendCommentPrivateReplyToFacebook()`
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
- **Notes:** Instagram has no edit API, so a repost creates a new post. Sold vehicles are not posted.
- **Usage description:** *"Dealerships publish their vehicles to their Instagram Business account from DealerCore. We create a photo or carousel post with the vehicle's photos and details."*

### `ads_read`

- **Why:** Meta requires `ads_read` (or `ads_management`) to publish to Instagram when the user's Page role was granted through Business Manager, which is the usual setup for dealerships. DealerCore does not read ad data.
- **Where:** no separate API call. It is required by the Instagram publishing calls above.
- **Screencast (Video E):** use the same video as `instagram_content_publish`, recorded with a user whose Page access comes from Business Manager. Caption that publishing works for business-managed Pages.
- **Usage description:** *"Our dealership users manage their Pages through Business Manager. Meta requires this permission for Instagram content publishing in that setup. We do not read or display ads data."*

### `instagram_manage_comments`

- **Why:** comments on the dealer's Instagram vehicle posts become leads, and staff reply from DealerCore.
- **Where:**
  - inbound: webhook `POST /webhook/instagram` (field `comments`) → `InstagramPostCommentJob`
  - reply: `FacebookService::sendCommentReplyToInstagram()`: `POST /{ig-comment-id}/replies`
  - private DM reply to a comment: `sendCommentPrivateReplyToInstagram()`
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
- **Usage description:** *"Customers send Instagram DMs to the dealership. Messages appear as leads in DealerCore and staff reply from there within the 24-hour messaging window."*

### `pages_messaging_subscriptions`

Do **not** submit it. Meta deprecated it, and DealerCore does not use it. It is still in the scope list. If the login dialog shows an "invalid scope" warning, remove it from `config/services.php`.

---

## 4. Recording order

Recording in this order lets each video reuse what the previous one created:

| Video | Covers | Depends on |
|---|---|---|
| A: Connect | `public_profile`, `email`, `pages_show_list`, `business_management`, `pages_manage_metadata`, `pages_read_engagement`, `instagram_basic` | – |
| B: Facebook post | `pages_manage_posts`, `pages_read_engagement` | A |
| C: Facebook comment reply | `pages_manage_engagement` | B (comment on that post) |
| D: Messenger | `pages_messaging` | A |
| E: Instagram post | `instagram_content_publish`, `ads_read` | A |
| F: Instagram comment reply | `instagram_manage_comments` | E (comment on that post) |
| G: Instagram DM | `instagram_manage_messages` | A |

Keep each video short (2–4 minutes). Cut waiting time. Add a title card or caption naming the permission(s) at the start.

---

## 5. Common rejection reasons

- **The recording is not of the submitted app.** The app ID in `.env` must match the app under review.
- **The login and permission grant are not shown.** Include the §2 clip in every video.
- **The result is not shown on Facebook or Instagram.** Always cut to the Page, Messenger or Instagram to show the post, reply or message.
- **The description claims features that don't exist.** For example, comment hide/delete or message tags. DealerCore only replies, and only inside the 24-hour window (`messaging_type=RESPONSE`).
- **Webhooks don't fire during recording.** Check setup steps 3, 4, 7, 8, 9 and 11. In Development mode, the customer account must have a role on the app.
- **Reviewer test access.** With Facebook Login for Business, reviewers use their own accounts. Otherwise provide DealerCore test login details in the submission notes. Never provide personal Facebook/Instagram passwords.

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
