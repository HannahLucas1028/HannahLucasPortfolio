// migrateData.js
// Run this with: node migrateData.js
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// You will need to download your service account key from Firebase Settings -> Service Accounts -> Generate new private key
// and save it as 'serviceAccountKey.json' in this folder before running this script.

let serviceAccount;
try {
    serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
} catch (e) {
    console.error("Please download your serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts.");
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const journeyChapters = [
    {
        order: 1,
        eyebrow: "Born with it.",
        headline: "I don't walk in. <br>I arrive.",
        body: "Some people learn leadership later.<br>I came out with it installed.<br>I've always had the nerve, the vision, and the heart to do something about what I see.",
        pullquote: "\"Presence isn't a personality trait. It's a <span class='tooltip-trigger hover-chrome'>responsibility<span class='tooltip-text'>Meaning: I don't play small when people need big.</span></span>.\"",
        microCta: "Next: the first time I proved it. &darr;"
    },
    {
        order: 2,
        eyebrow: "2010",
        headline: "I was in 4th grade. <br>I still led nationwide.",
        body: "When the Haiti earthquake hit, I watched the news and refused to stay helpless.<br>I created <em>Hannah Helps Haiti</em>&mdash;a nationwide blanket drive with a goal of <strong class='text-glow'>10,000 blankets</strong>.<br>I didn't have a title. I had purpose. That was enough.",
        impactLine: "I turned heartbreak into action&mdash;and built my first movement.",
        buttonAction: "receipt-modal-1"
    },
    {
        order: 3,
        eyebrow: "The pressure",
        headline: "My life got hard. <br>I got smarter.",
        body: "Later, a chronic illness diagnosis changed my world.<br>Fear got loud. Anxiety followed. Depression tried to move in.<br>And I learned something brutal: sometimes you don't have the words when you need help most.",
        impactLine: "I wished for a button I could press to say: I'm not okay.",
        transitionLine: "So I built it. &darr;"
    },
    {
        order: 4,
        eyebrow: "notOK",
        headline: "I turned a wish into a tool <br>that saves lives.",
        body: "notOK started as a simple idea: make reaching out easier than suffering in silence.<br>A single tap alerts your trusted contacts when you need help&mdash;fast, direct, and human.<br>I didn't create it to look inspiring. I created it to be useful. And it worked.",
        features: [
            { title: "One tap", text: "Support should move at the speed of panic." },
            { title: "Trusted contacts", text: "Because your people matter most in the moment." },
            { title: "Designed for real life", text: "No lectures. No shame. Just connection." }
        ],
        hasDemo: true,
        proofLine: "Media outlets covered the origin because it was real&mdash;and because it met a real need.",
        tertiaryLink: { text: "SEE MEDIA RECEIPTS &rarr;", href: "#receipts" }
    },
    {
        order: 5,
        eyebrow: "Visibility",
        headline: "When you build something that matters, <br>people pay attention.",
        body: "My work and story reached national audiences through major outlets and platforms.<br>Not because I chased attention&mdash;because the mission demanded it.<br>Visibility became fuel, and I used it to scale impact.",
        mediaCarousel: [
            { tag: "TV", title: "Good Morning America", desc: "On building notOK app", btnText: "Watch" },
            { tag: "Print", title: "Teen Vogue", desc: "21 Under 21 Feature", btnText: "Read" },
            { tag: "Digital", title: "Forbes", desc: "Tech Innovation Profile", btnText: "Read" }
        ],
        transitionLine: "And then the world changed. So I did what I always do. &darr;"
    },
    {
        order: 6,
        eyebrow: "2020",
        headline: "My senior prom and graduation got canceled. <br>Two weeks later, I raised $50K+.",
        body: "COVID didn't just cancel events. It stole milestones, connection, and stability from an entire generation.<br>My own senior prom and high school graduation disappeared overnight.<br>So I built a replacement with meaning&mdash;and I made it pay people, not just entertain them.",
        impactLineHtml: "Within <strong>two weeks</strong>, I created <em>We Are Well Prom</em> and raised <strong class='text-glow'>$50,000+</strong>&mdash;then gave it back as <strong>cash grants and scholarships</strong> for high school students.",
        subheadAlt: "I didn't let a global atrocity define us. I answered it.",
        grantWall: ["Cash Grants", "Scholarships", "Relief for students", "Proof of distribution"],
        cta: { text: "PARTNER WITH ME", href: "#impact" }
    },
    {
        order: 7,
        eyebrow: "Leadership",
        headline: "I don't just speak. <br>I shift people.",
        body: "I've led across platforms&mdash;from advisory spaces to stages to rooms where decisions get made.<br>I show up with proof, clarity, and a mission people can feel.<br>I don't perform inspiration. I deliver it&mdash;with strategy.",
        speakingTopics: [
            { title: "Crisis &rarr; Creation", text: "How to build solutions under pressure." },
            { title: "Mental health without shame", text: "Language that saves lives." },
            { title: "Tech for good that actually works", text: "Design for humans, not headlines." },
            { title: "Youth leadership with teeth", text: "How to lead before you're invited." }
        ],
        bookTheme: {
            headline: "I don't know every detail of my future. <br>I know the ending.",
            body: "I'm building toward something bigger than a job title.<br>I'm building legacy.<br>And one thing stays certain: I'm going to completely change the world.",
            powerQuote: "\"At my core, I am and have always been a bright light—charismatic, charming, and future-forward. My energy, genius, and compassion are irreplaceable. I don't just inspire people; I re-energize everyone who comes into contact with me. I empower them to speak openly about their struggles while strengthening them to conquer those struggles at the same time.\""
        }
    }
];

const receipts = [
    { category: "tech", stamp: "BUILT", title: "notOK App", text: "A crisis-support tool for immediate help.", btn: "Open", order: 1 },
    { category: "fundraising", stamp: "FUNDED", title: "We Are Well Prom", text: "$50,000+ raised in 14 days.", btn: "Read", order: 2 },
    { category: "media", stamp: "FEATURED", title: "Forbes", text: "Profile on Tech Innovation.", btn: "View mention", order: 3 },
    { category: "community", stamp: "VERIFIED", title: "Hannah Helps Haiti", text: "Nationwide blanket drive.", btn: "Read", order: 4 },
    { category: "speaking", stamp: "SPOKE", title: "Keynote: Crisis &rarr; Creation", text: "Delivered to 5,000+ attendees.", btn: "Watch", order: 5 },
    { category: "awards", stamp: "AWARDED", title: "Youth Leadership Award", text: "Recognized for mental health advocacy.", btn: "View credential", order: 6 }
];

async function migrate() {
    console.log("Starting migration to Firestore...");

    const batch = db.batch();

    // Migrate Chapters
    journeyChapters.forEach((chapter) => {
        const docRef = db.collection('chapters').doc(`ch-${chapter.order}`);
        batch.set(docRef, chapter);
    });

    // Migrate Receipts
    receipts.forEach((receipt, index) => {
        const docRef = db.collection('receipts').doc(`receipt-${index + 1}`);
        batch.set(docRef, receipt);
    });

    await batch.commit();
    console.log("Migration complete!");
}

migrate().catch(console.error);
