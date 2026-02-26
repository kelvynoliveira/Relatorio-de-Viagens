import TripDetails from '@/components/trip/trip-details';
import { generateId } from '@/lib/utils'; // Keep import clean for server component if needed, but this is a page

// Next.js 14 params are promises or simple objects depending on context, usually simple in pages
export default async function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <TripDetails tripId={id} />
        </div>
    );
}
