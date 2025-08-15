import PickupInfo from "@/components/pickup-info"

// Assuming this is the basic structure of the page component
export default function InfoPage({ params }) {
  const { id } = params
  const pickups = [] // This should be replaced with actual data fetching logic

  return (
    <div>
      {/* ピックアップ情報 */}
      {Array.isArray(pickups) && pickups.length > 0 && <PickupInfo items={pickups} />}

      {/* ** rest of code here ** */}
    </div>
  )
}
