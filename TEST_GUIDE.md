# Testing Guide for Bengaluru Road Reporter

## Quick Test Steps

### 1. Test EXIF Extraction

**With GPS Data:**
1. Open `bengaluru_road_reporter.html` in a browser
2. Take a photo with your phone (ensure location services are ON)
3. Upload the photo
4. ✅ **Expected:** Green badge shows "GPS detected" with coordinates

**Without GPS Data:**
1. Upload a screenshot or photo without GPS
2. ✅ **Expected:** Yellow badge shows "No GPS data — enter location"

### 2. Test Keyword Triage

**Test Case 1: Pothole Detection**
1. In the description field, type: "There is a big pothole here"
2. ✅ **Expected:** Issue type dropdown auto-selects "🕳️ Pothole"

**Test Case 2: Streetlight Detection**
1. Clear the form
2. Type: "The streetlight is broken"
3. ✅ **Expected:** Issue type auto-selects "💡 Broken streetlight"

**Test Case 3: Road Crack Detection**
1. Clear the form
2. Type: "Road has multiple cracks"
3. ✅ **Expected:** Issue type auto-selects "🔧 Road crack / damage"

### 3. Test Database Integration

**Prerequisites:**
- Ensure Supabase credentials are correct in the HTML file
- Database table `road_reports` must exist

**Test Steps:**
1. Fill out the complete form:
   - Upload a photo
   - Select issue type (or let keyword triage do it)
   - Add description: "Test pothole on MG Road"
   - Add location: "MG Road"
2. Click "Submit report"
3. ✅ **Expected:** 
   - Success toast appears: "Report submitted successfully!"
   - Form resets
   - Report appears in "My recent reports" section

**Verify in Database:**
```sql
SELECT * FROM road_reports ORDER BY created_at DESC LIMIT 1;
```

### 4. Test Live Map Sync

**Test Steps:**
1. Submit a report (as above)
2. Click "Official Dashboard" tab
3. ✅ **Expected:**
   - New marker appears on the map at the GPS coordinates
   - Marker color matches issue type (red for pothole, blue for streetlight, etc.)
   - Click marker to see popup with details
   - Map pans to the new marker location

**Test Filtering:**
1. Click "Potholes" filter button
2. ✅ **Expected:** Map shows only pothole markers (red dots)
3. Click "All issues"
4. ✅ **Expected:** All markers reappear

### 5. Test Complete User Flow

**Scenario: Citizen reports a pothole**

1. **Upload Photo**
   - Upload a geotagged photo of a pothole
   - Verify GPS coordinates are extracted

2. **Auto-Detection**
   - Type "pothole" in description
   - Verify issue type auto-selects

3. **Submit**
   - Click Submit
   - Verify success message

4. **Dashboard View**
   - Switch to Official Dashboard
   - Verify new marker appears
   - Click marker to see details

5. **Metrics Update**
   - Verify "Total reports" count increased
   - Verify "Potholes" count increased
   - Verify report appears in "Latest submissions" table

## Browser Console Tests

Open browser DevTools (F12) and run these commands:

### Test Keyword Triage Function
```javascript
// Should return 'pothole'
triageByKeywords('there is a big pothole here')

// Should return 'streetlight'
triageByKeywords('broken streetlight on main road')

// Should return 'road_crack'
triageByKeywords('road has cracks and damage')
```

### Test GPS Conversion
```javascript
// Test DMS to DD conversion
convertDMSToDD([12, 58, 32.52], 'N')  // Should return ~12.9757
convertDMSToDD([77, 36, 35.64], 'E')  // Should return ~77.6099
```

### Check Database Connection
```javascript
// Test Supabase connection
sbFetch('/rest/v1/road_reports?limit=1')
  .then(data => console.log('✅ Database connected:', data))
  .catch(err => console.error('❌ Database error:', err))
```

## Common Issues & Solutions

### Issue: GPS not detected from photo
**Solution:** 
- Ensure photo was taken with location services enabled
- Try a different photo app that embeds GPS data
- Use manual location input as fallback

### Issue: Keyword triage not working
**Solution:**
- Check browser console for errors
- Verify `KEYWORD_TO_CATEGORY` object is loaded
- Try typing keywords in lowercase

### Issue: Database save fails
**Solution:**
- Check Supabase credentials in code
- Verify table `road_reports` exists
- Check browser console for error messages
- Verify Supabase project is active

### Issue: Map not showing markers
**Solution:**
- Ensure Leaflet.js loaded correctly
- Check that reports have valid lat/lng values
- Try clicking "Refresh" button on dashboard
- Check browser console for JavaScript errors

## Performance Tests

### Load Test
1. Submit 10 reports in quick succession
2. ✅ **Expected:** All reports save successfully
3. Switch to dashboard
4. ✅ **Expected:** All 10 markers appear on map

### Filter Performance
1. Create reports of different types (5 potholes, 3 streetlights, 2 cracks)
2. Test each filter button
3. ✅ **Expected:** Map updates instantly, correct markers shown

## Mobile Testing

### iOS Safari
- [ ] Photo upload works
- [ ] GPS extraction works
- [ ] Form is responsive
- [ ] Map is interactive

### Android Chrome
- [ ] Photo upload works
- [ ] GPS extraction works
- [ ] Form is responsive
- [ ] Map is interactive

## Accessibility Tests

- [ ] All images have alt text
- [ ] Form labels are properly associated
- [ ] Keyboard navigation works
- [ ] Screen reader announces status messages
- [ ] Color contrast meets WCAG standards

## Security Tests

- [ ] SQL injection: Try entering `'; DROP TABLE road_reports; --` in description
- [ ] XSS: Try entering `<script>alert('xss')</script>` in description
- [ ] File upload: Try uploading non-image files
- [ ] API key: Verify Supabase key is anon key (not service key)

## Success Criteria

✅ All features working:
- [x] EXIF extraction with exif-js
- [x] Keyword triage auto-detection
- [x] PostgreSQL database integration
- [x] Live map synchronization

✅ User experience:
- Form is intuitive
- Feedback is immediate
- Errors are handled gracefully
- Mobile-friendly

✅ Code quality:
- No console errors
- Proper error handling
- Clean commit history
- Documentation complete

## Next Steps After Testing

1. Deploy to production server
2. Set up monitoring/analytics
3. Gather user feedback
4. Plan next iteration of features

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all dependencies loaded (Leaflet, exif-js)
3. Test with different browsers
4. Check Supabase dashboard for API logs
