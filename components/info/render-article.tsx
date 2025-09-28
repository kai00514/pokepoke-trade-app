import type React from "react"

interface Block {
  id: string
  type: string
  data: any
}

interface RenderArticleProps {
  blocks: Block[]
}

const RenderArticle: React.FC<RenderArticleProps> = ({ blocks }) => {
  return <div>{blocks.map((block) => renderBlock(block))}</div>
}

const renderBlock = (block: Block) => {
  switch (block.type) {
    case "key-value-table":
      const keyValueData = block.data as {
        title?: string
        rows: Array<{
          id: string
          key: string
          valueType: "text" | "card"
          textValue?: string
          cardValue?: {
            card_id: number
            name: string
            image_url?: string
          }
        }>
      }

      return (
        <div key={block.id} className="my-6">
          {keyValueData.title && <h3 className="font-bold text-lg mb-4">{keyValueData.title}</h3>}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {keyValueData.rows?.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-gray-300 bg-blue-50 px-4 py-3 font-medium text-sm min-w-[120px]">
                      {row.key}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      {row.valueType === "text" ? (
                        <div className="text-sm whitespace-pre-wrap">{row.textValue}</div>
                      ) : row.cardValue ? (
                        <div className="flex items-center space-x-3">
                          {row.cardValue.image_url && (
                            <img
                              src={row.cardValue.image_url || "/placeholder.svg"}
                              alt={row.cardValue.name}
                              className="w-16 h-20 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm">{row.cardValue.name}</p>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    // ** rest of code here **
    default:
      return null
  }
}

export default RenderArticle
