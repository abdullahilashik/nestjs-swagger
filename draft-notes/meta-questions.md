# Meta App Review responses — draft

These are evidence-based drafts, not a guarantee of approval. Meta makes the review decision, and approval depends on the submitted app configuration, reviewer access, screencast, test assets, and current platform requirements. Do not state that a test, screencast, or setup step is complete until it has actually been completed.

The supplied question list starts at question 2 and does not include a `pages_show_list` question. A draft for it is included below as question 1 because it is in the requested permissions list.

## 1. How will this app use `pages_show_list`?

**Describe how your app uses this permission or feature**

DealerCore lets an authorized dealership user connect a Facebook Page to a dealership branch. After the user authorizes Facebook, DealerCore retrieves the Pages available to that user and displays them so the user can connect the appropriate Page. DealerCore stores the selected Page and uses it for the dealership's configured publishing and customer-message workflows.

**Screencast**

Record the user opening DealerCore's social connections, choosing Facebook Page, completing Facebook authorization, and seeing the available Pages to connect. Show the selected Page associated with the appropriate dealership branch.

**API test calls**

Before submission, test the authorization and Page-list flow using a reviewer-accessible test user and Page. Capture the successful `/me/accounts` result and verify that the expected Page appears in DealerCore. Do not mark this step complete until tested.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 2. How will this app use `pages_manage_metadata`?

**Describe how your app uses this permission or feature**

The repository contains Facebook webhook receiver endpoints for Page message and comment events. However, the reviewed code does not show DealerCore subscribing a Page to webhooks or changing Page settings through the Graph API. On this evidence, we cannot claim that DealerCore currently uses `pages_manage_metadata`. Do not request this permission for this submission unless the deployed app has a separate, verifiable Page-subscription flow. If it does, update this response to describe that actual flow and show it in the screencast.

**Screencast**

Only if the deployed product actually uses this permission: show the specific user action that configures or subscribes the connected Page, then show the resulting working webhook event. Do not show Meta App Dashboard setup as if it were a DealerCore feature.

**API test calls**

Only if requesting this permission: perform and capture the relevant Page subscription/metadata API call on a test Page, and confirm the corresponding webhook reaches DealerCore. The repository alone does not demonstrate that this call is made.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 3. How will this app use `pages_messaging`?

**Describe how your app uses this permission or feature**

DealerCore receives text messages sent to a connected dealership Facebook Page and adds them to the dealership's customer inbox and lead workflow. Authorized dealership staff can reply from DealerCore; the reply is sent as the connected Page. Messages without text, such as unsupported sticker or image-only events, are not processed by the current inbound handler.

**Screencast**

Show the Facebook Page connected in DealerCore, send a text message to that Page from a separate test account, show the message arriving in the DealerCore inbox, and reply from DealerCore. Show the reply arriving in Messenger for the test account.

**API test calls**

Before submission, test the full inbound webhook and outbound reply flow with reviewer-accessible test assets. Do not mark this complete until both receipt and reply have been verified.

**Instructions to reproduce**

1. Sign in to the DealerCore test account and connect the reviewer-provided Facebook Page under Social connections.
2. Associate the Page with the test dealership branch.
3. From the separate test Facebook user, send a text message to the connected Page.
4. In DealerCore, open the associated branch's inbox and open the new Facebook conversation.
5. Reply from the conversation and verify that the test Facebook user receives the response in Messenger.

Provide the reviewer with access to the test DealerCore account, test Page, and test user through Meta's approved review-access process. Replace these generic instructions with the exact menu names and access details for the review environment.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and messaging requirements.

## 4. How will this app use `business_management`?

**Describe how your app uses this permission or feature**

The reviewed repository does not show DealerCore calling Business Manager APIs to list or manage business portfolios, ad accounts, or other business assets. DealerCore discovers Pages through the user's `/me/accounts` connection flow and discovers an Instagram account linked to a Page. Those code paths do not demonstrate a need for `business_management`. Do not request this permission unless a separate deployed feature genuinely uses it and can be demonstrated to the reviewer.

**Screencast**

There is no repository-evidenced DealerCore flow to record for this permission. If another deployed feature uses it, show that specific feature and how the user benefits from it.

**API test calls**

Do not claim a Business Manager API test was performed unless the app actually makes and passes the relevant call in the review environment.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 5. How will this app use `pages_read_engagement`?

**Describe how your app uses this permission or feature**

DealerCore uses Facebook Page comment webhook events associated with supported dealership vehicle posts to create or update a customer conversation and lead in the DealerCore inbox. Dealership staff can then manage the inquiry and reply to the comment from DealerCore. The reviewed code does not demonstrate reading historical Page posts, reactions, likes, or Page analytics, so this request should be described narrowly as handling comments on supported posts.

**Screencast**

Show a supported vehicle post on the connected test Page, add a comment from a separate test account, show the comment appearing in the correct DealerCore inbox/lead, and reply to the comment from DealerCore.

**API test calls**

Before submission, verify the test Page's comment webhook reaches DealerCore and that a reply succeeds. Do not mark this complete until tested.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 6. How will this app use `instagram_content_publish`?

**Describe how your app uses this permission or feature**

DealerCore lets dealership staff publish vehicle listings to an Instagram account which is connected to a Facebook Page. For a selected vehicle, DealerCore prepares the caption and eligible images or videos, creates the required Instagram media container, and publishes the resulting media to the connected account. The current implementation supports single-media posts and carousels.

**Screencast**

Show the connected Instagram account, select a vehicle in DealerCore, initiate publishing, show the successful publish status, and verify the resulting post on the test Instagram account.

**API test calls**

Before submission, publish a test image or video (and a carousel if that use is part of the review request) to a reviewer-accessible test account. Verify the API result and the post on Instagram. Do not state that these tests are complete until performed.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and content-publishing requirements.

## 7. How will this app use `instagram_basic`?

**Describe how your app uses this permission or feature**

When a user connects Facebook in DealerCore, the app checks for an Instagram Business account linked to each accessible Page and retrieves basic account details, including its name, username, and profile picture. DealerCore stores those details so the user can identify and connect the correct Instagram account to a dealership branch. Instagram account details are also used in the connected account's messaging and comment workflows.

**Screencast**

Show Facebook authorization, the linked Instagram Business account appearing in DealerCore's connection flow, and the account being associated with a dealership branch.

**API test calls**

Before submission, test discovery and retrieval of basic profile details for a reviewer-accessible Instagram Business account linked to the test Page. Do not mark this complete until tested.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 8. How will this app use `instagram_business_basic`?

**Describe how your app uses this permission or feature**

The reviewed OAuth configuration requests `instagram_basic`; it does not separately request `instagram_business_basic`, and the repository does not demonstrate a distinct flow using this permission name. The current connection flow discovers an Instagram Business account linked to a Facebook Page and retrieves basic account profile details. Do not claim that DealerCore uses this separate permission unless the deployed Meta configuration and review flow specifically require and use it.

**Screencast**

If Meta requires this permission for the actual deployed flow, show the Instagram account discovery and profile-details flow described above, and ensure the permission name/product in the submitted configuration matches the feature being demonstrated.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 9. How will this app use `instagram_business_manage_messages`?

**Describe how your app uses this permission or feature**

The reviewed OAuth configuration requests `instagram_manage_messages`, not `instagram_business_manage_messages`. DealerCore's current Instagram inbox flow receives text direct-message webhook events for a connected Instagram account, creates or updates the customer conversation in DealerCore, and allows dealership staff to reply from the inbox. The repository does not demonstrate a separate authorization flow using the `instagram_business_manage_messages` permission name. Do not claim this separate permission is used unless the deployed Meta configuration requires it and the reviewer can verify that flow.

**Screencast**

For the implemented messaging flow, show a text DM sent to the connected test Instagram account, its arrival in the DealerCore inbox, and a staff reply arriving in Instagram. If requesting this distinct permission, make sure the displayed authorization flow actually includes it.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and messaging requirements.

## 10. How will this app use `instagram_manage_comments`?

**Describe how your app uses this permission or feature**

DealerCore receives comment events on supported vehicle posts published by a connected Instagram account and records them in the related customer inbox and lead workflow. Authorized dealership staff can reply to the comment or send a private reply from DealerCore. The reviewed code demonstrates replies; it does not demonstrate hiding or deleting comments.

**Screencast**

Show a supported vehicle post on the test Instagram account, comment on it from a separate test account, show the comment in the DealerCore inbox, and reply from DealerCore. If demonstrating a private reply, show it arriving in the test user's Instagram messages.

**API test calls**

Before submission, verify that the test comment webhook reaches DealerCore and that the intended public or private reply succeeds. Do not mark this complete until tested.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and comment-management requirements.

## 11. How will this app use `instagram_manage_messages`?

**Describe how your app uses this permission or feature**

DealerCore receives text direct messages sent to a connected dealership Instagram account and records them in the DealerCore customer inbox and lead workflow. Authorized dealership staff can reply from DealerCore, and the response is sent through the connected Instagram account. The current inbound handler does not process messages without text.

**Screencast**

Show the test Instagram account connected to a DealerCore branch, send a text DM from a separate test account, show the conversation arriving in DealerCore, reply from DealerCore, and verify receipt in Instagram.

**Allowed usage**

Agree in Meta only if the app and its operators will comply with Meta's allowed usage and messaging requirements.

## 12. How will this app use `public_profile`?

The OAuth flow requests the authorizing user's Facebook ID, name, and profile picture to identify and display the connected social account in DealerCore. Select Meta's agreement only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## 13. How will this app use `email`?

The OAuth flow requests the account email when Facebook makes it available, and DealerCore stores the returned email on the connected social account. Do not imply that an email is always returned. Request this permission only if storing this account email is needed for the user-facing connection workflow. Select Meta's agreement only if the app and its operators will comply with Meta's allowed usage and data-handling requirements.

## Submission checks

- The reviewed code has a separate legacy scope list in `app/Models/FacebookAppSettings.php`; confirm which OAuth flow is deployed and make the Meta permission request match it.
- The reviewed repository does not evidence app usage for `pages_manage_metadata` or `business_management`, nor distinct configured flows for `instagram_business_basic` or `instagram_business_manage_messages`. Confirm with the deployed app and Meta dashboard; remove permissions that are not needed.
- The code supports comment/message webhook receivers, but the repository does not prove that webhook subscriptions are configured for the review assets. Verify subscriptions and delivery before recording the screencast.
- Upload a real end-to-end screencast and complete Meta's requested API tests before representing those checklist items as done.
- Give reviewers working access to the test DealerCore account and test Facebook/Instagram assets using Meta's approved review-access process.
