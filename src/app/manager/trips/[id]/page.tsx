import TripDetails from '@/components/trip/trip-details';

export default async function ManagerTripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <TripDetails tripId={id} readonly={true} />
        </div>
    );
}
