import Image from "next/image"
import type { StrengthWeakness } from "../types/deck"

interface StrengthsWeaknessesProps {
  strengthsWeaknessesList: string[]
  strengthsWeaknessesDetails: StrengthWeakness[]
}

export function StrengthsWeaknesses({ strengthsWeaknessesList, strengthsWeaknessesDetails }: StrengthsWeaknessesProps) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <ul className="space-y-2">
          {strengthsWeaknessesList.map((item, index) => (
            <li key={index} className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {strengthsWeaknessesDetails.map((detail, index) => (
        <div key={index} className={index < strengthsWeaknessesDetails.length - 1 ? "mb-8" : ""}>
          <h4 className="font-medium mb-4 text-blue-600 border-l-4 border-blue-500 pl-3">{detail.title}</h4>
          {detail.image_urls && detail.image_urls.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <div className="flex gap-4 min-w-max">
                {detail.image_urls.map((imageUrl, imgIndex) => (
                  <div key={imgIndex} className="w-20 h-28 flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={`${detail.title} 画像 ${imgIndex + 1}`}
                        width={80}
                        height={112}
                        className="w-full h-full object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 rounded border"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: detail.description }} />
        </div>
      ))}
    </div>
  )
}
