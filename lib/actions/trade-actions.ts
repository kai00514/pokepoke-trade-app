// lib/actions/trade-actions.ts

export const getTradePostsWithCards = async (userId: string) => {
  // Fetch trade posts for the user
  const tradePosts = await fetchTradePosts(userId)

  // Process each trade post
  const processedTradePosts = tradePosts.map((post) => {
    const createdAt = new Date(post.createdAt)
    const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
      2,
      "0",
    )}/${String(createdAt.getDate()).padStart(2, "0")} ${String(createdAt.getHours()).padStart(
      2,
      "0",
    )}:${String(createdAt.getMinutes()).padStart(2, "0")}`

    // Return the processed post
    return {
      ...post,
      formattedDate,
    }
  })

  // Return the processed trade posts
  return processedTradePosts
}

// Helper function to fetch trade posts
const fetchTradePosts = async (userId: string) => {
  // Simulate fetching trade posts from a database
  return [
    { id: 1, createdAt: new Date("2023-10-01T12:30:00Z") },
    { id: 2, createdAt: new Date("2023-10-02T14:45:00Z") },
  ]
}
