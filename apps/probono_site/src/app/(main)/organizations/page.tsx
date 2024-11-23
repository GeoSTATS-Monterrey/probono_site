import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import {getApprovedOrganizationInfo} from '@/lib/models/organization.ts';
import OrganizationCard from '@/app/(main)/organizations/organization-card.tsx';
import {getAllSectors} from '@/lib/models/sector.ts';
import prisma from '@/lib/prisma.ts';
import SectorsForm from '@/app/(main)/organizations/location-sectors-map.tsx';
import {notFound} from 'next/navigation';

export default async function OrganizationsPage() {
	const organizations = await getApprovedOrganizationInfo();

	const organizationsWithAddresses = organizations.filter(organization =>
		Boolean(organization.location),
	) as Array<{
		id: number;
		name: string;
		location: [number, number];
	}>;

	const organizationSectors = await prisma.organization.findUniqueOrThrow({
		where: {
			id: 1,
		},
		select: {
			sectors: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!organizationSectors) {
		return {}; // o notFound(); según lo que necesites
	}

	const sectors = await getAllSectors();

	const organization = {
		...organizationSectors,
	};

	if (!organization) {
		notFound();
	}

	return (
		<main className='mx-auto min-h-screen max-w-screen-xl px-4 py-16'>
			<h1 className='mb-6 mt-4 text-4xl text-stone-50'>Organizaciones</h1>
			<div className='flex flex-wrap gap-8'>
				<SectorsForm
					sectors={sectors}
					organization={organization}
					organizations={organizationsWithAddresses}
				/>
				{organizations.map(org => (
					<OrganizationCard
						key={org.id}
						organization={org}
					/>
				))}
			</div>
		</main>
	);
}
