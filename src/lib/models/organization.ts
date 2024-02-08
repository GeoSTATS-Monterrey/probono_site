import {omit} from 'lodash';
import {del, put} from '@vercel/blob';
import {filetypeextension} from 'magic-bytes.js';
import {type Organization} from '@prisma/client';
import {type OrganizationInit, type OrganizationUpdate} from '@/lib/schemas/organization.ts';
import prisma from '@/lib/prisma.ts';
import {connectId} from '@/lib/models/util.ts';

/**
 * Creates a new organization with the specified owner and initialization data.
 *
 * @param {number} ownerId - The ID of the owner for the organization.
 * @param {OrganizationInit} init - The initialization data for the organization.
 * @returns {Promise<Organization>} - A promise that resolves to the created organization.
 * @throws {Error} - If the file extension for the logo is not found.
 */
export async function createOrganization(ownerId: number, init: OrganizationInit): Promise<Organization> {
	const organization = await prisma.$transaction(async tx => {
		const organization = await tx.organization.create({
			data: {
				...omit(init,
					'logo',
					'employeeCountCategoryId',
					'volunteerCountCategoryId',
					'workplaceTypeId',
					'incomeCategoryId',
					'corporationTypeId',
					'categoryId'),
				employeeCountCategory: connectId(init.employeeCountCategoryId),
				volunteerCountCategory: connectId(init.volunteerCountCategoryId),
				incomeCategory: connectId(init.incomeCategoryId),
				corporationType: connectId(init.corporationTypeId),
				address: init.address
					? {
						create: init.address,
					}
					: undefined,
				owners: {
					connect: {
						id: ownerId,
					},
				},
				ageGroups: init.ageGroups ? {
					create: init.ageGroups.map(ageGroup => ({
						ageGroupId: ageGroup.ageGroupId,
						gender: ageGroup.gender,
					})),
				} : undefined,
				activities: init.activities ? {
					create: init.activities.map((item, idx) => ({
						activityId: item.activityId,
						priority: idx,
					})),
				} : undefined,
				beneficiaries: init.beneficiaries ? {
					connect: init.beneficiaries.map(id => ({
						id,
					})),
				} : undefined,
			},
		});

		if (init.address) {
			await tx.$queryRaw`update "Address" 
                         set location=point(${init.address.location[0]}, ${init.address.location[1]})
                         from "Address" as a
                                  join "Organization" as o on a.id = o."addressId"
                         where o.id = ${organization.id}`;
		}

		return organization;
	});

	if (init.logo) {
		const fileStart = new Uint8Array(await init.logo.slice(0, 100).arrayBuffer());

		const extensions = filetypeextension(fileStart);

		if (extensions.length === 0) {
			throw new Error('Can\'t find correct extension for file.');
		}

		const result = await put(`organizationLogos/${organization.id}-${Date.now().valueOf()}.${extensions[0]}`, init.logo, {
			access: 'public',
		});

		return prisma.organization.update({
			where: {
				id: organization.id,
			},
			data: {
				logoUrl: result.url,
			},
		});
	}

	return organization;
}

/**
 * Updates an [organizationId] with the provided ID and update object.
 *
 * @param {number} organizationId - The ID of the [organizationId] to update.
 * @param {Partial<OrganizationInit>} update - The partial [organizationId] object containing the fields to update.
 * @return {Promise<void>} - A promise that resolves when the [organizationId] is successfully updated.
 * @throws {Error} - Throws an error if the logo image is not in a supported format.
 */
export async function updateOrganization(organizationId: number, update: OrganizationUpdate) {
	await prisma.$transaction(async tx => {
		if (update.ageGroups) {
			await tx.organizationToAgeGroup.deleteMany({
				where: {
					organizationId,
				},
			});
		}

		if (update.activities) {
			await tx.organizationToActivity.deleteMany({
				where: {
					organizationId,
				},
			});
		}

		await tx.organization.update({
			where: {
				id: organizationId,
			},
			data: {
				...omit(update,
					'logo',
					'categoryId',
					'employeeCountCategoryId',
					'volunteerCountCategoryId',
					'incomeCategoryId',
					'corporationTypeId'),
				employeeCountCategory: connectId(update.employeeCountCategoryId),
				volunteerCountCategory: connectId(update.volunteerCountCategoryId),
				incomeCategory: connectId(update.incomeCategoryId),
				corporationType: connectId(update.corporationTypeId),
				category: connectId(update.categoryId),
				address: update.address
					? {
						upsert: {
							update: omit(update.address, 'location'),
							create: omit(update.address, 'location'),
						},
					}
					: undefined,
				ageGroups: update.ageGroups
					? {
						createMany: {
							data: update.ageGroups.map(item => ({
								ageGroupId: item.ageGroupId,
								gender: item.gender,
							})),
						},
					}
					: undefined,
				activities: update.activities
					? {
						createMany: {
							data: update.activities.map((item, idx) => ({
								activityId: item.activityId,
								priority: idx,
							})),
						},
					}
					: undefined,
				beneficiaries: update.beneficiaries ? {
					set: update.beneficiaries.map(id => ({
						id,
					})),
				} : undefined,
			},
		});

		if (update.address) {
			await tx.$queryRaw`update "Address" 
                         set location=point(${update.address.location[0]}, ${update.address.location[1]})
                         from "Address" as a
                                  join "Organization" as o on a.id = o."addressId"
                         where o.id = ${organizationId}`;
		}
	});

	if (update.logo) {
		const fileStart = new Uint8Array(await update.logo.slice(0, 100).arrayBuffer());

		const extensions = filetypeextension(fileStart);

		if (extensions.length === 0) {
			throw new Error('Can\'t find correct extension for file.');
		}

		const {logoUrl: currentLogoUrl} = await prisma.organization.findFirstOrThrow({
			where: {
				id: organizationId,
			},
			select: {
				logoUrl: true,
			},
		});

		if (currentLogoUrl) {
			await del(currentLogoUrl);
		}

		const result = await put(`organizationLogos/${organizationId}-${Date.now().valueOf()}.${extensions[0]}`, update.logo, {
			access: 'public',
		});

		return prisma.organization.update({
			where: {
				id: organizationId,
			},
			data: {
				logoUrl: result.url,
			},
		});
	}
}
