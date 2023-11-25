'use client';
import React from 'react';
import Link from 'next/link';
import Button from '@/components/button.tsx';
import PopoverButtonTrigger from '@/components/popover-button-trigger.tsx';
import Icon from '@/components/icon.tsx';

export default function AccountButton() {
	return (
		<PopoverButtonTrigger
			size='md'
			placement='bottom end' label={
				<>
					<Icon name='person'/>
					<Icon name='arrow_drop_down'/>
				</>
			}>
			<Link href='/api/auth/logout'>
				<Button variant='secondary'>Cerrar sesión</Button>
			</Link>
		</PopoverButtonTrigger>

	);
}
