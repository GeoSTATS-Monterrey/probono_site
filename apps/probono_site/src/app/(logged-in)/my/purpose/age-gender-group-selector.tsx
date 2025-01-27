import {Item} from 'react-stately';
import {Set} from 'immutable';
import {type AgeGroup, type Gender} from '@prisma/client';
import {Select, List, type ImmutableListData} from 'geostats-ui';
import genders from '@/lib/genders.ts';

export type AgeGenderGroupSelectorProps = {
	readonly ageGroups: ImmutableListData<GenderedAgeGroup>;
};

export type GenderedAgeGroup = AgeGroup & {
	gender: Gender;
};

export default function AgeGenderGroupSelector(
	props: AgeGenderGroupSelectorProps,
) {
	const {ageGroups} = props;
	const {items, selectedKeys, setSelectedKeys, update} = ageGroups;

	return (
		<>
			<p className='mb-1 text-sm text-stone-300'>
				{' '}
				Si aplica, ¿a que grupos de edad atiende tu organización?{' '}
			</p>
			<List
				selectionMode='multiple'
				className='mb-4'
				aria-label='Grupos de edad'
				selectedKeys={selectedKeys}
				onSelectionChange={keys => {
					if (keys === 'all') {
						setSelectedKeys(keys);
						return;
					}

					setSelectedKeys(Set(keys));
				}}
			>
				{items
					.map(item => (
						<Item
							key={item.id}
							textValue={
								item.maxAge === null
									? `de ${item.minAge} años o más`
									: `de ${item.minAge} a ${item.maxAge} años`
							}
						>
							<div className='flex items-baseline gap-2'>
								<Select
									aria-label='genero'
									isDisabled={
										!(
											selectedKeys === 'all' ||
											selectedKeys.has(item.id.toString())
										)
									}
									selectedKey={item.gender}
									onSelectionChange={selectedKey => {
										update(item.id, {
											...item,
											gender: selectedKey as Gender,
										});
									}}
								>
									{genders
										.map(item => (
											<Item key={item.gender}>
												{item.label}
											</Item>
										))
										.toArray()}
								</Select>
								{item.maxAge === null
									? `de ${item.minAge} años o más`
									: `de ${item.minAge} a ${item.maxAge} años`}
							</div>
						</Item>
					))
					.toArray()}
			</List>
		</>
	);
}
