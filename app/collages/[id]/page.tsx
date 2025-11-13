import type { Metadata } from "next"
import CollagePageClient from "./collage-page-client"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const collageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/collages/${params.id}`
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/api/collages/${params.id}/opengraph-image`

  return {
    title: "コラージュ - PokeLink",
    description: "ポケモンカードのコラージュ画像",
    openGraph: {
      title: "コラージュ - PokeLink",
      description: "ポケモンカードのコラージュ画像",
      url: collageUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "コラージュ画像",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "コラージュ - PokeLink",
      description: "ポケモンカードのコラージュ画像",
      images: [ogImageUrl],
    },
  }
}

export default function CollagePage() {
  return <CollagePageClient />
}
