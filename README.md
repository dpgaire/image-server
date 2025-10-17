
# Turn Your GitHub Repo into a Free File Server!

Hey everyone! Ever been working on a project and just needed a quick and easy way to store some images or files? Maybe for a portfolio, a small web app, or even just to share things with friends? I know I have. And while services like AWS S3 or Google Cloud Storage are super powerful, they can sometimes feel like using a sledgehammer to crack a nut. Plus, they usually come with a price tag.

Well, what if I told you that you could use something you already have – a GitHub repository – as your own personal file server? For free! That's exactly what I built with this fun little project I'm calling the "File Server".

## What's the Big Idea?

The concept is pretty simple: it's a single web page that gives you a nice, clean interface to manage files in a GitHub repository. You can create folders, upload files, delete things, and get a direct link to any file you've uploaded. All from one spot, without having to mess with `git` commands or navigate through the GitHub website.

## How the Magic Happens

This whole thing is built with the classic trio: HTML, CSS, and JavaScript. There's no big, complicated backend server. Instead, it uses the **GitHub API**. Think of the API as a set of rules that lets our little web app talk to GitHub and ask it to do things, like "Hey, please create a folder named 'images'" or "Can you upload this file for me?".

## Your Step-by-Step Guide to Becoming a File Master

Ready to give it a whirl? It's super easy. Here's how you can get started:

### Step 1: Get Your Secret Key (A GitHub Token)

First things first, you need a way to prove to GitHub that you are who you say you are. For that, we use a **Personal Access Token**. It's like a password that you can create just for this app.

1.  Go to your GitHub settings. (Click your profile picture in the top-right corner, then "Settings").
2.  On the left-hand menu, scroll down and click on "Developer settings".
3.  Go to "Personal access tokens" -> "Tokens (classic)".
4.  Click "Generate new token" (and then "Generate new token (classic)").
5.  Give your token a name (like "FileServerApp").
6.  Under "Select scopes", check the box next to `repo`. This gives our app the permissions it needs to manage your files.
7.  Scroll down and click "Generate token".

**Important:** Copy this token and save it somewhere safe for a moment. Once you leave this page, you won't be able to see it again!

### Step 2: Fire up the File Server!

Now for the fun part.

1.  Open the `index.html` file from this project in your browser.
2.  You'll see a login screen. This is where you'll tell the app who you are and where you want to store your files.
    *   **GitHub Personal Access Token:** Paste the token you just created.
    *   **GitHub Repository:** Type in the repository you want to use, in the format `your-username/your-repo-name`. If the repo doesn't exist, go create a new one on GitHub first!
3.  Click the "Authenticate" button.

### Step 3: You're in! Time to Manage Some Files.

If everything went well, you'll now see the main file management screen. It's split into "Folders" and "Files".

*   **Creating Folders:** Just type a name in the "New folder name" box and click "Create". Easy peasy.
*   **Uploading Files:** Click the "Choose Files" button, select one or more files from your computer, and then hit "Upload". You'll see them pop up in the file list.
*   **Getting a File Link:** This is the best part. Next to each file, there's a "Copy Link" button. Click it, and you'll have a direct URL to your file that you can use anywhere on the web.
*   **Deleting Stuff:** See that little trash can icon next to a file or folder? Click it to delete. Be careful, though – it's gone for good!

## So, Why is This Cool?

*   **It's 100% free.** You're just using your existing GitHub account.
*   **It's super simple.** No command line, no complicated setup.
*   **It's great for:**
    *   Hosting images for your blog or portfolio.
    *   Quickly sharing project assets with a team.
    *   Prototyping small web projects.

## Go Ahead, Try It Out!

This was a really fun project to build, and I hope you find it useful. It's a great example of how you can use the power of APIs to create cool and helpful tools with just a little bit of code.

Feel free to check out the [project on GitHub](https://github.com/dpgaire/image-server) and play around with it. Let me know what you think!
