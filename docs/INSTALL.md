# Install Innkeep on your computer

_Version française : [INSTALLATION.fr.md](INSTALLATION.fr.md)_

This guide is for people who have never installed a program this way. No
technical knowledge is needed. Allow about 20 minutes the first time.

Innkeep has two parts: the app, which runs on your own computer, and a
**Chrome extension** that reads your own Airbnb and Booking.com pages. You
install both; steps 1 to 4 are the app, step 5 is the extension.

Innkeep runs on your own computer. Your reservations and prices stay in a
folder on that computer and are not sent to anyone.

> **Prefer to be guided by an AI assistant?** The home page of Innkeep (and of
> its website) has a ready-made request to copy into Claude, ChatGPT or
> another assistant. It installs Innkeep for you, or walks you through these
> same steps one at a time.

## What you need

- A Mac or a Windows computer.
- The Google Chrome browser (Edge, Brave and Arc work too).
- Your Airbnb and Booking.com host accounts.

## Step 1: install Node.js

Node.js is a free program that Innkeep needs in order to run. You install it
once and never open it yourself.

1. Go to <https://nodejs.org>.
2. Click the big download button (the version marked **LTS**).
3. Open the downloaded file and click **Continue** / **Next** until it says it
   is finished. Keep every proposed setting.

## Step 2: download Innkeep

1. Go to <https://github.com/jetaix/Innkeep>.
2. Click the green **Code** button, then **Download ZIP**.
3. Open the downloaded ZIP file. You get a folder called `Innkeep-main`.
4. Move that folder somewhere you will find it again, for example your
   **Documents** folder. Do not leave it in Downloads.

## Step 3: start Innkeep

Open the `Innkeep-main` folder.

**On a Mac:** double-click `start.command`.

- The first time, macOS may refuse because the file comes from the internet.
  In that case right-click the file (or hold Control and click), choose
  **Open**, then **Open** again.

**On Windows:** double-click `start.bat`.

- If a blue "Windows protected your PC" window appears, click **More info**,
  then **Run anyway**.

A black or white window with text opens. The first start takes a few minutes
while Innkeep prepares itself; later starts take a few seconds. When it is
ready, your browser opens on Innkeep by itself. If it does not, type this in
the address bar of your browser: `http://localhost:3000`

**Keep that text window open** for as long as you use Innkeep. Closing it
stops Innkeep. Your data is kept; start it again the same way.

## Step 4: add your place

1. In Innkeep, click **Properties** in the left menu, type a name for your
   place and click **Add property**.
2. On the page that opens, each platform has a box asking for its **calendar
   link**. To find the links:
   - **Airbnb:** Calendar → Availability → Connect calendars → _Export
     calendar_. Copy the link.
   - **Booking.com:** Extranet → Rates & Availability → Sync calendars →
     _Export_. Copy the link.
3. Paste each link into the matching box in Innkeep and click **Save Airbnb settings** (or **Save Booking.com settings**).

Your booked dates now appear in the **Calendar**.

> **To stop double bookings**, connect the two platforms to each other as
> well: in Airbnb's "Connect calendars" screen, import the Booking.com link;
> in Booking.com's "Sync calendars" screen, import the Airbnb link. Innkeep on
> your own computer cannot do this part for you, because the platforms cannot
> reach a program that only runs on your computer.

## Step 5: add the browser extension

Calendar links only contain dates. A small browser extension reads the rest
from your own Airbnb and Booking.com pages: guest names, payouts, prices,
reviews.

In Innkeep, click the button **Add the browser extension** at the bottom
right of the screen. It opens a guide with six short steps and a **Copy**
button for everything you need to paste. In short:

1. In Chrome, open the extensions page and switch on **Developer mode**.
2. Click **Load unpacked** and choose the `extension` folder inside
   `Innkeep-main`.
3. Click the puzzle-piece icon next to the address bar and pin Innkeep
   Companion, so its icon stays visible.
4. Click the Innkeep Companion icon, open **Settings**, paste the address and
   the token that Innkeep shows you, and click **Save and test**.

Then sign in to Airbnb and Booking.com in the same browser, come back to
Innkeep and click **Refresh everything**. One tab goes through your pages by
itself for a few minutes, then returns to Innkeep with your data.

## Using Innkeep day to day

- **To start:** double-click `start.command` (Mac) or `start.bat` (Windows).
- **To stop:** close the text window.
- **When you open it,** Innkeep tells you if your data is more than a day old
  and offers a **Refresh** button.
- **Language and dark mode:** bottom of the left menu.

## Optional: advice written by Claude

Innkeep can ask Claude, an AI assistant made by Anthropic, for advice based on
your own figures. This needs an Anthropic account and costs a few cents per
request. Click **Assistant** in the left menu and follow its three steps.

## Keeping your data safe

Everything Innkeep knows is in the `data` folder inside `Innkeep-main`.

- **To make a backup,** copy the `data` folder to a USB stick or a cloud drive.
- **Never delete** the `data` folder or the `.env.local` file unless you want
  to start again from nothing.

## Updating Innkeep

1. Close Innkeep (close the text window).
2. Download the new ZIP as in step 2 and open it.
3. Copy the `data` folder and the `.env.local` file from your old
   `Innkeep-main` folder into the new one. (`.env.local` may be hidden: on a
   Mac press Command + Shift + . in the Finder to show hidden files; on Windows
   tick **Hidden items** in the View menu.)
4. Start Innkeep from the new folder.
5. In Chrome's extensions page, remove the old Innkeep Companion and load the
   `extension` folder of the new version.

## If something goes wrong

| What you see                                            | What to do                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| "Innkeep needs Node.js"                                 | Do step 1, then start again.                                                                     |
| "Something is already running at http://localhost:3000" | Innkeep is probably already started: open that address in your browser.                          |
| The browser shows "This site can't be reached"          | The text window was closed. Start Innkeep again.                                                 |
| "That step failed" in the text window                   | Copy the text of the window and send it to the person who shared Innkeep with you.               |
| The Refresh run skips a platform                        | You are not signed in there. Sign in to Airbnb or Booking.com in the same browser and try again. |
| The extension button in Innkeep says "Update"           | In Chrome's extensions page, press the round arrow on Innkeep Companion.                         |

## What to know before you rely on it

- **Innkeep only works while your computer is on and its window is open.** It
  is a dashboard for you, not a service running day and night.
- **It cannot change anything on Airbnb or Booking.com.** Prices, listing
  texts and replies to guests are still changed on each platform.
- **Reading your pages with the extension is your decision.** Airbnb and
  Booking.com restrict automated collection of data in their terms. The
  extension only reads your own pages, in your own browser, when you ask.
- **There is no password on Innkeep unless you set one.** Anyone who can use
  your computer can open it. To reach it from your phone or share it with
  your partner, follow [DEPLOY.md](DEPLOY.md), which sets a password.
