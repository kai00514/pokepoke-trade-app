import type React from "react"
import type { List } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { GetServerSideProps } from "next"

interface ListsPageProps {
  lists: List[]
}

const ListsPage: React.FC<ListsPageProps> = ({ lists }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lists</h1>
      <ul className="space-y-4">
        {lists.map((list) => (
          <li key={list.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{list.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(list.updated_at)
                .toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                .replace(/\//g, "/")
                .replace(",", "")}
            </p>
            {/* Additional list item details can be added here */}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<ListsPageProps> = async () => {
  const lists = await prisma.list.findMany()
  return {
    props: {
      lists,
    },
  }
}

export default ListsPage
