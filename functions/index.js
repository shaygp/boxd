const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.secretSantaOG = functions.https.onRequest(async (req, res) => {
  // Extract gift ID from path: /secret-santa/gift/ABC123
  const path = req.path;
  const giftId = path.split('/').pop();

  if (!giftId) {
    res.status(404).send('Not Found');
    return;
  }

  try {
    // Fetch submission from Firestore
    const submissionDoc = await admin.firestore()
      .collection('secretSantaSubmissions')
      .doc(giftId)
      .get();

    if (!submissionDoc.exists) {
      res.status(404).send('Gift not found');
      return;
    }

    const submission = submissionDoc.data();

    // Generate HTML with proper OG tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>🎁 F1 Secret Santa 2026</title>
    <meta name="description" content="${submission.userName} just gifted ${submission.giftTitle} to ${submission.assignedDriver} on @Box_Boxd!">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://boxboxd.fun/secret-santa/gift/${giftId}">
    <meta property="og:title" content="🎁 F1 Secret Santa 2026">
    <meta property="og:description" content="${submission.userName} just gifted ${submission.giftTitle} to ${submission.assignedDriver} on @Box_Boxd!">
    <meta property="og:image" content="${submission.giftImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="BoxBoxd">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@Box_Boxd">
    <meta name="twitter:title" content="🎁 F1 Secret Santa 2026">
    <meta name="twitter:description" content="${submission.userName} just gifted ${submission.giftTitle} to ${submission.assignedDriver} on @Box_Boxd!">
    <meta name="twitter:image" content="${submission.giftImageUrl}">

    <!-- Redirect to React app after meta tags are read -->
    <meta http-equiv="refresh" content="0;url=https://boxboxd.fun/secret-santa/gift/${giftId}">

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-center;
            min-height: 100vh;
            text-align: center;
        }
        .loading {
            font-size: 24px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="loading">Loading Secret Santa Gift...</div>
    <script>
        // Fallback redirect if meta refresh doesn't work
        setTimeout(() => {
            window.location.href = 'https://boxboxd.fun/secret-santa/gift/${giftId}';
        }, 100);
    </script>
</body>
</html>
`;

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching gift:', error);
    res.status(500).send('Internal Server Error');
  }
});
