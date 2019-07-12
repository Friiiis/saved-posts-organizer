# Changelog

## 1.1.6

Fixes bug where the extension would only load the first 25 saved links. The extension now fetches everything and displays the most recent saved links first. There may be a problem with a 1.000 links cap but this has not yet been reported.

If you save new posts or remove saved posts while the extension is open on your browser (e.g. saving a post on your phone), the extension will now dynamically show the updated content. Previously it would fetch the new dataset but not update the view until the user closed and reopened the popup.

## 1.1.5

1.1.4 only fixed the bug when displaying all posts. This update fixes the bug for all categories. 

Fixed some reduntant code.

## 1.1.4

Fixed a bug where links saved after the release of v1.1.3 would have "t3" (for posts) and "t1" (for comments) after their title.

## 1.1.3

Cleaned up a lot of duplicated and too complicated code.

Added icons locally.

Added "try again" button when fetching fails due to either bad connection or not being logged into reddit.

## 1.1.2

Fixed bug when removing posts from your reddit saved links.

Added [privacy policy](https://github.com/Friiiis/saved-posts-organizer/blob/master/privacypolicy.md).

## 1.1.1

Fixed bug that caused the app to not work at all for users that have saved comments (instead of only having saved posts). Thanks to GitHub user 19smitgr for the help.
It is now possible to see saved comments aswell. Saved comments will be shown as the title of the post the comment was made on, with a "(comment)" at the end.

Replaced some icons.

Fixed bug in permissions that made Chrome say, that the extension needs access to browser history.

## 1.0.0

Initial release
