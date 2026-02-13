import { db } from "../src/lib/db";
import { initializeSearchIndexes, syncArticleInSearch, indexAuthor } from "../src/lib/search";

async function main() {
  console.log("Initializing search indexes...");
  await initializeSearchIndexes();

  // Backfill articles
  const articles = await db.article.findMany({
    select: { id: true },
  });

  console.log(`Syncing ${articles.length} articles...`);
  for (const article of articles) {
    await syncArticleInSearch(article.id);
  }

  // Backfill authors
  const profiles = await db.journalistProfile.findMany({
    include: { user: { select: { id: true } } },
  });

  console.log(`Syncing ${profiles.length} authors...`);
  for (const profile of profiles) {
    await indexAuthor({
      id: profile.userId,
      pseudonym: profile.pseudonym,
      bio: profile.bio,
      beats: profile.beats,
      verificationStatus: profile.verificationStatus,
      reputationScore: profile.reputationScore,
      articleCount: profile.articleCount,
    });
  }

  console.log("Search backfill complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
