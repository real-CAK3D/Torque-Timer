// Generates the keys that let the site send phone notifications.
// Run: npm run vapid   then paste the output into Vercel > Settings > Environment Variables.
import webpush from "web-push";
const keys = webpush.generateVAPIDKeys();
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
