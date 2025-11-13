import type { Metadata } from "next"
import CollagePageClient from "./collage-page-client"
import { getCollageById } from "@/lib/actions/collages"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const collageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/collages/${params.id}`
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/collages/${params.id}/opengraph-image`

  // Fetch collage data for dynamic metadata
  const result = await getCollageById(params.id)

  if (!result.success || !result.collage) {
    return {
      title: "コラージュ - PokeLink",
      description: "ポケモンカードのコラージュ画像",
    }
  }

  const { collage } = result
  const title = `${collage.title1} / ${collage.title2} | PokeLink`
  const description = `${collage.title1}: ${collage.cards1.length}枚 / ${collage.title2}: ${collage.cards2.length}枚のコラージュ`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: collageUrl,
      siteName: "PokeLink",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${collage.title1} / ${collage.title2}のコラージュ`,
        },
      ],
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function CollagePage() {
  return <CollagePageClient />
}
