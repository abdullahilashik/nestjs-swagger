I’ll trace the Meta/Facebook integration and map each requested permission to the code paths that use it, then review the attached App Review questions against those findings.

Search for `pages_show_list|pages_manage_metadata|pages_messaging|business_management|pag...`

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\meta-questions.md"
}

Read , lines 75 to 120
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\config\\services.php",
  "view_range": [
    75,
    120
  ]
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Models\\FacebookAppSettings.php"
}

Read , lines 1 to 77
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\meta-questions.md",
  "view_range": [
    1,
    77
  ]
}

Search for `Facebook|facebook|Instagram|instagram|graph\.facebook|graph\.instagram|messag...`

Find files matching `**/*Facebook*`

The permission names appear in the configured OAuth scopes, but the integration is spread across OAuth, social-account linking, messaging/comment handlers, and publishing. I’m checking those actual flows now so the review answers distinguish permissions the app requests from features it really implements.

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\SocialController.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Jobs\\FacebookPageMessageJob.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Jobs\\FacebookPagePostCommentJob.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Jobs\\InstagramMessageJob.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Jobs\\InstagramPostCommentJob.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\WebhookController.php"
}

Read 
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\routes\\web.php"
}

Search for `function |public function|private function|protected function|Graph|graph|ins...`

Search for `function |public function|private function|protected function|facebook|instag...`

Search for `function |facebook|instagram|webhook|FacebookPage|Instagram|pages|comment|mes...`

Search for `facebook|instagram|social|webhook`

Search for `instagram_content_publish|instagram_business_basic|instagram_business_manage_...`

Read , lines 1 to 204
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php",
  "view_range": [
    1,
    204
  ]
}

Read , lines 504 to 696
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php",
  "view_range": [
    504,
    696
  ]
}

Read , lines 827 to 879
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php",
  "view_range": [
    827,
    879
  ]
}

Read , lines 880 to 1020
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php",
  "view_range": [
    880,
    1020
  ]
}

Read , lines 1017 to 1210
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\FacebookService.php",
  "view_range": [
    1017,
    1210
  ]
}

Read , lines 1 to 205
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\SocialController.php",
  "view_range": [
    1,
    205
  ]
}

Read , lines 1 to 200
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\AuthController.php",
  "view_range": [
    1,
    200
  ]
}

Search for `pages_subscribed_apps|subscribed_apps|subscribed_fields|feed|comments|/me/acc...`

Search for `postToInstagramAccount|sendPrivateMessageToFacebook|sendCommentPrivateReplyTo...`

Read , lines 160 to 330
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\AuthController.php",
  "view_range": [
    160,
    330
  ]
}

Search for `Facebook|Instagram|facebook|instagram|messaging|Comment|post`

Search for `Facebook|Instagram|facebook|instagram|post|comment|message|social`

Search for `comment|message|facebook|instagram|sendPrivateMessageToFacebook|sendCommentPr...`

Read , lines 320 to 515
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Services\\LeadService.php",
  "view_range": [
    320,
    515
  ]
}

Read , lines 370 to 550
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Listeners\\VehicleAdvertiseListener.php",
  "view_range": [
    370,
    550
  ]
}

Read , lines 1 to 180
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\resources\\views\\features\\social\\manage.blade.php",
  "view_range": [
    1,
    180
  ]
}

Read , lines 20 to 155
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\app\\Http\\Controllers\\WebhookController.php",
  "view_range": [
    20,
    155
  ]
}

Read , lines 1 to 18
Completed with input: {
  "path": "D:\\workspace\\dealercore\\dealercore\\meta-questions.md",
  "view_range": [
    1,
    18
  ]
}

## Integration overview

DealerCore uses **Facebook Login / the Facebook Graph API** to connect a user’s Facebook account, retrieve their Pages, and discover linked Instagram Business accounts. The OAuth scopes are built from `config/services.php`. On callback, DealerCore fetches the user profile, lists their Pages, and saves linked Instagram account details in `AuthController.php` and `FacebookService.php`.

The connected accounts support vehicle publishing and an inbox workflow. Vehicle ads are published to Facebook and Instagram in `VehicleAdvertiseListener.php`; Facebook and Instagram comment and message webhooks are received in `WebhookController.php`, processed into leads/messages, and users can reply through `LeadService.php`.

## Permission-by-permission findings

| Permission | What the code supports | App Review assessment |
|---|---|---|
| `pages_show_list` | Calls `GET /me/accounts` to list the user’s Pages, then saves the Pages they can connect. `FacebookService.php` | **Justifiable.** Explain that users choose a Page to connect to a dealership/yard. |
| `pages_manage_metadata` | The app has Facebook webhook verification/receiver routes, but I found no code that subscribes or unsubscribes a Page to webhooks or otherwise manages Page settings. `WebhookController.php` | **Requested, but not demonstrated by this code.** If Page webhook subscriptions are configured elsewhere (for example, in Meta’s dashboard), verify whether this permission is actually needed for the submitted flow. Don’t claim the app manages Page settings based on this repository alone. |
| `pages_messaging` | Receives Facebook Page message webhooks and sends replies/private replies from the inbox. `FacebookPageMessageJob.php`, `LeadService.php` | **Justifiable.** The current inbound handler processes text messages; it skips messages without text. |
| `business_management` | It is in the configured OAuth scope list, but I found no Business Manager/business-asset listing or management API calls. | **Not evidenced by this repository.** Remove from the review request unless another deployed component genuinely uses it. |
| `pages_read_engagement` | Page comment webhook events are used to create/update inbox leads. `FacebookPagePostCommentJob.php` | **Potentially justifiable for the comment workflow**, but the code does not appear to fetch historical Page posts, comments, reactions, or analytics. Describe only the comment events actually used. |
| `instagram_content_publish` | Creates Instagram media containers and publishes images/videos, including carousels. `FacebookService.php` | **Justifiable.** Describe publishing dealership vehicle listings to a connected Instagram Business account. |
| `instagram_basic` | Retrieves linked Instagram account profile details during Facebook Page connection; also reads sender details for Instagram inbox events. `AuthController.php`, `FacebookService.php` | **Used in the current configured flow.** The connection relies on the Instagram account linked to a Facebook Page. |
| `instagram_business_basic` | Not present in the configured scopes or shown as a distinct permission in this code. | **Not evidenced as a separately requested permission.** The integration currently discovers the Instagram Business account through the connected Facebook Page. Confirm the permission/product mapping in the Meta dashboard for the flow you are submitting. |
| `instagram_business_manage_messages` | Not present in the configured scopes. Instagram messaging code exists, but it uses the Page-token-based flow and the configured `instagram_manage_messages` scope. | **Not evidenced under this permission name.** Don’t say this exact permission is used unless your current Meta product/version requires it and you can demonstrate that authorization flow. |
| `instagram_manage_comments` | Receives Instagram comment webhooks, records comments as lead messages, and supports comment replies and private replies. `InstagramPostCommentJob.php`, `LeadService.php` | **Justifiable for comment handling.** The code replies to comments; I did not find hide/delete moderation features. |
| `instagram_manage_messages` | Receives Instagram message webhooks and sends inbox replies/private replies. `InstagramMessageJob.php`, `LeadService.php` | **Justifiable for the current messaging flow.** As with Facebook messages, incoming non-text messages are skipped. |
| `public_profile` | OAuth calls `/me` for the user’s ID, name, email, and profile picture; these values are saved on the connected social account. `FacebookService.php` | **Justifiable for connecting and identifying the account.** |
| `email` (in the attachment, not your permission list) | `email` is requested and the `/me` response email is saved on the social account. `config/services.php`, `FacebookService.php` | The code supports retrieving and storing it, but the repository does not establish a broader use for it. Only claim the use you can show in the product. |

One implementation detail to verify before submitting: there are **two scope lists**. The main `FacebookService` OAuth flow uses `config/services.php`, while `FacebookAppSettings.php` has a separate, older Facebook-login scope list that does not include the Instagram scopes. Confirm which flow is live and make the App Review request match it.

## Attached question list

`meta-questions.md` starts at question **2** (`pages_manage_metadata`), so question 1 is missing. It is **likely** the `pages_show_list` question based on the permissions you listed, but check the Meta form rather than assuming. The attachment also includes an `email` question that wasn’t in your permission list.

For description questions, these are concise drafts grounded in the implementation:

- **Pages list:** “Users connect a Facebook Page to a dealership branch in DealerCore. We retrieve the Pages available to the authorizing user so they can select which Page to connect.”
- **Facebook messages:** “DealerCore receives text messages sent to a connected dealership Page, creates or updates the customer conversation and lead in the DealerCore inbox, and lets authorized dealership staff reply from that inbox.”
- **Instagram account/basic:** “When a user connects a Facebook Page, DealerCore detects its linked Instagram Business account and saves its profile details so the user can select and connect it for dealership workflows.”
- **Instagram publishing:** “Dealership staff publish vehicle photos and videos from DealerCore to a connected Instagram Business account. DealerCore creates the media container and publishes the resulting post.”
- **Page engagement/comments:** “DealerCore receives comments on supported dealership vehicle posts and records them as customer inquiries/leads for dealership staff to manage.” Avoid saying the app reads Page analytics or historical engagement unless another verified workflow does that.
- **Instagram comments:** “DealerCore receives comments on supported vehicle posts, adds them to the customer inbox/lead workflow, and lets staff reply to comments or send a private reply.”
- **Instagram messages:** “DealerCore receives text direct messages sent to a connected dealership Instagram account, records them in the customer inbox/lead workflow, and lets authorized staff reply from DealerCore.”
- **Public profile:** “DealerCore uses the authorizing user’s basic profile information to identify and save the connected account.”
- **Email:** “DealerCore requests the account email when available and saves it with the connected social account.” Use that only if it accurately describes the user-visible purpose.

For `pages_manage_metadata`, `business_management`, and the two `instagram_business_*` permissions, I would **not submit a positive usage claim based on this code alone**. The implementation evidence is absent or the permission name is not part of the configured flow.

## Screencast and reproduction evidence

For the relevant permissions, a useful end-to-end screencast would show:

1. In DealerCore, open social connections, start a Facebook/Instagram connection, authorize it, and select a Page/Instagram account and dealership branch.
2. Publish a vehicle post to the connected Page or Instagram account.
3. From a separate test account, send a text DM or comment on a supported post.
4. Show the received item in the DealerCore inbox, then reply and show the reply on the originating platform.

For the messaging reproduction instructions, include the test Page/account, test user, exact action (send a DM or comment), where the reviewer sees the resulting inbox item, and how they send a reply. Ensure the relevant webhooks are enabled for the test assets. The repository confirms receiver routes and Graph API operations, but it **cannot confirm that required Meta API test calls have been performed**; that must be verified in your App Dashboard/test run.





### API Testing


pages_manage_metadata
pages_read_engagement
public_profile
pages_messaging
instagram_manage_messages
pages_show_list
instagram_basic
business_management
instagram_business_manage_messages
instagram_business_basic
instagram_manage_comments
instagram_content_publish