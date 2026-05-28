# Mobile Access Troubleshooting Guide

## Issue: Cannot Access Mobile App from Phone

The Vite dev server is running correctly on port 5173 and listening on all network interfaces (0.0.0.0), but Windows Firewall is likely blocking incoming connections.

## Current Network Configuration

- **WiFi IP**: 172.17.9.253
- **Virtual Ethernet IP**: 172.26.80.1
- **Port**: 5173
- **Server Status**: ✅ Running and listening on all interfaces

## Solution: Add Windows Firewall Rule

### Option 1: Using Windows Firewall GUI (Recommended)

1. **Open Windows Defender Firewall**
   - Press `Win + R`
   - Type `wf.msc` and press Enter

2. **Create Inbound Rule**
   - Click on "Inbound Rules" in the left panel
   - Click "New Rule..." in the right panel
   - Select "Port" and click Next
   - Select "TCP" and enter "5173" in Specific local ports
   - Click Next
   - Select "Allow the connection"
   - Click Next
   - Check all profiles (Domain, Private, Public)
   - Click Next
   - Name it "Vite Dev Server 5173"
   - Click Finish

3. **Repeat for Port 3000 (Backend Server)**
   - Follow the same steps but use port "3000"
   - Name it "Node.js Backend Server 3000"

### Option 2: Using Command Prompt (Run as Administrator)

1. **Open Command Prompt as Administrator**
   - Press `Win + X`
   - Select "Command Prompt (Admin)" or "Windows PowerShell (Admin)"

2. **Run these commands:**

```cmd
netsh advfirewall firewall add rule name="Vite Dev Server 5173" dir=in action=allow protocol=TCP localport=5173

netsh advfirewall firewall add rule name="Node.js Backend Server 3000" dir=in action=allow protocol=TCP localport=3000

netsh advfirewall firewall add rule name="Vite Dev Server 5174" dir=in action=allow protocol=TCP localport=5174
```

### Option 3: Temporarily Disable Firewall (Not Recommended for Security)

**Only for testing purposes:**

1. Open Windows Security
2. Go to Firewall & network protection
3. Click on your active network (Private network)
4. Turn off Windows Defender Firewall
5. Try accessing the app from mobile
6. **Remember to turn it back on after testing!**

## Verify the Fix

After adding the firewall rules, test the connection:

### From Your Computer:

```bash
# Test if the server is accessible locally
curl http://localhost:5173
```

### From Your Mobile Device:

1. **Ensure both devices are on the same WiFi network**
2. **Open your mobile browser and try:**
   - http://172.17.9.253:5173/
   - If that doesn't work, try: http://172.26.80.1:5173/

## Additional Troubleshooting Steps

### 1. Check if Both Devices are on Same Network

- Your computer and phone must be connected to the **same WiFi network**
- Some networks have "AP Isolation" enabled which prevents devices from communicating
- Try using a personal hotspot if on a corporate/school network

### 2. Check Antivirus Software

- Some antivirus software (Norton, McAfee, Kaspersky) may block network connections
- Temporarily disable antivirus to test
- Add exceptions for Node.js and Vite if needed

### 3. Verify Server is Running

Check the terminal output shows:
```
➜  Local:   http://localhost:5173/
➜  Network: http://172.17.9.253:5173/
➜  Network: http://172.26.80.1:5173/
```

### 4. Try Different Network Interface

If 172.17.9.253 doesn't work, try:
- http://172.26.80.1:5173/

### 5. Check Router Settings

Some routers have "Client Isolation" or "AP Isolation" enabled:
- Log into your router admin panel
- Look for "Wireless Settings" or "Advanced Settings"
- Disable "AP Isolation" or "Client Isolation"

### 6. Use QR Code for Easy Access

You can generate a QR code for the URL:
- Go to: https://www.qr-code-generator.com/
- Enter: http://172.17.9.253:5173/
- Scan with your phone's camera

## Testing Checklist

- [ ] Windows Firewall rules added for ports 3000, 5173, 5174
- [ ] Both devices on same WiFi network
- [ ] Server is running (check terminal output)
- [ ] Antivirus not blocking connections
- [ ] Router AP Isolation is disabled
- [ ] Tried both IP addresses (172.17.9.253 and 172.26.80.1)

## Alternative: Use Tunneling Service

If firewall/network issues persist, use a tunneling service:

### Using ngrok (Free):

1. **Install ngrok**: https://ngrok.com/download
2. **Run ngrok**:
   ```bash
   ngrok http 5173
   ```
3. **Use the provided URL** (e.g., https://abc123.ngrok.io) on your mobile device

### Using localtunnel (Free):

1. **Install**:
   ```bash
   npm install -g localtunnel
   ```
2. **Run**:
   ```bash
   lt --port 5173
   ```
3. **Use the provided URL** on your mobile device

## Current Server Status

✅ Backend Server: Running on port 3000
✅ Citizen App: Running on port 5173 (listening on all interfaces)
✅ Dashboard: Running on port 5174

## Mobile Access URLs

Once firewall is configured:
- **Citizen App**: http://172.17.9.253:5173/
- **Alternative**: http://172.26.80.1:5173/
- **Backend API**: http://172.17.9.253:3000/

## Need More Help?

If you're still unable to connect after trying these steps:

1. Check if you're on a corporate/school network (these often block device-to-device communication)
2. Try creating a mobile hotspot from your phone and connecting your computer to it
3. Use a tunneling service like ngrok as mentioned above
4. Check if your network has a "Guest Network" - don't use it, use the main network

## Security Note

After development is complete, remember to:
- Remove the firewall rules if no longer needed
- Don't expose development servers to public networks
- Use proper authentication and HTTPS in production
