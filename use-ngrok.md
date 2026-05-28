# Using ngrok for Mobile Access (No Firewall Changes Needed)

If you cannot modify Windows Firewall settings or are on a restricted network, use ngrok:

## Step 1: Install ngrok

1. Go to https://ngrok.com/download
2. Download ngrok for Windows
3. Extract the zip file
4. Move `ngrok.exe` to your project folder

## Step 2: Sign Up (Free)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Copy your authtoken from the dashboard

## Step 3: Configure ngrok

Open terminal and run:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

## Step 4: Start ngrok Tunnel

In a new terminal, run:
```bash
ngrok http 5173
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5173
```

## Step 5: Access from Mobile

Use the HTTPS URL provided by ngrok on your mobile device:
- Example: https://abc123.ngrok.io

## Benefits of ngrok

✅ No firewall configuration needed
✅ Works on any network (corporate, school, public)
✅ Provides HTTPS automatically
✅ Can share with anyone, anywhere
✅ Free tier available

## Note

- The free tier URL changes each time you restart ngrok
- The tunnel will stay active as long as ngrok is running
- You can also tunnel the backend server on port 3000 if needed

## For Backend API

If you need to access the backend API from mobile:
```bash
ngrok http 3000
```

Then update the API URLs in your mobile app to use the ngrok URL.
